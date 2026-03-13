"""
SafeRide AI — Backend API Server
Flask application wiring all routes together.
"""
import os, json
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "saferide-dev-secret")
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ── In-memory stores (replace with Firebase / MongoDB in production) ─────────
app.config["TRIPS"] = {}          # trip_id → trip dict
app.config["FLEET_DB"] = []       # loaded once at start

# ── Load fleet DB ─────────────────────────────────────────────────────────────
def load_fleet():
    fleet_path = os.path.join(os.path.dirname(__file__), "../data/fleet_db.json")
    with open(fleet_path) as f:
        app.config["FLEET_DB"] = json.load(f)
    print(f"[startup] Loaded {len(app.config['FLEET_DB'])} fleet records")

# ── Register blueprints ───────────────────────────────────────────────────────
from routes.trips import trips_bp
from routes.verify import verify_bp
from routes.risk import risk_bp
from routes.dashboard import dashboard_bp

app.register_blueprint(trips_bp, url_prefix="/api")
app.register_blueprint(verify_bp, url_prefix="/api")
app.register_blueprint(risk_bp, url_prefix="/api")
app.register_blueprint(dashboard_bp, url_prefix="/api")

# ── Socket.IO events ──────────────────────────────────────────────────────────
@socketio.on("subscribe_trip")
def handle_subscribe(data):
    from flask_socketio import join_room
    trip_id = data.get("trip_id")
    join_room(trip_id)
    socketio.emit("subscribed", {"trip_id": trip_id}, room=trip_id)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "saferide-api", "fleet_size": len(app.config["FLEET_DB"])}

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_fleet()
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "1") == "1")
