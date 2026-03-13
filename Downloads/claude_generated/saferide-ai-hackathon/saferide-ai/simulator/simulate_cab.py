"""
SafeRide AI — Cab Driver GPS Simulator
Simulates a cab ride from pickup to drop, pinging risk_score endpoint.

Usage:
  python simulator/simulate_cab.py --base_url http://localhost:5000
"""
import argparse, math, random, time
from datetime import datetime, timezone
import requests

ROUTE = [
    (12.9716, 77.5946),   # Start: MG Road
    (12.9652, 77.6031),   # Indiranagar
    (12.9390, 77.6217),   # Koramangala
    (12.9174, 77.6228),   # Silk Board (HIGH RISK ZONE)
    (12.9059, 77.6355),   # HSR Layout
    (12.8940, 77.6270),   # Bommanahalli
]

def interpolate(p1, p2, steps=10):
    """Generate `steps` intermediate GPS points between p1 and p2."""
    lats = [p1[0] + (p2[0] - p1[0]) * i / steps for i in range(steps)]
    lngs = [p1[1] + (p2[1] - p1[1]) * i / steps for i in range(steps)]
    return list(zip(lats, lngs))

def post(url, payload):
    try:
        r = requests.post(url, json=payload, timeout=5)
        return r.json()
    except Exception as e:
        print(f"  [ERR] {e}")
        return {}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base_url", default="http://localhost:5000")
    parser.add_argument("--interval", type=float, default=2.0)
    args = parser.parse_args()

    # Start cab trip
    trip_resp = post(f"{args.base_url}/api/start_trip", {
        "user_id":    "cab_demo_user",
        "mode":       "cab",
        "vehicle_id": "CAB-KA01MH7777",
    })
    trip_id = trip_resp.get("trip_id", "LOCAL-CAB")
    print(f"🚕 Cab trip started: {trip_id}")
    print(f"   Route: MG Road → HSR Layout (via Silk Board high-risk zone)\n")

    all_points = []
    for i in range(len(ROUTE) - 1):
        all_points.extend(interpolate(ROUTE[i], ROUTE[i+1], steps=8))

    for idx, (lat, lng) in enumerate(all_points):
        jlat = lat + random.uniform(-0.0003, 0.0003)
        jlng = lng + random.uniform(-0.0003, 0.0003)
        speed = random.uniform(5, 55)

        ping = {"trip_id": trip_id, "lat": round(jlat, 7), "lng": round(jlng, 7), "speed": round(speed, 1),
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
        result = post(f"{args.base_url}/api/risk_score", ping)
        score = result.get("risk_score", "?")
        level = result.get("risk_level", "?")
        zone  = result.get("zone_name", "-")
        icon = "🔴" if level == "critical" else "🟠" if level == "high" else "🟡" if level == "medium" else "🟢"
        print(f"  [{idx+1:3}/{len(all_points)}] {icon} risk={score} ({level:8}) zone={zone:25} lat={jlat:.5f} lng={jlng:.5f}")
        time.sleep(args.interval)

    post(f"{args.base_url}/api/end_trip", {"trip_id": trip_id})
    print(f"\n✅ Cab trip {trip_id} completed.")

if __name__ == "__main__":
    main()
