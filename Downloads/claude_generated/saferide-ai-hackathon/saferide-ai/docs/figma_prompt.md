# SafeRide AI — Figma Make Prompt

Paste the entire block below into **Figma Make** (figma.com/make) to generate a clickable iOS prototype.

---

## PROMPT

```
Design a complete clickable mobile app prototype for "SafeRide AI" — an AI-powered commute safety app for Bengaluru, India. Use iPhone 15 Pro frames (393×852pt). Create all screens listed below as connected frames with working navigation flows. Apply the exact design system specified.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Colors:
- Primary Blue:    #1A56DB
- AI Purple:       #7E3AF2
- Background:      #F9FAFB
- Card White:      #FFFFFF
- Dark:            #111827
- Text Primary:    #111827
- Text Muted:      #6B7280
- Border:          #E5E7EB
- Risk Low Green:  #0E9F6E
- Risk Amber:      #D97706
- Risk Orange-Red: #E3702E
- Risk Critical:   #E02424

Typography: SF Pro Display / SF Pro Text
- Headings: 22–28pt, weight 700–800
- Body: 15pt, weight 400
- Labels: 13pt, weight 500–600
- Micro: 11pt, weight 400

Spacing unit: 8pt. Component padding: 16pt. Corner radii: cards 12pt, buttons 12pt, pills 999pt.

Shadows: cards use 0 2px 8px rgba(0,0,0,0.08).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 1 — Home Screen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Header: "🛡️ SafeRide AI" in 28pt bold, centered. Subtitle: "AI-powered commute safety for Bengaluru" in 13pt muted below.

Two large cards side by side:
LEFT CARD — "Bus" flow:
  - Large 🚌 emoji (48pt)
  - Title "Bus" in 22pt Primary Blue bold
  - Subtitle "Verify bus & track route safety" in 12pt muted
  - Blue filled button "Start →" at bottom
  - Card border: 1.5pt Primary Blue, border-radius 20pt

RIGHT CARD — "Cab" flow:
  - Large 🚕 emoji (48pt)
  - Title "Cab" in 22pt AI Purple bold
  - Subtitle "Monitor your cab trip live" in 12pt muted
  - Purple filled button "Start →" at bottom
  - Card border: 1.5pt AI Purple, border-radius 20pt

Feature list card below (white card, shadow):
  4 rows, each row: [emoji 18pt] [label 14pt] — left aligned
  Row 1: 🗺️  Live GeoAI risk detection
  Row 2: 🔴  Predictive alerts with countdown
  Row 3: 🤖  Explainable AI risk breakdown
  Row 4: 📷  Number plate verification (OCR)

At bottom: dark (#111827) pill button "📊  Open Operator Dashboard"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 2 — Bus Route Search
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standard navigation bar with back arrow and title "Search Route".

Heading "🔍 Search Bus Route" 22pt bold.
Large rounded search input field: placeholder "Enter route number or stop name…"

Section label "Popular Routes" in 12pt muted uppercase.
Horizontal scrolling row of pill chips (light blue background #EBF5FF, blue text #1A56DB):
  45A  500C  500D  201  365  10A  218

Dashed-border card at bottom: "📷  Scan Bus Number Plate" centered 14pt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 3 — Nearby Buses List
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nav bar: "Nearby Buses"
Subheading: "🚌 Route 45A — 6 buses nearby" in 16pt.

List of 4 bus cards (white, shadow, 12pt radius):
Each card shows:
  TOP ROW: Route badge "🚌 45A" bold + status pill (green "in transit" / orange "delayed")
  ROW 2: "🔢 KA01AB1234" — plate number
  ROW 3: "👤 Ramesh Kumar" — driver name
  ROW 4: "📍 Next: Majestic"
  BOTTOM ROW: "👥 42/60" occupancy · "⚡ 35 km/h" speed (12pt muted)

Show 4 cards, with slight scroll hint.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 4 — Bus Verify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nav bar: "Verify Bus"
Heading "🔍 Verify Bus"

Plate input field: value "KA01AB1234", auto-caps
Blue filled button "✅  Verify Plate"
Outline blue button "📷  Use Camera (OCR)"

Verified result card (white, shadow, green top border 3pt):
  Green badge "✅ VERIFIED" pill
  Title "BUS_45A_01" 20pt bold
  Info rows (label + value):
    Plate:     KA01AB1234
    Route:     45A
    Driver:    Ramesh Kumar
    Status:    in_transit
    Next Stop: Majestic
  
  Large blue button "🛡️  Start Safe Trip" at bottom of card

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 5 — Bus Trip Monitor (map-heavy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FULL SCREEN MAP occupying top 60% of screen.
Show Bengaluru map centered on Koramangala area (12.93, 77.62).
On map:
  - 🚌 bus marker with white circular border (color-coded to risk level: currently orange for "high")
  - Red semi-transparent circle overlay at Silk Board Junction (danger zone)
  - Blue polyline GPS trail from top-left corner to bus position
  - Faint dashed route line showing planned path

BOTTOM SHEET (white, top-left/right radius 20pt, 40% height):
  
  TOP ROW:
    LEFT: Risk Badge pill — orange background, "🟠 HIGH (78)" in white 14pt bold, pulsing glow effect
    RIGHT: Trip ID "TRIP-A1B2C3D4" in 11pt muted / "📍 Silk Board Junction" in 12pt
  
  EXPLAINABLE AI PANEL (collapsible, currently open):
    Header row: "🤖 AI Explanation" 14pt semibold + "▲" chevron right
    Sub-label: "Risk score: 78/100 · Zone: Silk Board Junction" 12pt muted
    4 horizontal bar rows:
      Zone risk    ████████░░  HIGH
      Speed        █████░░░░░  Normal
      Time of day  ██░░░░░░░░  Daytime
      Anomaly AI   ███████░░░  Detected
    (bars colored green when low, orange/red when high)
  
  SIMULATE GPS PING button: light blue background, blue text
  END TRIP button: light gray background, muted text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 6 — Predictive Alert Modal (overlay)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show over Screen 5 (dim overlay 55% black).

Modal card (white, 380pt wide, 20pt radius, large shadow):
  HEADER (critical red background #E02424):
    🚨 emoji 36pt
    Title "CRITICAL RISK ZONE" 20pt white bold
    Countdown badge top-right: "7s" in small white pill
  
  BODY (white):
    Message: "Your cab is near Silk Board Junction. Extra caution advised." 15pt
    
    Info row: "📍 Zone   Silk Board Junction"
    
    Section "🔍 Detected factors":
    3 pill tags with red border + red text:
      [high risk zone]  [speeding]  [anomaly detected]
  
  FOOTER (border top):
    LEFT BUTTON: Red filled "🆘  SOS" 
    RIGHT BUTTON: Red outline "Dismiss"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 7 — Cab Booking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nav bar: "Book Cab"
Heading: "🚕 Book a Safe Cab"

Label "📍 Pickup" + input: "MG Road, Bengaluru"
Label "🏁 Drop"   + input: "HSR Layout, Bengaluru"

3 ride-option cards in a row:
  Mini  🚗  ₹89   (unselected)
  Sedan 🚕  ₹129  (SELECTED — blue border, light blue background)
  SUV   🚙  ₹199  (unselected)

Green info banner: "🛡️  SafeRide AI monitors every km for your safety"
(#ECFDF5 background, #065F46 text, green border)

Large blue button "🔍  Find Safe Ride"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 8 — Cab Driver Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nav bar: "Driver Details"
Heading: "👤 Driver Details"

Driver card (white, large shadow):
  Centered: 🧑‍✈️ in 80pt circle (light blue background)
  Name: "Sanjay Verma" 20pt bold
  Rating row: "⭐ 4.7  •  1842 trips" 14pt
  Green badge "✅ BMTC Verified Driver"

Info card:
  Vehicle:  Maruti Swift Dzire
  Plate:    KA01MH7777
  Contact:  +91 98××× ×××23

Outline button: "🔍  Verify Plate via SafeRide AI" (blue border)

Trip summary card:
  "Trip Summary" 14pt bold
  From: MG Road, Bengaluru
  To:   HSR Layout, Bengaluru
  "Estimated fare: ₹129  •  ETA: 28 min" in blue 12pt

Large blue button "🛡️  Start Safe Trip"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 9 — Cab Trip Monitor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Same layout as Screen 5 but:
- 🚕 cab marker (not bus)
- Bengaluru map centered on Koramangala route (12.93, 77.62)
- Green polyline driven trail + gray dashed planned route to HSR
- Red danger circle at Silk Board
- Route destination marker 🏁 at HSR Layout

Bottom sheet:
  TOP ROW:
    LEFT: Risk Badge — GREEN "🟢 LOW (12)"
    RIGHT: Timer "⏱ 4:32" + "📍 normal_area"
  
  Driver mini-bar (dark #111827 background, white text):
    "🧑‍✈️ Sanjay Verma  •  KA01MH7777"
  
  Explainable AI panel (collapsed, showing only header + ▼)
  
  Two side-by-side buttons:
    "▶ Simulate Step" (blue tint)   "🆘 SOS" (red)
  
  "⛔  End Trip" gray button at bottom

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 10 — Operator Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nav bar: "📊 Dashboard"

Stats row (2×2 grid of white cards):
  Active Trips: "5"   (blue top border)
  Fleet Size:   "100" (purple top border)
  Alerts Today: "3"   (orange-red top border)
  Avg Risk:     "24"  (amber top border)

Section "🚨 LIVE ALERTS":
  2 alert rows:
    Row 1: 🔴 + "Risk CRITICAL near Silk Board"  + "TRIP-A1B2C3D4 · 10:35:12"
    Row 2: 🟠 + "Risk HIGH near Hebbal Flyover"   + "TRIP-E5F6G7H8 · 10:28:44"

Section "🚌 ACTIVE TRIPS":
  3 trip rows (trip ID + vehicle + risk badge):
    TRIP-A1B2C3D4  BUS_45A_01  [🟠 HIGH]
    TRIP-E5F6G7H8  BUS_365_03  [🟢 LOW]
    TRIP-C9D0E1F2  CAB-KA01MH  [🟡 MEDIUM]

Dark button at bottom: "🖥️  Open Full Web Dashboard"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAVIGATION CONNECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen 1  →  Screen 2   (tap "Bus → Start")
Screen 1  →  Screen 7   (tap "Cab → Start")
Screen 1  →  Screen 10  (tap "Dashboard")
Screen 2  →  Screen 3   (tap route chip "45A")
Screen 3  →  Screen 4   (tap any bus card)
Screen 4  →  Screen 5   (tap "Start Safe Trip")
Screen 5  →  Screen 6   (tap "Simulate GPS Ping" once for high-risk scenario)
Screen 6  →  Screen 5   (tap "Dismiss")
Screen 7  →  Screen 8   (tap "Find Safe Ride")
Screen 8  →  Screen 9   (tap "Start Safe Trip")
All screens → back via navigation bar back arrow

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Use iOS status bar (time 9:41, signal indicators) on all screens
- Use a home indicator bar at the bottom of all full-screen views
- The map on Screens 5 and 9 should look like a real Google Maps-style tile map of Bengaluru (Koramangala area)
- All buttons should have hover/press states
- The Risk Badge on Screen 5 should have a subtle outer glow in the matching risk color
- The Explainable AI panel horizontal bars should use left-fill with gradient: green → orange → red based on value
- Use Bengaluru-specific place names throughout (Majestic, Silk Board, Hebbal, Koramangala, HSR Layout, Indiranagar, MG Road)
- Export all frames at 2x for handoff
```
