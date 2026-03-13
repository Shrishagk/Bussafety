"""
SafeRide AI — Plate OCR Stub
Uses OpenCV + Tesseract if available, else returns mock result.

Install for real OCR:
  pip install opencv-python pytesseract pillow
  apt-get install tesseract-ocr   # Linux
  brew install tesseract           # macOS

Usage:
  python ocr_stub/plate_ocr.py --image path/to/plate.jpg
  python ocr_stub/plate_ocr.py --mock
"""
import argparse, os, random, sys

MOCK_PLATES = [
    "KA01AB1234", "KA05CD5678", "KA51EF9012",
    "KA19GH3456", "KA23IJ7890", "KA41KL2345",
]


def ocr_real(image_path: str) -> dict:
    """Real OCR pipeline using OpenCV + Tesseract."""
    try:
        import cv2
        import pytesseract
        import numpy as np

        img  = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Cannot read image: {image_path}")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Preprocessing: denoise + threshold
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Tesseract config: single line, alphanumeric only
        config = r"--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        text = pytesseract.image_to_string(thresh, config=config).strip()
        data = pytesseract.image_to_data(thresh, config=config, output_type=pytesseract.Output.DICT)
        confidences = [c for c in data["conf"] if c != -1]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "plate_text": text,
            "confidence": round(avg_conf / 100, 2),
            "method":     "tesseract+opencv",
        }
    except ImportError as e:
        print(f"[OCR] Library not available: {e}. Falling back to mock.", file=sys.stderr)
        return ocr_mock()


def ocr_mock() -> dict:
    """Mock OCR — returns a random Karnataka plate."""
    return {
        "plate_text": random.choice(MOCK_PLATES),
        "confidence": round(random.uniform(0.85, 0.97), 2),
        "method":     "mock_stub",
    }


def main():
    parser = argparse.ArgumentParser(description="SafeRide Plate OCR")
    parser.add_argument("--image", type=str, help="Path to plate image")
    parser.add_argument("--mock",  action="store_true", help="Force mock mode")
    args = parser.parse_args()

    if args.mock or not args.image:
        result = ocr_mock()
    else:
        result = ocr_real(args.image)

    import json
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
