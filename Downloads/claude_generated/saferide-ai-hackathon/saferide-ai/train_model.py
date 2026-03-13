"""
SafeRide AI — Model Training Stub
Trains a tiny TensorFlow neural network on synthetic GPS/risk data.
Saves to model_service/saved_model/

Run: python model_service/train_model.py
Expected time: < 10 seconds
"""
import os, numpy as np

# ── Synthetic data generation ─────────────────────────────────────────────────
np.random.seed(42)
N = 2000

lat   = np.random.uniform(12.90, 13.08, N)
lng   = np.random.uniform(77.52, 77.70, N)
speed = np.random.uniform(0, 80, N)
stop  = np.random.uniform(0, 300, N)
tod   = np.random.randint(0, 24, N).astype(float)
area  = np.random.uniform(0, 1, N)

# ── Label: risk = weighted combo (ground truth for toy model) ─────────────────
night_flag = ((tod < 6) | (tod > 22)).astype(float)
risk_label = (
    area * 0.45 +
    (speed / 80) * 0.25 +
    night_flag  * 0.20 +
    np.random.uniform(0, 0.1, N)   # noise
).clip(0, 1)

# Feature matrix (6 features)
X = np.column_stack([
    (lat  - 12.9) / 0.2,
    (lng  - 77.5) / 0.2,
    speed / 120.0,
    stop  / 300.0,
    tod   / 24.0,
    area,
]).astype(np.float32)
y = risk_label.astype(np.float32).reshape(-1, 1)

# ── Build model ───────────────────────────────────────────────────────────────
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(6,)),
    tf.keras.layers.Dense(32, activation="relu"),
    tf.keras.layers.Dense(16, activation="relu"),
    tf.keras.layers.Dense(1,  activation="sigmoid"),
], name="saferide_risk_model")

model.compile(optimizer="adam", loss="mse", metrics=["mae"])
print(model.summary())

# ── Train ─────────────────────────────────────────────────────────────────────
history = model.fit(
    X, y,
    epochs=20,
    batch_size=64,
    validation_split=0.15,
    verbose=1,
)
final_mae = history.history["val_mae"][-1]
print(f"\n✅ Training done — val MAE: {final_mae:.4f}")

# ── Save ──────────────────────────────────────────────────────────────────────
save_dir = os.path.join(os.path.dirname(__file__), "model_service", "saved_model")
os.makedirs(save_dir, exist_ok=True)

# Save as TF SavedModel (for serving via tf.saved_model.load)
@tf.function(input_signature=[tf.TensorSpec(shape=[None, 6], dtype=tf.float32)])
def serving_fn(x):
    return model(x, training=False)

tf.saved_model.save(model, save_dir, signatures={"serving_default": serving_fn})
print(f"✅ Model saved to {save_dir}")

# Also export a quick test
sample = X[:3]
preds  = model.predict(sample)
for i, p in enumerate(preds):
    print(f"  sample {i}: features={sample[i].tolist()}, predicted_risk={p[0]:.3f}")
