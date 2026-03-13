# 🛡️ SafeRide AI

**AI-powered commute safety for Bengaluru — Bus + Cab flows with GeoAI risk detection**

> Hackathon prototype · End-to-end runnable in ~5 hours  
> Stack: React Native (Expo) + Flask + TensorFlow + Socket.IO + React Native Maps

---

## 📁 Repository Structure

```
saferide-ai/
├── data/
│   └── fleet_db.json           # 100-row BMTC fleet dataset
├── backend/
│   ├── app.py                  # Flask app entry point
│   ├── routes/
│   │   ├── trips.py            # start_trip, trip_status, end_trip
│   │   ├── verify.py           # verify_bus, ocr_plate
│   │   ├── risk.py             # risk_score (calls model service)
│   │   └── dashboard.py        # summary, alerts, heatmap
│   └── tests/
│       └── test_api.py         # pytest test suite (17 tests)
├── model_service/
│   ├── app.py                  # TF inference microservice (port 5001)
│   └── saved_model/            # Created after running train_model.py
├── simulator/
│   ├── simulate_bus.py         # Streams N bus GPS pings to backend
│   └── simulate_cab.py         # Simulates full cab route (MG Rd → HSR)
├── frontend/
│   ├── App.tsx                 # React Navigation root
│   ├── src/
│   │   ├── theme/tokens.ts     # Design tokens (colors, spacing, etc.)
│   │   ├── services/
│   │   │   ├── api.ts          # All HTTP calls to Flask backend
│   │   │   └── realtimeService.ts  # Socket.IO + polling fallback
│   │   ├── components/
│   │   │   ├── RiskBadge.tsx   # Animated risk score badge
│   │   │   └── AlertComponents.tsx  # Banner, Modal, ExplainableAI panel
│   │   └── screens/
│   │       ├── HomeScreen.tsx
│   │       ├── BusScreens.tsx  # RouteSearch, Nearby, Verify, Monitor
│   │       ├── CabScreens.tsx  # Booking, DriverDetails, Monitor
│   │       └── DashboardScreen.tsx
│   └── __tests__/
│       └── components.test.tsx # Jest tests (25 test cases)
├── dashboard/
│   └── index.html              # Standalone web operator dashboard
├── ocr_stub/
│   └── plate_ocr.py            # OpenCV + Tesseract stub
├── ci/
│   └── run_tests.sh            # CI runner script
├── train_model.py              # TF model training (< 10 seconds)
├── Dockerfile.backend
├── Dockerfile.model
├── docker-compose.yml
├── Procfile                    # Heroku/Render
└── requirements.txt
```

---

## ⚡ Quick Start (Local — ~20 minutes)

### Prerequisites

| Tool      | Version | Install |
|-----------|---------|---------|
| Python    | 3.10+   | python.org |
| Node.js   | 18+     | nodejs.org |
| Expo CLI  | latest  | `npm i -g expo-cli` |
| Git       | any     | git-scm.com |

---

### Step 1 — Clone & install backend

```bash
git clone https://github.com/your-org/saferide-ai.git
cd saferide-ai

python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### Step 2 — Train the ML model (optional but recommended)

```bash
# Takes ~5-10 seconds, creates model_service/saved_model/
python train_model.py
```

Expected output:
```
Epoch 20/20 — loss: 0.0087 — mae: 0.0724 — val_mae: 0.0788
✅ Training done — val MAE: 0.0788
✅ Model saved to model_service/saved_model
  sample 0: predicted_risk=0.412
  sample 1: predicted_risk=0.157
  sample 2: predicted_risk=0.683
```

### Step 3 — Start the backend services

**Terminal A — Model service (port 5001):**
```bash
source venv/bin/activate
python model_service/app.py
# → Running on http://0.0.0.0:5001
```

**Terminal B — Main Flask API (port 5000):**
```bash
source venv/bin/activate
PYTHONPATH=. python backend/app.py
# → Loaded 100 fleet records
# → Running on http://0.0.0.0:5000
```

### Step 4 — Verify backend is running

```bash
curl http://localhost:5000/health
# {"fleet_size":100,"service":"saferide-api","status":"ok"}

curl http://localhost:5001/health
# {"model_loaded":true,"status":"ok"}
```

### Step 5 — Open the web dashboard

```bash
# Open in browser (no server needed):
open dashboard/index.html
# or on Linux:
xdg-open dashboard/index.html
```

> ℹ️ Dashboard auto-refreshes every 10 seconds. The API URL defaults to `http://localhost:5000`.

### Step 6 — Run the GPS simulator

**Bus simulator (5 buses, 3-second pings):**
```bash
source venv/bin/activate
python simulator/simulate_bus.py --buses 5 --interval 3
```

Expected output:
```
🚌 SafeRide Simulator starting — 5 buses, 3.0s interval
   Backend: http://localhost:5000

  ✅ Trip started: TRIP-A1B2C3D4 — Bus BUS_365_01 (365)
  ✅ Trip started: TRIP-E5F6G7H8 — Bus BUS_45A_02 (45A)
  ...
────────────────────────────────────────────────────────
  Bus ID               Trip ID            Lat         Lng   Risk  Level
  BUS_365_01           TRIP-A1B2C3D4  12.97441    77.59782  0.142  low
  BUS_45A_02           TRIP-E5F6G7H8  12.98123    77.60011  0.089  low
  ...
```

**Cab simulator (full MG Road → HSR route):**
```bash
python simulator/simulate_cab.py
# Passes through Silk Board Junction → triggers HIGH/CRITICAL alert
```

### Step 7 — Start the mobile app

```bash
cd frontend
npm install
npx expo start
```

- Scan QR with Expo Go app (iOS / Android)
- Or press `i` for iOS simulator, `a` for Android emulator

**Set your API URL:**
```bash
# Create frontend/.env.local
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
# e.g. EXPO_PUBLIC_API_URL=http://192.168.1.42:5000
```

> ⚠️ Use your machine's LAN IP (not `localhost`) so the phone can reach the backend.

---

## 🧪 Running Tests

### Backend (pytest — 17 tests)

```bash
source venv/bin/activate
PYTHONPATH=. pytest backend/tests/ -v
```

Expected:
```
PASSED tests/test_api.py::test_health
PASSED tests/test_api.py::test_start_trip_bus
PASSED tests/test_api.py::test_verify_bus_found
PASSED tests/test_api.py::test_risk_score_high_risk_zone
... (17 passed in 0.8s)
```

### Frontend (Jest — 25 test cases)

```bash
cd frontend
npm test
```

### CI (runs both):

```bash
bash ci/run_tests.sh
```

---

## 🐳 Docker Deployment

### Local Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Services:
#   backend    → http://localhost:5000
#   model      → http://localhost:5001
#   dashboard  → http://localhost:8080
```

### Deploy Backend to Render (free tier)

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `python backend/app.py`
   - **Environment variables:**
     ```
     PORT=10000
     MODEL_SERVICE_URL=https://your-model-service.onrender.com
     SECRET_KEY=your-secret-here
     ```
4. Click **Create Web Service**

### Deploy to Heroku

```bash
heroku create saferide-api-demo
heroku buildpacks:set heroku/python
git push heroku main
heroku open
```

### Deploy Model Service to Render

Same as backend, but:
- Root directory: `model_service`
- Start command: `python app.py`
- Set `MODEL_PORT=10000`

---

## 🔑 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend port |
| `MODEL_SERVICE_URL` | `http://localhost:5001` | TF model service URL |
| `SECRET_KEY` | `saferide-dev-secret` | Flask secret (change in prod!) |
| `FLASK_DEBUG` | `1` | Set to `0` in production |
| `EXPO_PUBLIC_API_URL` | `http://localhost:5000` | Backend URL for mobile app |
| `{{GOOGLE_MAPS_API_KEY}}` | — | Replace in `app.json` / `AndroidManifest.xml` |
| `{{FIREBASE_CONFIG}}` | — | Replace if using Firebase Realtime DB |
| `{{VAHAN_API_KEY}}` | — | For real plate verification via VAHAN API |
| `{{SAFERIDE_API_TOKEN}}` | — | Auth token placeholder |

---

## 📋 API Reference

See `docs/api_spec.md` for full OpenAPI-style docs.

### Quick curl examples

```bash
BASE=http://localhost:5000

# Health
curl $BASE/health

# Start a bus trip
curl -s -X POST $BASE/api/start_trip \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"u1","mode":"bus","vehicle_id":"BUS_45A_01"}' | jq .

# Verify a bus plate
curl -s -X POST $BASE/api/verify_bus \
  -H 'Content-Type: application/json' \
  -d '{"number_plate":"KA01AB1234"}' | jq .

# Push a GPS risk ping
curl -s -X POST $BASE/api/risk_score \
  -H 'Content-Type: application/json' \
  -d '{"trip_id":"TRIP-XXXX","lat":12.9174,"lng":77.6228,"speed":25}' | jq .

# Dashboard summary
curl -s $BASE/api/dashboard/summary | jq .
```

---

## 🗺️ High-Risk Zones (Bengaluru — mocked)

| Zone | Lat | Lng | Radius |
|------|-----|-----|--------|
| Silk Board Junction | 12.9174 | 77.6228 | 500m |
| Hebbal Flyover | 13.0358 | 77.5970 | 400m |
| KR Puram Signal | 13.0027 | 77.6958 | 300m |
| Koramangala 4th Block | 12.9347 | 77.6205 | 350m |
| Majestic Hub | 12.9766 | 77.5713 | 400m |

---

## 🆘 OCR Plate Verification

**Mock (no install needed):**
```bash
python ocr_stub/plate_ocr.py --mock
# {"plate_text": "KA23IJ7890", "confidence": 0.91, "method": "mock_stub"}
```

**Real Tesseract (install first):**
```bash
# Ubuntu/Debian
apt-get install tesseract-ocr
pip install opencv-python pytesseract Pillow

# macOS
brew install tesseract
pip install opencv-python pytesseract Pillow

python ocr_stub/plate_ocr.py --image path/to/plate.jpg
```

---

## 🏗️ Architecture Overview

```
Mobile App (Expo RN)
    │
    │  HTTP / Socket.IO
    ▼
Flask API (port 5000)
    ├── /api/start_trip    → creates trip session
    ├── /api/risk_score    → calls Model Service, updates trip
    ├── /api/verify_bus    → looks up fleet_db.json
    └── /api/dashboard/*   → aggregated stats
         │
         │  HTTP POST /infer
         ▼
TF Model Service (port 5001)
    └── Loads saved_model/
    └── Returns { risk_score, reason_tags }

Simulator (Python)
    └── Reads fleet_db.json
    └── POSTs GPS pings → /api/risk_score every 3s

Web Dashboard (static HTML)
    └── Polls Flask API every 10s
    └── Chart.js visualizations
```
