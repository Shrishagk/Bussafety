"""
SafeRide AI — Bus GPS Simulator
Streams GPS pings from fleet_db to the backend at a configurable interval.

Usage:
  python simulator/simulate_bus.py --buses 5 --interval 3 --base_url http://localhost:5000

Options:
  --buses     Number of buses to simulate (default: 5, max: 100)
  --interval  Seconds between pings (default: 3)
  --base_url  Backend base URL
  --user_id   Passenger user ID to attach trips to
"""

import argparse, json, math, os, random, sys, time
from datetime import datetime, timezone

import requests

# ── Helpers ───────────────────────────────────────────────────────────────────
FLEET_PATH = os.path.join(os.path.dirname(__file__), "../data/fleet_db.json")

def load_fleet():
    with open(FLEET_PATH) as f:
        return json.load(f)

def jitter(coord, max_delta=0.002):
    """Add small random walk to a coordinate."""
    return coord + random.uniform(-max_delta, max_delta)

def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def post(url, payload, label=""):
    try:
        r = requests.post(url, json=payload, timeout=5)
        return r.json()
    except Exception as e:
        print(f"  [ERROR] {label}: {e}")
        return {}

# ── Simulation state ──────────────────────────────────────────────────────────
class BusSim:
    def __init__(self, bus_record, trip_id):
        self.bus    = bus_record
        self.lat    = bus_record["last_lat"]
        self.lng    = bus_record["last_lng"]
        self.speed  = bus_record.get("speed_kmh", random.uniform(10, 50))
        self.trip_id = trip_id

    def tick(self):
        """Advance one step along a random walk."""
        # Simulate gradual movement + occasional speed change
        self.lat   = jitter(self.lat, 0.001)
        self.lng   = jitter(self.lng, 0.001)
        self.speed = max(0, self.speed + random.uniform(-5, 5))
        return {
            "trip_id":   self.trip_id,
            "lat":       round(self.lat, 7),
            "lng":       round(self.lng, 7),
            "speed":     round(self.speed, 1),
            "timestamp": now_iso(),
        }


# ── Main simulation loop ──────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="SafeRide Bus GPS Simulator")
    parser.add_argument("--buses",    type=int,   default=5,                      help="Number of buses to simulate")
    parser.add_argument("--interval", type=float, default=3.0,                    help="Seconds between pings")
    parser.add_argument("--base_url", type=str,   default="http://localhost:5000", help="Backend URL")
    parser.add_argument("--user_id",  type=str,   default="demo_passenger",       help="Passenger user ID")
    args = parser.parse_args()

    fleet = load_fleet()
    selected = fleet[:min(args.buses, len(fleet))]

    print(f"🚌 SafeRide Simulator starting — {len(selected)} buses, {args.interval}s interval")
    print(f"   Backend: {args.base_url}\n")

    # Start trips for each bus
    sims = []
    for bus in selected:
        resp = post(f"{args.base_url}/api/start_trip", {
            "user_id":    args.user_id,
            "mode":       "bus",
            "vehicle_id": bus["bus_id"],
        }, label="start_trip")
        trip_id = resp.get("trip_id", f"LOCAL-{bus['bus_id']}")
        sim = BusSim(bus, trip_id)
        sims.append(sim)
        print(f"  ✅ Trip started: {trip_id} — Bus {bus['bus_id']} ({bus['route']})")

    print(f"\n{'─'*55}")
    print(f"{'Bus ID':<20} {'Trip ID':<18} {'Lat':>10} {'Lng':>10} {'Risk':>6} {'Level':<8}")
    print(f"{'─'*55}")

    tick = 0
    try:
        while True:
            tick += 1
            for sim in sims:
                ping = sim.tick()
                result = post(f"{args.base_url}/api/risk_score", ping, label="risk_score")
                score = result.get("risk_score", "?")
                level = result.get("risk_level", "?")
                print(f"  {sim.bus['bus_id']:<18} {sim.trip_id:<18} {ping['lat']:>10.5f} {ping['lng']:>10.5f} {str(score):>6} {level:<8}")

            print(f"  [tick {tick} @ {now_iso()}]")
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n\n⛔ Simulator stopped by user")
        for sim in sims:
            post(f"{args.base_url}/api/end_trip", {"trip_id": sim.trip_id}, "end_trip")
            print(f"  Trip {sim.trip_id} ended.")


if __name__ == "__main__":
    main()
