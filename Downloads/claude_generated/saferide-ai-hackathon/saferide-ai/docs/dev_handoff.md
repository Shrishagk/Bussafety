# SafeRide AI — Dev Handoff

> Complete design-to-code mapping for handoff to frontend/backend engineers.

---

## 1. Design Tokens (CSS variables + RN equivalents)

### Colors

| Token | Hex | CSS var | RN key | Usage |
|-------|-----|---------|--------|-------|
| Primary | `#1A56DB` | `--primary` | `tokens.colors.primary` | Buttons, links, active states |
| Primary Light | `#EBF5FF` | `--primary-light` | `tokens.colors.primaryLight` | Chip backgrounds, highlights |
| Secondary | `#7E3AF2` | `--secondary` | `tokens.colors.secondary` | AI/ML purple accent, cab flow |
| Risk Low | `#0E9F6E` | `--risk-low` | `tokens.colors.riskLow` | Score 0.00–0.29 |
| Risk Medium | `#D97706` | `--risk-med` | `tokens.colors.riskMedium` | Score 0.30–0.59 |
| Risk High | `#E3702E` | `--risk-high` | `tokens.colors.riskHigh` | Score 0.60–0.79 |
| Risk Critical | `#E02424` | `--risk-crit` | `tokens.colors.riskCritical` | Score 0.80–1.00 |
| Background | `#F9FAFB` | `--bg` | `tokens.colors.bg` | Screen backgrounds |
| Card | `#FFFFFF` | `--card` | `tokens.colors.bgCard` | Cards, bottom sheets |
| Dark BG | `#111827` | `--bg-dark` | `tokens.colors.bgDark` | Headers, dark panels |
| Text Primary | `#111827` | `--text` | `tokens.colors.textPrimary` | Body text |
| Text Muted | `#6B7280` | `--muted` | `tokens.colors.textSecondary` | Labels, subtitles |
| Border | `#E5E7EB` | `--border` | `tokens.colors.border` | Dividers, input borders |

### Typography

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Hero | 34 | 800 | App title |
| XXL | 28 | 700 | Section hero |
| XL | 22 | 700 | Screen headings |
| LG | 18 | 600 | Card titles |
| MD | 15 | 400/600 | Body text |
| SM | 13 | 400 | Labels, captions |
| XS | 11 | 400 | Timestamps, badges |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `spacing.xs` | 4px | Inline gaps |
| `spacing.sm` | 8px | Compact padding |
| `spacing.md` | 16px | Standard padding |
| `spacing.lg` | 24px | Section padding |
| `spacing.xl` | 32px | Hero sections |

### Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `radii.sm` | 6px | Small chips |
| `radii.md` | 12px | Cards, inputs |
| `radii.lg` | 20px | Bottom sheets, modals |
| `radii.pill` | 999px | Badges, tags |

---

## 2. Component Library

### `<RiskBadge score={0.78} size="md" showScore />`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `score` | `number` | required | 0.0–1.0 |
| `size` | `"sm"\|"md"\|"lg"` | `"md"` | Badge size |
| `showScore` | `boolean` | `true` | Show numeric score |

**Behavior:** Pulses/animates when `level === "high"` or `"critical"`.

---

### `<AlertBanner level="high" message="..." visible onDismiss />`

Slides down from top of screen. Triggers Vibration on high/critical.

---

### `<AlertModal visible level title message tags zoneName onDismiss onSOS />`

Full-screen modal with auto-dismiss countdown (10s). Renders tag pills, SOS button.

---

### `<ExplainableAIPanel riskScore tags zoneName />`

Collapsible panel with horizontal bar chart breakdown of contributing factors:
- Zone risk (area_risk factor)
- Speed (speeding tag)
- Time of day (late_night tag)
- Anomaly AI (model anomaly_detected)

---

## 3. Screen → API Mapping

| Screen | User action | API call | Response used |
|--------|-------------|----------|---------------|
| HomeScreen | Tap "Bus" | — | Navigate to BusRouteSearch |
| HomeScreen | Tap "Cab" | — | Navigate to CabBooking |
| BusVerifyScreen | Tap "Verify Plate" | `POST /api/verify_bus` | `bus` record → prefill card |
| BusVerifyScreen | Tap "Start Safe Trip" | `POST /api/start_trip` | `trip_id` → passed to Monitor |
| BusTripMonitorScreen | Mount | `POST /api/start_trip` | `trip_id` |
| BusTripMonitorScreen | "Simulate GPS Ping" | `POST /api/risk_score` | Update map, badge, alerts |
| BusTripMonitorScreen | Socket.IO `risk_update` | realtime | `risk_score`, `risk_level`, `reason_tags` |
| CabBookingScreen | Tap "Find Ride" | — (mock) | Navigate to DriverDetails |
| CabDriverDetailsScreen | "Verify Plate" | `POST /api/verify_bus` | `verified` flag |
| CabDriverDetailsScreen | "Start Safe Trip" | `POST /api/start_trip` | `trip_id` |
| CabTripMonitorScreen | "Simulate Step" | `POST /api/risk_score` | Update map, badge, modal |
| CabTripMonitorScreen | "End Trip" | `POST /api/end_trip` | Navigate back |
| DashboardScreen | Mount + pull-to-refresh | `GET /api/dashboard/summary` | Stats row |
| DashboardScreen | Mount | `GET /api/active_trips` | Trips list |
| DashboardScreen | Mount | `GET /api/dashboard/alerts` | Alerts feed |
| DashboardScreen | Tap trip row | `GET /api/trip_status?trip_id=` | Trip detail modal |

---

## 4. Realtime Flow

```
Mobile App                    Flask API               Socket.IO
    │                              │                       │
    │── POST /api/start_trip ──▶  │                       │
    │◀── { trip_id } ─────────────│                       │
    │                              │                       │
    │── emit("subscribe_trip") ───────────────────────▶   │
    │◀── emit("subscribed") ─────────────────────────────  │
    │                              │                       │
Simulator                          │                       │
    │── POST /api/risk_score ──▶  │                       │
    │                    compute risk_score                │
    │                              │── emit("risk_update")─▶
    │                              │                  Room: trip_id
    │◀─────────────────────────────────── risk_update ─────│
    │  update RiskBadge, map marker, AlertBanner           │
```

**Polling fallback (if Socket.IO unavailable):**
`realtimeService.ts` polls `GET /api/trip_status?trip_id=` every 5 seconds and synthesises a `RiskScoreResponse`.

---

## 5. Model Service Feature Engineering

**Input features (6-dimensional vector):**

| Feature | Formula | Range |
|---------|---------|-------|
| `lat_norm` | `(lat − 12.9) / 0.2` | 0–1 approx |
| `lng_norm` | `(lng − 77.5) / 0.2` | 0–1 approx |
| `speed_norm` | `speed / 120` | 0–1 |
| `stop_duration_norm` | `stop_duration / 300` | 0–1 |
| `time_norm` | `time_of_day / 24` | 0–1 |
| `area_risk` | Geofence lookup 0–1 | 0–1 |

**Model architecture:**
```
Input(6) → Dense(32, relu) → Dense(16, relu) → Dense(1, sigmoid) → risk_score
```

**Training:** 2000 synthetic samples, 20 epochs, Adam optimizer, MSE loss.

---

## 6. Payload Samples

### `POST /api/start_trip` → Response

```json
{
  "trip_id":    "TRIP-A1B2C3D4",
  "status":     "active",
  "started_at": "2026-03-13T10:30:00Z"
}
```

### `POST /api/risk_score` → Response (high risk)

```json
{
  "trip_id":     "TRIP-A1B2C3D4",
  "risk_score":  0.831,
  "risk_level":  "critical",
  "reason_tags": ["high_risk_zone", "late_night", "anomaly_detected"],
  "zone_name":   "Silk Board Junction",
  "timestamp":   "2026-03-13T23:45:12Z",
  "source":      "tf_model"
}
```

### `POST /api/verify_bus` → Response (found)

```json
{
  "verified": true,
  "bus": {
    "bus_id": "BUS_45A_01",
    "number_plate": "KA01AB1234",
    "route": "45A",
    "driver_name": "Ramesh Kumar",
    "status": "in_transit",
    "next_stop": "Majestic",
    "speed_kmh": 35.2,
    "capacity": 60,
    "current_occupancy": 42
  }
}
```

---

## 7. Fleet DB Schema

Each row in `data/fleet_db.json`:

```typescript
interface BusRecord {
  bus_id:            string;   // "BUS_45A_01"
  number_plate:      string;   // "KA01AB1234"  Karnataka format
  route:             string;   // "45A"
  driver_name:       string;   // "Ramesh Kumar"
  gps_device_id:     string;   // "GPS1001"
  last_lat:          number;   // 12.90 – 13.08
  last_lng:          number;   // 77.52 – 77.70
  last_seen:         string;   // ISO 8601
  status:            "in_transit" | "at_stop" | "idle" | "delayed";
  next_stop:         string;
  speed_kmh:         number;
  capacity:          number;   // 40 – 80
  current_occupancy: number;
  vehicle_age_years: number;
  last_maintenance:  string;   // YYYY-MM-DD
}
```

---

## 8. Integration Placeholders

| Placeholder | Location | Replace With |
|------------|----------|--------------|
| `{{GOOGLE_MAPS_API_KEY}}` | `frontend/app.json`, `AndroidManifest.xml` | Google Maps Platform key |
| `{{FIREBASE_CONFIG}}` | `frontend/src/services/realtimeService.ts` | Firebase project config JSON |
| `{{VAHAN_API_KEY}}` | `backend/routes/verify.py` | VAHAN/NIC API key for real plate lookup |
| `{{SAFERIDE_API_TOKEN}}` | `frontend/src/services/api.ts` | JWT or static token |
| `SECRET_KEY` env var | `backend/app.py` | Random 32-char string |
