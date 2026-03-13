"""
SafeRide AI — Trip Routes
POST /api/start_trip
GET  /api/trip_status
POST /api/end_trip
"""
import uuid, time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app

trips_bp = Blueprint("trips", __name__)


def _now_iso():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


# ── POST /api/start_trip ──────────────────────────────────────────────────────
@trips_bp.post("/start_trip")
def start_trip():
    """
    Body: { user_id, mode: "bus"|"cab", vehicle_id, ride_id? }
    Returns: { trip_id, status, started_at }
    """
    body = request.get_json(silent=True) or {}
    user_id  = body.get("user_id", "anonymous")
    mode     = body.get("mode", "bus")
    vehicle_id = body.get("vehicle_id") or body.get("ride_id")

    if not vehicle_id:
        return jsonify({"error": "vehicle_id is required"}), 400

    trip_id = f"TRIP-{uuid.uuid4().hex[:8].upper()}"
    trip = {
        "trip_id":    trip_id,
        "user_id":    user_id,
        "mode":       mode,
        "vehicle_id": vehicle_id,
        "status":     "active",
        "started_at": _now_iso(),
        "ended_at":   None,
        "last_gps":   {"lat": None, "lng": None, "timestamp": None},
        "risk_score":  0,
        "risk_reason_tags": [],
        "events":     [],          # list of {type, message, timestamp, lat, lng}
        "gps_trail":  [],          # list of {lat, lng, timestamp}
    }
    current_app.config["TRIPS"][trip_id] = trip

    # Optionally broadcast start event via Socket.IO
    try:
        from app import socketio
        socketio.emit("trip_started", trip, room=trip_id)
    except Exception:
        pass

    return jsonify({"trip_id": trip_id, "status": "active", "started_at": trip["started_at"]}), 201


# ── GET /api/trip_status?trip_id= ────────────────────────────────────────────
@trips_bp.get("/trip_status")
def trip_status():
    trip_id = request.args.get("trip_id")
    if not trip_id:
        return jsonify({"error": "trip_id is required"}), 400

    trip = current_app.config["TRIPS"].get(trip_id)
    if not trip:
        return jsonify({"error": "trip not found"}), 404

    return jsonify(trip), 200


# ── POST /api/end_trip ────────────────────────────────────────────────────────
@trips_bp.post("/end_trip")
def end_trip():
    body = request.get_json(silent=True) or {}
    trip_id = body.get("trip_id")
    trip = current_app.config["TRIPS"].get(trip_id)
    if not trip:
        return jsonify({"error": "trip not found"}), 404

    trip["status"] = "completed"
    trip["ended_at"] = _now_iso()
    return jsonify({"trip_id": trip_id, "status": "completed", "ended_at": trip["ended_at"]}), 200


# ── GET /api/active_trips (for dashboard) ────────────────────────────────────
@trips_bp.get("/active_trips")
def active_trips():
    trips = [t for t in current_app.config["TRIPS"].values() if t["status"] == "active"]
    return jsonify({"count": len(trips), "trips": trips}), 200
