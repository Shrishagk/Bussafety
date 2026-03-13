"""
SafeRide AI — Model Microservice
Runs on port 5001 (separate from main API).
POST /infer  → returns risk_score + reason_tags
"""
import os, math
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── Load saved TensorFlow model ───────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model")

_model = None

def load_model():
    global _model
    if os.path.exists(MODEL_PATH):
        import tensorflow as tf
        _model = tf.saved_model.load(MODEL_PATH)
        print(f"[model-service] Loaded TF model from {MODEL_PATH}")
    else:
        print("[model-service] WARNING: saved_model not found — using heuristic only. Run train_model.py first.")

# ── Feature extraction ────────────────────────────────────────────────────────
def build_features(payload):
    """
    6-feature vector:
      0: lat_norm         (lat − 12.9) / 0.2
      1: lng_norm         (lng − 77.5) / 0.2
      2: speed_norm       speed / 120
      3: stop_duration_n  stop_duration / 300   (seconds)
      4: time_norm        time_of_day / 24
      5: area_risk        already 0..1
    """
    lat   = float(payload.get("lat",  12.97))
    lng   = float(payload.get("lng",  77.59))
    speed = float(payload.get("speed", 0))
    stop  = float(payload.get("stop_duration", 0))
    tod   = float(payload.get("time_of_day", 12))
    area  = float(payload.get("area_risk", 0.1))

    return np.array([[
        (lat  - 12.9) / 0.2,
        (lng  - 77.5) / 0.2,
        speed / 120.0,
        stop  / 300.0,
        tod   / 24.0,
        area,
    ]], dtype=np.float32)

def reason_tags(payload, score):
    tags = []
    speed = float(payload.get("speed", 0))
    area  = float(payload.get("area_risk", 0.1))
    tod   = float(payload.get("time_of_day", 12))
    if area > 0.7:  tags.append("high_risk_zone")
    if speed > 60:  tags.append("speeding")
    if tod < 6 or tod > 22: tags.append("late_night")
    if score > 0.7: tags.append("anomaly_detected")
    return tags


# ── POST /infer ───────────────────────────────────────────────────────────────
@app.post("/infer")
def infer():
    payload = request.get_json(silent=True) or {}
    features = build_features(payload)

    if _model is not None:
        try:
            import tensorflow as tf
            infer_fn = _model.signatures["serving_default"]
            input_tensor = tf.constant(features)
            output = infer_fn(input_tensor)
            # Model outputs a single float in [0,1]
            score = float(list(output.values())[0].numpy()[0][0])
        except Exception as e:
            score = _heuristic_score(payload)
    else:
        score = _heuristic_score(payload)

    score = round(max(0.0, min(1.0, score)), 4)
    return jsonify({
        "risk_score":   score,
        "reason_tags":  reason_tags(payload, score),
        "source":       "tf_model" if _model else "heuristic",
    }), 200


def _heuristic_score(payload):
    speed = float(payload.get("speed", 0))
    area  = float(payload.get("area_risk", 0.1))
    tod   = float(payload.get("time_of_day", 12))
    night = 0.25 if (tod < 6 or tod > 22) else 0.0
    return area * 0.5 + (speed / 120) * 0.3 + night


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": _model is not None}), 200


if __name__ == "__main__":
    load_model()
    port = int(os.getenv("MODEL_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
