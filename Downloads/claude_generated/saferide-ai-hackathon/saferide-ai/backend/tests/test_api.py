"""
SafeRide AI — Backend Tests
Run: cd backend && pytest tests/ -v
"""
import sys, os, json, pytest

# Make sure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app, load_fleet


@pytest.fixture
def client():
    app.config["TESTING"] = True
    load_fleet()
    with app.test_client() as c:
        yield c


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────
def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.get_json()
    assert data["status"] == "ok"
    assert data["fleet_size"] == 100


# ─────────────────────────────────────────────────────────────────────────────
# start_trip
# ─────────────────────────────────────────────────────────────────────────────
def test_start_trip_bus(client):
    r = client.post("/api/start_trip", json={"user_id": "u1", "mode": "bus", "vehicle_id": "BUS_45A_01"})
    assert r.status_code == 201
    data = r.get_json()
    assert data["status"] == "active"
    assert data["trip_id"].startswith("TRIP-")


def test_start_trip_missing_vehicle(client):
    r = client.post("/api/start_trip", json={"user_id": "u1", "mode": "bus"})
    assert r.status_code == 400


def test_start_trip_cab(client):
    r = client.post("/api/start_trip", json={"user_id": "u2", "mode": "cab", "vehicle_id": "CAB-XYZ"})
    assert r.status_code == 201


# ─────────────────────────────────────────────────────────────────────────────
# trip_status
# ─────────────────────────────────────────────────────────────────────────────
def test_trip_status_not_found(client):
    r = client.get("/api/trip_status?trip_id=TRIP-NOPE")
    assert r.status_code == 404


def test_trip_status_found(client):
    r = client.post("/api/start_trip", json={"user_id": "u3", "mode": "bus", "vehicle_id": "BUS_X"})
    trip_id = r.get_json()["trip_id"]
    r2 = client.get(f"/api/trip_status?trip_id={trip_id}")
    assert r2.status_code == 200
    assert r2.get_json()["trip_id"] == trip_id


# ─────────────────────────────────────────────────────────────────────────────
# verify_bus
# ─────────────────────────────────────────────────────────────────────────────
def test_verify_bus_found(client):
    # Grab first plate from fleet
    fleet = app.config["FLEET_DB"]
    plate = fleet[0]["number_plate"]
    r = client.post("/api/verify_bus", json={"number_plate": plate})
    assert r.status_code == 200
    data = r.get_json()
    assert data["verified"] is True
    assert data["bus"]["number_plate"] == plate


def test_verify_bus_not_found(client):
    r = client.post("/api/verify_bus", json={"number_plate": "XX00XX0000"})
    assert r.status_code == 404
    assert r.get_json()["verified"] is False


def test_verify_bus_no_input(client):
    r = client.post("/api/verify_bus", json={})
    assert r.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# risk_score
# ─────────────────────────────────────────────────────────────────────────────
def test_risk_score_basic(client):
    # Start a trip first
    r = client.post("/api/start_trip", json={"user_id": "u4", "mode": "bus", "vehicle_id": "BUS_T"})
    trip_id = r.get_json()["trip_id"]

    r2 = client.post("/api/risk_score", json={
        "trip_id": trip_id, "lat": 12.9716, "lng": 77.5946, "speed": 40
    })
    assert r2.status_code == 200
    d = r2.get_json()
    assert 0.0 <= d["risk_score"] <= 1.0
    assert d["risk_level"] in ("low", "medium", "high", "critical")
    assert isinstance(d["reason_tags"], list)


def test_risk_score_high_risk_zone(client):
    """Silk Board Junction → should produce higher risk."""
    r = client.post("/api/start_trip", json={"user_id": "u5", "mode": "bus", "vehicle_id": "BUS_SB"})
    trip_id = r.get_json()["trip_id"]
    # Silk Board coords
    r2 = client.post("/api/risk_score", json={
        "trip_id": trip_id, "lat": 12.9174, "lng": 77.6228, "speed": 5
    })
    d = r2.get_json()
    assert d["zone_name"] == "Silk Board Junction"
    assert d["risk_level"] in ("medium", "high", "critical")


# ─────────────────────────────────────────────────────────────────────────────
# ocr_plate stub
# ─────────────────────────────────────────────────────────────────────────────
def test_ocr_plate_stub(client):
    r = client.post("/api/ocr_plate", json={"image_b64": "fakebytes=="})
    assert r.status_code == 200
    d = r.get_json()
    assert "plate_text" in d
    assert d["plate_text"].startswith("KA")


# ─────────────────────────────────────────────────────────────────────────────
# dashboard
# ─────────────────────────────────────────────────────────────────────────────
def test_dashboard_summary(client):
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    assert "active_trips" in r.get_json()


def test_dashboard_heatmap(client):
    r = client.get("/api/dashboard/heatmap")
    assert r.status_code == 200
    assert len(r.get_json()["cells"]) > 0


def test_end_trip(client):
    r = client.post("/api/start_trip", json={"user_id": "u6", "mode": "cab", "vehicle_id": "CAB-Y"})
    trip_id = r.get_json()["trip_id"]
    r2 = client.post("/api/end_trip", json={"trip_id": trip_id})
    assert r2.status_code == 200
    assert r2.get_json()["status"] == "completed"
