"""
SafeRide AI — Risk Scoring Route
POST /api/risk_score  — receives GPS ping, calls model service, updates trip
"""
import math, os, time, requests
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app

risk_bp = Blueprint("risk", __name__)

MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://localhost:5001")

# ── Haversine helper ─────────────────────────────────────────────────────────
def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


# ── High-risk zones (mocked Bengaluru hotspots) ───────────────────────────────
HIGH_RISK_ZONES = [
    {"name": "Silk Board Junction", "lat": 12.9174,  "lng": 77.6228, "radius_km": 0.5},
    {"name": "Hebbal Flyover",       "lat": 13.0358,  "lng": 77.5970, "radius_km": 0.4},
    {"name": "KR Puram Signal",      "lat": 13.0027,  "lng": 77.6958, "radius_km": 0.3},
    {"name": "Koramangala 4th Blk",  "lat": 12.9347,  "lng": 77.6205, "radius_km": 0.35},
    {"name": "Majestic Hub",         "lat": 12.9766,  "lng": 77.5713, "radius_km": 0.4},
]

def area_risk_factor(lat, lng):
    """Returns 0.0–1.0; 1.0 = highest risk zone."""
    for zone in HIGH_RISK_ZONES:
        dist = haversine_km(lat, lng, zone["lat"], zone["lng"])
        if dist <= zone["radius_km"]:
            return 0.9, zone["name"]
    return 0.1, "normal_area"


def call_model_service(payload):
    """Call the TF model microservice. Falls back to heuristic on failure."""
    try:
        resp = requests.post(f"{MODEL_SERVICE_URL}/infer", json=payload, timeout=2)
        if resp.ok:
            return resp.json()
    except Exception:
        pass
    # Fallback heuristic
    speed     = payload.get("speed", 0)
    area_risk = payload.get("area_risk", 0.1)
    hour      = payload.get("time_of_day", 12)
    night_factor = 0.3 if (hour < 6 or hour > 22) else 0.0
    score = min(1.0, area_risk * 0.5 + (speed / 120) * 0.3 + night_factor)
    tags = []
    if area_risk > 0.7: tags.append("high_risk_zone")
    if speed > 60:       tags.append("speeding")
    if night_factor:     tags.append("late_night")
    return {"risk_score": round(score, 3), "reason_tags": tags, "source": "heuristic_fallback"}


# ── POST /api/risk_score ──────────────────────────────────────────────────────
@risk_bp.post("/risk_score")
def risk_score():
    """
    Body: { trip_id, lat, lng, speed?, timestamp? }
    Returns: { trip_id, risk_score, risk_level, reason_tags, zone_name }
    Side-effect: updates in-memory trip and emits Socket.IO event.
    """
    body = request.get_json(silent=True) or {}
    trip_id   = body.get("trip_id")
    lat       = float(body.get("lat", 12.9716))
    lng       = float(body.get("lng", 77.5946))
    speed     = float(body.get("speed", 0))
    timestamp = body.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    area_risk, zone_name = area_risk_factor(lat, lng)
    hour = datetime.utcnow().hour

    model_payload = {
        "trip_id":       trip_id,
        "lat":           lat,
        "lng":           lng,
        "speed":         speed,
        "stop_duration": 0,
        "time_of_day":   hour,
        "area_risk":     area_risk,
    }
    result = call_model_service(model_payload)
    score  = result["risk_score"]
    tags   = result.get("reason_tags", [])

    # Risk level label
    if score < 0.3:   risk_level = "low"
    elif score < 0.6: risk_level = "medium"
    elif score < 0.8: risk_level = "high"
    else:             risk_level = "critical"

    # Update trip record
    trips = current_app.config.get("TRIPS", {})
    if trip_id and trip_id in trips:
        trip = trips[trip_id]
        trip["risk_score"] = score
        trip["risk_reason_tags"] = tags
        trip["last_gps"] = {"lat": lat, "lng": lng, "timestamp": timestamp}
        trip["gps_trail"].append({"lat": lat, "lng": lng, "timestamp": timestamp})
        if risk_level in ("high", "critical"):
            trip["events"].append({
                "type":      f"risk_{risk_level}",
                "message":   f"Risk {risk_level.upper()} near {zone_name}",
                "timestamp": timestamp,
                "lat":       lat,
                "lng":       lng,
                "tags":      tags,
            })

        # Push realtime update
        try:
            from app import socketio
            socketio.emit("risk_update", {
                "trip_id":    trip_id,
                "risk_score": score,
                "risk_level": risk_level,
                "reason_tags": tags,
                "zone_name":  zone_name,
                "lat":        lat,
                "lng":        lng,
                "timestamp":  timestamp,
            }, room=trip_id)
        except Exception:
            pass

    return jsonify({
        "trip_id":    trip_id,
        "risk_score": score,
        "risk_level": risk_level,
        "reason_tags": tags,
        "zone_name":  zone_name,
        "timestamp":  timestamp,
        "source":     result.get("source", "model_service"),
    }), 200
