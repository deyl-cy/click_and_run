"""
Click & Run inference service.

Wraps the trained YOLOv8-seg model (best.pt) behind a small HTTP API
that the Node backend calls for every seed batch photo.

Run with:
    uvicorn app:app --host 0.0.0.0 --port 8001

Put your trained weights at:
    python-service/model/best.pt

(or point MODEL_PATH at a different file via environment variable)
"""

import io
import os

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image


# ============================================================
# MODEL SETTINGS
# ============================================================

MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "model", "best.pt")
)

# Same confidence used in your Colab test
CONFIDENCE_THRESHOLD = float(
    os.environ.get("CONFIDENCE_THRESHOLD", "0.3")
)

# Same image size used in your Colab test
IMAGE_SIZE = int(
    os.environ.get("IMAGE_SIZE", "640")
)

# Allow up to 100 detections
MAX_DETECTIONS = int(
    os.environ.get("MAX_DETECTIONS", "100")
)


# ============================================================
# CLASS LABELS
# ============================================================

# Your V2 model has these 3 classes:
#
# 0 = Abnormal
# 1 = Dead
# 2 = Normal

CLASS_LABELS = {
    "abnormal": "Abnormal",
    "dead": "Dead",
    "normal": "Normal",
}


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(title="Click & Run Inference Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


_model = None


# ============================================================
# LOAD MODEL
# ============================================================

def get_model():
    """
    Lazy-load the YOLOv8 model on the first request.
    """

    global _model

    if _model is None:

        if not os.path.exists(MODEL_PATH):
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Model file not found at {MODEL_PATH}. "
                    "Copy your trained best.pt into "
                    "python-service/model/."
                ),
            )

        from ultralytics import YOLO

        _model = YOLO(MODEL_PATH)

    return _model


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "modelFile": os.path.basename(MODEL_PATH),
        "modelFileFound": os.path.exists(MODEL_PATH),
        "modelLoaded": _model is not None,
        "confidenceThreshold": CONFIDENCE_THRESHOLD,
        "imageSize": IMAGE_SIZE,
        "maxDetections": MAX_DETECTIONS,
    }


# ============================================================
# ANALYZE IMAGE
# ============================================================

@app.post("/analyze")
async def analyze(image: UploadFile = File(...), confidence: str = Form(None)):

    model = get_model()

    # --------------------------------------------------------
    # Confidence threshold for this request
    #
    # Falls back to CONFIDENCE_THRESHOLD (env var) when the
    # caller doesn't send one, so existing behavior is unchanged.
    # --------------------------------------------------------

    request_confidence = CONFIDENCE_THRESHOLD

    if confidence is not None and confidence != "":
        try:
            request_confidence = float(confidence)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="confidence must be a number between 0 and 1.",
            )

        if not (0 <= request_confidence <= 1):
            raise HTTPException(
                status_code=400,
                detail="confidence must be between 0 and 1.",
            )

    # --------------------------------------------------------
    # Read uploaded image
    # --------------------------------------------------------

    contents = await image.read()

    try:

        img = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Could not read the uploaded image."
        )


    # --------------------------------------------------------
    # Original image dimensions
    # --------------------------------------------------------

    width, height = img.size


    # --------------------------------------------------------
    # YOLOv8 INFERENCE
    #
    # These settings match your Colab:
    #
    # imgsz=640
    # conf=0.2
    # max_det=100
    # --------------------------------------------------------

    results = model.predict(
        source=img,
        imgsz=IMAGE_SIZE,
        conf=request_confidence,
        max_det=MAX_DETECTIONS,
        verbose=False
    )

    result = results[0]


    # --------------------------------------------------------
    # Extract detections
    # --------------------------------------------------------

    detections = []

    names = result.names or {}


    if result.boxes is not None:

        for i, box in enumerate(result.boxes):

            # Class ID
            cls_id = int(box.cls[0])

            # Actual model confidence
            confidence = float(box.conf[0])

            # Bounding box
            x1, y1, x2, y2 = [
                float(v)
                for v in box.xyxy[0]
            ]


            # ------------------------------------------------
            # Get class name from model
            # ------------------------------------------------

            raw_label = names.get(
                cls_id,
                str(cls_id)
            )

            label = CLASS_LABELS.get(
                str(raw_label).lower(),
                raw_label
            )


            # ------------------------------------------------
            # Store detection
            # ------------------------------------------------

            detections.append(
                {
                    "id": i,
                    "class": label,
                    "confidence": round(
                        confidence,
                        4
                    ),
                    "box": [
                        round(x1, 1),
                        round(y1, 1),
                        round(x2, 1),
                        round(y2, 1),
                    ],
                }
            )


    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "imageWidth": width,
        "imageHeight": height,
        "detections": detections,
        "confidenceUsed": request_confidence,
    }