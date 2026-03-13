# SafeRide AI — API Specification

Base URL: `http://localhost:5000` (dev) | `https://saferide-api.onrender.com` (prod)

All requests/responses use `Content-Type: application/json`.
Auth header (placeholder): `X-SafeRide-Token: {{SAFERIDE_API_TOKEN}}`

---

## 1. Health Check

### `GET /health`

**Response 200:**
```json
{
  "status": "ok",
  "service": "saferide-api",
  "fleet_size": 100
}
```

---

## 2. Trips

### `POST /api/start_trip`

Start a new monitored trip session.

**Request body:**
```json
{
  "user_id":    "user_abc123",
  "mode":       "bus",
  "vehicle_id": "BUS_45A_01"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `user_id` | string | yes | Passenger identifier |
| `mode` | `"bus"` \| `"cab"` | yes | Trip mode |
| `vehicle_id` | string | yes | Bus ID or cab vehicle ID |

**Response 201:**
```json
{
  "trip_id":    "TRIP-A1B2C3D4",
  "status":     "active",
  "started_at": "2026-03-13T10:30:00Z"
}
```

**Error 400:**
```json
{ "error": "vehicle_id is required" }
```

---

### `GET /api/trip_status?trip_id=TRIP-A1B2C3D4`

Get current trip state including last GPS, risk score, events.

**Response 200:**
```json
{
  "trip_id":          "TRIP-A1B2C3D4",
  "user_id":          "user_abc123",
  "mode":             "bus",
  "vehicle_id":       "BUS_45A_01",
  "status":           "active",
  "started_at":       "2026-03-13T10:30:00Z",
  "ended_at":         null,
  "last_gps": {
    "lat":       12.9174,
    "lng":       77.6228,
    "timestamp": "2026-03-13T10:35:12Z"
  },
  "risk_score":       0.783,
  "risk_reason_tags": ["high_risk_zone", "speeding"],
  "events": [
    {
      "type":      "risk_high",
      "message":   "Risk HIGH near Silk Board Junction",
      "timestamp": "2026-03-13T10:35:12Z",
      "lat":       12.9174,
      "lng":       77.6228,
      "tags":      ["high_risk_zone"]
    }
  ],
  "gps_trail": [
    { "lat": 12.9716, "lng": 77.5946, "timestamp": "2026-03-13T10:30:00Z" },
    { "lat": 12.9174, "lng": 77.6228, "timestamp": "2026-03-13T10:35:12Z" }
  ]
}
```

**Error 404:**
```json
{ "error": "trip not found" }
```

---

### `POST /api/end_trip`

End an active trip.

**Request body:**
```json
{ "trip_id": "TRIP-A1B2C3D4" }
```

**Response 200:**
```json
{
  "trip_id":  "TRIP-A1B2C3D4",
  "status":   "completed",
  "ended_at": "2026-03-13T11:05:00Z"
}
```

---

### `GET /api/active_trips`

List all currently active trips (for dashboard).

**Response 200:**
```json
{
  "count": 3,
  "trips": [ /* array of trip objects */ ]
}
```

---

## 3. Verification

### `POST /api/verify_bus`

Look up a bus by plate number or bus ID in the BMTC fleet database.

**Request body:**
```json
{ "number_plate": "KA01AB1234" }
```
or
```json
{ "bus_id": "BUS_45A_01" }
```

**Response 200 (found):**
```json
{
  "verified": true,
  "bus": {
    "bus_id":            "BUS_45A_01",
    "number_plate":      "KA01AB1234",
    "route":             "45A",
    "driver_name":       "Ramesh Kumar",
    "gps_device_id":     "GPS1001",
    "last_lat":          12.9715987,
    "last_lng":          77.5945627,
    "last_seen":         "2026-03-13T10:15:00Z",
    "status":            "in_transit",
    "next_stop":         "Majestic",
    "speed_kmh":         35.2,
    "capacity":          60,
    "current_occupancy": 42,
    "vehicle_age_years": 4,
    "last_maintenance":  "2026-01-15"
  }
}
```

**Response 404 (not found):**
```json
{
  "verified": false,
  "message": "Plate not found in local fleet. Vahan API lookup skipped (placeholder).",
  "vahan_api_key_needed": "{{VAHAN_API_KEY}}"
}
```

**Error 400:**
```json
{ "error": "number_plate or bus_id required" }
```

---

### `POST /api/ocr_plate`

Run OCR on a base64-encoded plate image (stub; returns mock in demo mode).

**Request body:**
```json
{ "image_b64": "<base64 encoded JPEG/PNG>" }
```

**Response 200:**
```json
{
  "plate_text":  "KA19GH3456",
  "confidence":  0.92,
  "method":      "mock_stub",
  "note":        "Replace stub with OpenCV + Tesseract pipeline"
}
```

---

## 4. Risk Scoring

### `POST /api/risk_score`

Submit a GPS ping for a trip; receives computed risk score. Also updates the in-memory trip record and emits a Socket.IO `risk_update` event to subscribers.

**Request body:**
```json
{
  "trip_id":   "TRIP-A1B2C3D4",
  "lat":       12.9174,
  "lng":       77.6228,
  "speed":     45.0,
  "timestamp": "2026-03-13T10:35:12Z"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `trip_id` | string | no | If provided, trip record is updated |
| `lat` | float | yes | Latitude (Bengaluru ~12.9–13.1) |
| `lng` | float | yes | Longitude (Bengaluru ~77.5–77.7) |
| `speed` | float | no | Speed in km/h (default 0) |
| `timestamp` | ISO string | no | Defaults to server time |

**Response 200:**
```json
{
  "trip_id":    "TRIP-A1B2C3D4",
  "risk_score": 0.783,
  "risk_level": "high",
  "reason_tags": ["high_risk_zone", "speeding"],
  "zone_name":  "Silk Board Junction",
  "timestamp":  "2026-03-13T10:35:12Z",
  "source":     "tf_model"
}
```

**Risk levels:**

| Score Range | Level | Color |
|-------------|-------|-------|
| 0.00 – 0.29 | `low` | 🟢 #0E9F6E |
| 0.30 – 0.59 | `medium` | 🟡 #D97706 |
| 0.60 – 0.79 | `high` | 🟠 #E3702E |
| 0.80 – 1.00 | `critical` | 🔴 #E02424 |

**Possible `reason_tags`:**
- `high_risk_zone` — within a flagged geofence
- `speeding` — speed > 60 km/h
- `late_night` — hour < 6 or > 22
- `anomaly_detected` — model output > 0.7 threshold

---

## 5. Model Inference (direct, port 5001)

### `POST /infer`  _(model microservice)_

Direct inference endpoint on the TF model service.

**Request body:**
```json
{
  "trip_id":       "TRIP-A1B2C3D4",
  "lat":           12.9174,
  "lng":           77.6228,
  "speed":         45.0,
  "stop_duration": 0,
  "time_of_day":   23,
  "area_risk":     0.9
}
```

**Response 200:**
```json
{
  "risk_score":  0.812,
  "reason_tags": ["high_risk_zone", "late_night", "anomaly_detected"],
  "source":      "tf_model"
}
```

---

## 6. Dashboard

### `GET /api/dashboard/summary`

**Response 200:**
```json
{
  "active_trips":  5,
  "total_fleet":   100,
  "alerts_today":  3,
  "avg_risk":      0.241,
  "as_of":         "2026-03-13T10:45:00Z"
}
```

---

### `GET /api/dashboard/alerts`

Last 50 high/critical events across all trips.

**Response 200:**
```json
{
  "alerts": [
    {
      "type":      "risk_critical",
      "message":   "Risk CRITICAL near Silk Board Junction",
      "timestamp": "2026-03-13T10:35:12Z",
      "lat":       12.9174,
      "lng":       77.6228,
      "tags":      ["high_risk_zone"],
      "trip_id":   "TRIP-A1B2C3D4",
      "mode":      "bus"
    }
  ]
}
```

---

### `GET /api/dashboard/heatmap`

40 mocked risk-weight cells for heatmap overlay.

**Response 200:**
```json
{
  "cells": [
    { "lat": 12.9174, "lng": 77.6228, "weight": 0.91 },
    { "lat": 13.0358, "lng": 77.5970, "weight": 0.78 }
  ],
  "as_of": "2026-03-13T10:45:00Z"
}
```

---

## Socket.IO Events

Connect: `io("http://localhost:5000")`

| Event (emit) | Payload | Description |
|---|---|---|
| `subscribe_trip` | `{ trip_id }` | Join trip room for live updates |

| Event (receive) | Payload | Description |
|---|---|---|
| `subscribed` | `{ trip_id }` | Confirmed subscription |
| `risk_update` | `RiskScoreResponse` | New GPS ping processed |
| `trip_started` | Trip object | New trip created |

---

## Sample curl Commands

```bash
BASE="http://localhost:5000"

# 1. Start bus trip
TRIP=$(curl -s -X POST $BASE/api/start_trip \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"demo","mode":"bus","vehicle_id":"BUS_45A_01"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['trip_id'])")

echo "Trip ID: $TRIP"

# 2. Push GPS ping (normal zone)
curl -s -X POST $BASE/api/risk_score \
  -H 'Content-Type: application/json' \
  -d "{\"trip_id\":\"$TRIP\",\"lat\":12.9716,\"lng\":77.5946,\"speed\":35}" | python3 -m json.tool

# 3. Push GPS ping (Silk Board — HIGH RISK)
curl -s -X POST $BASE/api/risk_score \
  -H 'Content-Type: application/json' \
  -d "{\"trip_id\":\"$TRIP\",\"lat\":12.9174,\"lng\":77.6228,\"speed\":60}" | python3 -m json.tool

# 4. Get trip status
curl -s "$BASE/api/trip_status?trip_id=$TRIP" | python3 -m json.tool

# 5. Verify a bus plate
curl -s -X POST $BASE/api/verify_bus \
  -H 'Content-Type: application/json' \
  -d '{"number_plate":"KA01AB1234"}' | python3 -m json.tool

# 6. Dashboard summary
curl -s $BASE/api/dashboard/summary | python3 -m json.tool

# 7. End trip
curl -s -X POST $BASE/api/end_trip \
  -H 'Content-Type: application/json' \
  -d "{\"trip_id\":\"$TRIP\"}" | python3 -m json.tool
```
