"""
SafeRide AI — Verification Routes
POST /api/verify_bus   — lookup plate/bus_id in fleet DB
POST /api/ocr_plate    — OCR stub; returns plate text
"""
from flask import Blueprint, request, jsonify, current_app

verify_bp = Blueprint("verify", __name__)


# ── POST /api/verify_bus ─────────────────────────────────────────────────────
@verify_bp.post("/verify_bus")
def verify_bus():
    """
    Body: { number_plate: "KA01AB1234" }  OR  { bus_id: "BUS_45A_01" }
    Returns bus record from fleet_db or 404.
    """
    body = request.get_json(silent=True) or {}
    plate  = (body.get("number_plate") or "").strip().upper()
    bus_id = (body.get("bus_id") or "").strip().upper()

    if not plate and not bus_id:
        return jsonify({"error": "number_plate or bus_id required"}), 400

    fleet = current_app.config["FLEET_DB"]
    match = None
    for bus in fleet:
        if plate and bus["number_plate"].upper() == plate:
            match = bus; break
        if bus_id and bus["bus_id"].upper() == bus_id:
            match = bus; break

    if not match:
        # Vahan API integration point (placeholder)
        return jsonify({
            "verified": False,
            "message":  "Plate not found in local fleet. Vahan API lookup skipped (placeholder).",
            "vahan_api_key_needed": "{{VAHAN_API_KEY}}"
        }), 404

    return jsonify({"verified": True, "bus": match}), 200


# ── POST /api/ocr_plate ───────────────────────────────────────────────────────
@verify_bp.post("/ocr_plate")
def ocr_plate():
    """
    Body: JSON { image_b64: "<base64 encoded image>" }
         OR multipart form-data field 'image'
    Returns: { plate_text, confidence, method }

    Real implementation would call Tesseract / OpenCV pipeline.
    This stub returns a plausible mock plate with 0.92 confidence.
    """
    import random, base64

    # --- Stub logic ---------------------------------------------------------
    mock_plates = [
        "KA01AB1234", "KA05CD5678", "KA51EF9012",
        "KA19GH3456", "KA23IJ7890", "KA41KL2345",
    ]
    plate_text = random.choice(mock_plates)
    confidence = round(random.uniform(0.85, 0.97), 2)

    # If you want real Tesseract (requires tesseract-ocr installed):
    # import pytesseract, cv2, numpy as np
    # img_bytes = base64.b64decode(request.get_json()["image_b64"])
    # nparr = np.frombuffer(img_bytes, np.uint8)
    # img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # plate_text = pytesseract.image_to_string(gray, config='--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').strip()
    # -------------------------------------------------------------------------

    return jsonify({
        "plate_text":  plate_text,
        "confidence":  confidence,
        "method":      "mock_stub",    # change to "tesseract" when real OCR enabled
        "note":        "Replace stub with OpenCV + Tesseract pipeline — see ocr_stub/plate_ocr.py"
    }), 200
