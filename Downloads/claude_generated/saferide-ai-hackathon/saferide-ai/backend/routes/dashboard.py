"""
SafeRide AI — Dashboard Routes
GET /api/dashboard/summary
GET /api/dashboard/alerts
GET /api/dashboard/heatmap
"""
import random
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, current_app

dashboard_bp = Blueprint("dashboard", __name__)

def _now():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@dashboard_bp.get("/dashboard/summary")
def summary():
    trips = list(current_app.config.get("TRIPS", {}).values())
    active  = [t for t in trips if t["status"] == "active"]
    fleet   = current_app.config.get("FLEET_DB", [])
    alerts  = [e for t in trips for e in t.get("events", []) if "risk_high" in e.get("type","") or "risk_critical" in e.get("type","")]
    return jsonify({
        "active_trips":  len(active),
        "total_fleet":   len(fleet),
        "alerts_today":  len(alerts),
        "avg_risk":      round(sum(t["risk_score"] for t in active) / max(len(active),1), 3),
        "as_of":         _now(),
    }), 200


@dashboard_bp.get("/dashboard/alerts")
def alerts():
    trips = list(current_app.config.get("TRIPS", {}).values())
    all_events = []
    for t in trips:
        for e in t.get("events", []):
            all_events.append({**e, "trip_id": t["trip_id"], "mode": t["mode"]})
    all_events.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify({"alerts": all_events[:50]}), 200


@dashboard_bp.get("/dashboard/heatmap")
def heatmap():
    """Returns mocked heatmap cells around Bengaluru."""
    cells = []
    for _ in range(40):
        lat = round(random.uniform(12.90, 13.08), 5)
        lng = round(random.uniform(77.52, 77.70), 5)
        weight = round(random.uniform(0.1, 1.0), 2)
        cells.append({"lat": lat, "lng": lng, "weight": weight})
    return jsonify({"cells": cells, "as_of": _now()}), 200
