# SafeRide AI — Demo Script
## 1–2 Minute Spoken Pitch + Step-by-Step Run Sequence

---

## 🎤 Spoken Pitch (90 seconds)

> _[Start timer. Speak at a calm, confident pace.]_

**[0:00 – 0:15] — Hook**
"Every day, 7 million people commute in Bengaluru. They board buses with no way to verify if the vehicle is safe, and take cabs with no live risk monitoring. SafeRide AI changes that."

**[0:15 – 0:30] — What it is**
"SafeRide AI is a real-time commute safety platform — for buses AND cabs — powered by GeoAI risk detection. It verifies vehicles using our BMTC fleet database, monitors your trip location every 3 seconds, and uses a trained TensorFlow model to predict safety risk before you enter a danger zone."

**[0:30 – 0:55] — Live demo walk-through**
"Watch this. [DEMO STEP 1] I tap 'Bus', search route 45A, and see 6 live buses with occupancy and speed. [DEMO STEP 2] I tap a bus — SafeRide instantly verifies the plate against our fleet of 100 registered BMTC buses. Verified. [DEMO STEP 3] I start the trip. The map goes live. [DEMO STEP 4] I simulate a GPS ping near Silk Board Junction — one of Bengaluru's top accident blackspots — and immediately the risk badge turns CRITICAL, an alert fires, and our Explainable AI panel tells me exactly why: high-risk zone, late night, anomaly detected."

**[0:55 – 1:15] — Tech differentiation**
"Under the hood: a 6-feature neural network trained on spatial and temporal patterns. Haversine geofencing for 5 known risk zones. Socket.IO for sub-second realtime updates. Modular microservices — swap the mock model for a production model with real accident history data. And the operator dashboard gives BMTC the bird's-eye view they've never had."

**[1:15 – 1:30] — Close**
"SafeRide AI is production-ready architecture in a hackathon-friendly package. Same system works for any city — plug in Delhi, Mumbai, or Chennai data. Our ask: pilot access to BMTC GPS feeds and Vahan API keys. Thank you."

---

## 🖥️ Demo Step Sequence (with exact commands)

Run these in order before the demo. Each step < 30 seconds to execute.

### PRE-DEMO SETUP (5 minutes before)

```bash
# Terminal 1 — Model service
cd saferide-ai
source venv/bin/activate
python model_service/app.py
# Wait for: "Running on http://0.0.0.0:5001"
```

```bash
# Terminal 2 — Flask backend
source venv/bin/activate
PYTHONPATH=. python backend/app.py
# Wait for: "Loaded 100 fleet records" + "Running on http://0.0.0.0:5000"
```

```bash
# Terminal 3 — Prepare simulator (don't run yet)
source venv/bin/activate
# Will run: python simulator/simulate_bus.py --buses 3 --interval 3
```

```bash
# Browser — Open dashboard
open dashboard/index.html
# Shows "Active Trips: 0" — will fill up once simulator runs
```

```bash
# Terminal 4 — Mobile app (if using simulator device)
cd frontend && npx expo start
```

---

### DEMO STEP 1 — Show home screen + verify backend (0:30)

**Say:** "Here's the SafeRide app. Two modes — Bus and Cab. The backend is live."

```bash
# Quick proof the backend is running:
curl http://localhost:5000/health
# Expected: {"fleet_size":100,"service":"saferide-api","status":"ok"}
```

**UI action:** Tap "Bus" on home screen.

---

### DEMO STEP 2 — Route search + verify bus (0:20)

**Say:** "I search for route 45A…"

**UI action:** Tap chip "45A" → nearby bus list appears → tap first bus card.

```bash
# Show verify_bus working in terminal:
curl -s -X POST http://localhost:5000/api/verify_bus \
  -H 'Content-Type: application/json' \
  -d '{"number_plate":"KA01AB1234"}' | python3 -m json.tool
# Expected: {"verified": true, "bus": {...}}
```

**UI action:** Verification card shows "✅ VERIFIED" with full bus details.

---

### DEMO STEP 3 — Start trip + launch simulator (0:20)

**Say:** "I start the safe trip. The system creates a trip session and begins monitoring."

**UI action:** Tap "🛡️ Start Safe Trip" → map screen opens, trip ID visible.

```bash
# Terminal 3 — start simulator simultaneously:
python simulator/simulate_bus.py --buses 3 --interval 3
# Watch risk scores appear in real-time
```

**Say:** "The simulator is now sending live GPS pings for 3 buses every 3 seconds."

---

### DEMO STEP 4 — Trigger high-risk zone (KEY MOMENT) (0:20)

**Say:** "Now watch what happens when our cab approaches Silk Board Junction…"

```bash
# Send a risk ping to Silk Board (CRITICAL zone):
TRIP_ID="TRIP-XXXX"   # replace with actual trip_id from start_trip response
curl -s -X POST http://localhost:5000/api/risk_score \
  -H 'Content-Type: application/json' \
  -d "{\"trip_id\":\"$TRIP_ID\",\"lat\":12.9174,\"lng\":77.6228,\"speed\":65}" \
  | python3 -m json.tool
```

Expected response:
```json
{
  "risk_score": 0.831,
  "risk_level": "critical",
  "reason_tags": ["high_risk_zone", "speeding"],
  "zone_name": "Silk Board Junction"
}
```

**UI:** Risk badge turns 🔴 CRITICAL with pulse animation. Alert modal fires with countdown. Explainable AI panel shows factor breakdown.

**Say:** "Risk critical. Zone: Silk Board Junction. Reason tags: high-risk zone, speeding. The passenger sees exactly why — not just a number."

---

### DEMO STEP 5 — Dashboard (0:15)

**Say:** "Meanwhile, the operator dashboard…"

**Browser action:** Switch to `dashboard/index.html` tab. Show:
- Active trips counter ticking up
- Live alerts feed showing the CRITICAL event
- Bubble heatmap with red clusters at Silk Board
- Risk trend chart

**Say:** "BMTC operators see every active trip, every alert, and the city-wide risk heatmap — all live."

---

### DEMO STEP 6 — Cab flow (if time) (0:20)

```bash
# Run full cab simulator (MG Road → HSR via Silk Board):
python simulator/simulate_cab.py
# Watch: green → medium → HIGH → CRITICAL at Silk Board → back to low
```

**Say:** "Same system for cabs — driver verified, trip monitored, risk scored at every waypoint."

---

### CLOSING

**Say:** "Fleet database — 100 buses. Model — trained in 8 seconds. Demo — fully live. Production — same codebase, real GPS feeds, Vahan API integration, Firebase realtime. SafeRide AI. Thank you."

---

## 🚨 Contingency (if backend is down)

1. Show `dashboard/index.html` in offline mode — the mock heatmap and chart still render
2. Walk through the API spec (`docs/api_spec.md`) and show the curl commands with expected responses
3. Show the frontend screens directly in Expo Go — the UI works in offline mode with mock data fallback
4. Show `train_model.py` — demo training in ~8 seconds live

---

## 📋 Demo Checklist

Before going on stage:

- [ ] Backend running on port 5000 (`curl localhost:5000/health` returns 200)
- [ ] Model service on port 5001 (`curl localhost:5001/health` returns `model_loaded: true`)
- [ ] `dashboard/index.html` open in browser, showing "Active Trips: 0"
- [ ] Expo Go app open on phone with app loaded
- [ ] `simulate_bus.py` command ready in Terminal 3 (don't run yet)
- [ ] Silk Board curl command ready in Terminal 4 with trip_id pre-filled
- [ ] Screen mirroring / projector connected and tested
- [ ] Laptop battery plugged in
