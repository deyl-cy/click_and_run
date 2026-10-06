import { ScanIcon, XIcon, SaveIcon } from "../components/Icons";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import { confirmAction } from "../utils/alert";

const POPUP_WIDTH = 220;
const POPUP_HEIGHT = 150;

const CLASS_COLORS = {
    Normal: "#22c55e",
    Abnormal: "#eab308",
    Dead: "#ef4444",
};

const CATEGORY_BY_TYPE = {
    Normal: "Intact Seedling",
    Abnormal: "Damaged Seedling",
    Dead: "Non-viable Seed",
};

const SHOOT_BY_TYPE = {
    Normal: "Intact",
    Abnormal: "Weak",
    Dead: "Absent",
};

const ROOT_BY_TYPE = {
    Normal: "Intact",
    Abnormal: "Present",
    Dead: "Absent",
};

function getBox(detection) {
    const box = Array.isArray(detection.box)
        ? detection.box
        : [
            detection.x1,
            detection.y1,
            detection.x2,
            detection.y2,
        ];

    return box.map(Number);
}

export default function Results() {
    const location = useLocation();
    const navigate = useNavigate();

    const navigationState = location.state || {};
    const result = navigationState.data || navigationState;

    const details = result?.details || {};
    const analysis = result?.analysis || {};
    const counts = analysis.counts || {};
    const image = navigationState.image || null;

    const detections = Array.isArray(analysis.detections)
        ? analysis.detections
        : [];

    const seedDetails = Array.isArray(analysis.seedDetails)
        ? analysis.seedDetails
        : [];

    /* ---------------------------------------------------------
     * State
     * ------------------------------------------------------- */

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [imageUrl, setImageUrl] = useState(null);
    const [naturalSize, setNaturalSize] = useState({
        width: 0,
        height: 0,
    });

    const [selected, setSelected] = useState(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

    const wrapRef = useRef(null);
    const popupRef = useRef(null);
    const dragRef = useRef(null);

    /* ---------------------------------------------------------
     * Image preview URL
     * ------------------------------------------------------- */

    useEffect(() => {
        if (!(image instanceof Blob)) {
            setImageUrl(null);
            return undefined;
        }

        const url = URL.createObjectURL(image);
        setImageUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [image]);

    /* ---------------------------------------------------------
     * Numbers
     * ------------------------------------------------------- */

    const normalCount = Number(counts.Normal ?? counts.normal ?? 0);
    const abnormalCount = Number(counts.Abnormal ?? counts.abnormal ?? 0);
    const deadCount = Number(counts.Dead ?? counts.dead ?? 0);

    const totalSeeds =
        analysis.total != null && analysis.total !== ""
            ? Number(analysis.total)
            : normalCount + abnormalCount + deadCount;

    const viability =
        analysis.viability != null && analysis.viability !== ""
            ? Number(analysis.viability)
            : totalSeeds > 0
                ? ((normalCount + abnormalCount) / totalSeeds) * 100
                : 0;

    const germination =
        analysis.predictedGermination != null &&
        analysis.predictedGermination !== ""
            ? Number(analysis.predictedGermination)
            : totalSeeds > 0
                ? (normalCount / totalSeeds) * 100
                : 0;

    const confidenceUsed =
        analysis.confidenceUsed != null
            ? Math.round(Number(analysis.confidenceUsed) * 100)
            : null;

    const imageWidth =
        Number(analysis.imageWidth) || naturalSize.width;

    const imageHeight =
        Number(analysis.imageHeight) || naturalSize.height;

    /* ---------------------------------------------------------
     * Select a seed + place popup next to it
     * ------------------------------------------------------- */

    function openSeed(index) {
        setSelected(index);

        const wrap = wrapRef.current;
        const detection = detections[index];

        if (wrap && detection && imageWidth && imageHeight) {
            const [x1, y1, x2, y2] = getBox(detection);

            const sx = wrap.clientWidth / imageWidth;
            const sy = wrap.clientHeight / imageHeight;

            let x = x2 * sx + 12;

            if (x + POPUP_WIDTH > wrap.clientWidth) {
                x = x1 * sx - POPUP_WIDTH - 12;
            }

            let y = y1 * sy;

            x = Math.max(
                8,
                Math.min(x, wrap.clientWidth - POPUP_WIDTH - 8)
            );

            y = Math.max(
                8,
                Math.min(y, wrap.clientHeight - POPUP_HEIGHT - 8)
            );

            setPopupPos({ x, y });
        }

        setPopupOpen(true);
    }

    /* ---------------------------------------------------------
     * Drag popup
     * ------------------------------------------------------- */

    function handlePointerDown(event) {
        if (event.target.closest("button")) {
            return;
        }

        const wrap = wrapRef.current;

        if (!wrap) {
            return;
        }

        const rect = wrap.getBoundingClientRect();

        dragRef.current = {
            offsetX: event.clientX - rect.left - popupPos.x,
            offsetY: event.clientY - rect.top - popupPos.y,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
        const drag = dragRef.current;
        const wrap = wrapRef.current;
        const popup = popupRef.current;

        if (!drag || !wrap || !popup) {
            return;
        }

        const rect = wrap.getBoundingClientRect();

        const x = event.clientX - rect.left - drag.offsetX;
        const y = event.clientY - rect.top - drag.offsetY;

        setPopupPos({
            x: Math.max(
                0,
                Math.min(x, wrap.clientWidth - popup.offsetWidth)
            ),
            y: Math.max(
                0,
                Math.min(y, wrap.clientHeight - popup.offsetHeight)
            ),
        });
    }

    function handlePointerUp() {
        dragRef.current = null;
    }

    /* ---------------------------------------------------------
     * Save
     * ------------------------------------------------------- */

    async function saveReport() {
        setSaving(true);
        setSaveError("");
        const ok = await confirmAction({
            title: "Save this report?",
            confirmText: "Save",
            icon: "question",
        });

        if (!ok) {
            return;
        }

        try {
            const formData = new FormData();

            formData.append("details", JSON.stringify(details));
            formData.append("analysis", JSON.stringify(analysis));

            if (image) {
                formData.append("image", image);
            }

            const response = await api.post("/reports", formData);

            navigate(`/reports/${response.data.data.id}`);
        } catch (error) {
            console.error("Unable to save report:", error);

            setSaveError(
                error.response?.data?.message ||
                "Unable to save the report."
            );
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------
     * No analysis guard (after all hooks)
     * ------------------------------------------------------- */

    if (!result || !result.analysis) {
        return (
            <div className="content-card">
                <h1>No Analysis Found</h1>

                <p>
                    There is no analysis result available.
                    Please start a new test.
                </p>

                <button
                    type="button"
                    className="cls-btn cls-btn-primary"
                    onClick={() => navigate("/new-test")}
                >
                    <ScanIcon size={17} /> Start New Test
                </button>
            </div>
        );
    }

    /* ---------------------------------------------------------
     * Derived render data
     * ------------------------------------------------------- */

    // Draw big boxes first so small boxes stay clickable on top.
    const drawOrder = detections
        .map((detection, index) => {
            const [x1, y1, x2, y2] = getBox(detection);

            return {
                detection,
                index,
                box: [x1, y1, x2, y2],
                area: Math.abs((x2 - x1) * (y2 - y1)),
            };
        })
        .filter((item) => item.box.every(Number.isFinite))
        .sort((a, b) => b.area - a.area);

    const selectedDetection =
        selected !== null ? detections[selected] : null;

    const selectedType = selectedDetection?.class || "Unknown";
    const selectedRow = selected !== null ? seedDetails[selected] : null;

    const popupRows = selectedDetection
        ? [
            [
                "Seedling type",
                selectedType,
            ],
            [
                "Category",
                CATEGORY_BY_TYPE[selectedType] || "-",
            ],
            [
                "Primary shoot system",
                selectedRow?.[1] ?? SHOOT_BY_TYPE[selectedType] ?? "-",
            ],
            [
                "Primary roots",
                selectedRow?.[2] ?? ROOT_BY_TYPE[selectedType] ?? "-",
            ],
        ]
        : [];

    /* ---------------------------------------------------------
     * Render
     * ------------------------------------------------------- */

    return (
        <div className="cls-page">

            {/* Header */}
            <header className="cls-header">
                <div>
                    <span className="cls-eyebrow">
                        AI CLASSIFICATION
                    </span>

                    <h1>Final Classification Result</h1>

                    <p>
                        Review detected seedlings before saving
                        the report.
                    </p>
                </div>

                <div className="cls-viability-pill">
                    Viability: {viability.toFixed(1)}%
                </div>

                {confidenceUsed !== null && (
                    <div className="cls-threshold">
                        Detection confidence threshold used:{" "}
                        {confidenceUsed}%
                    </div>
                )}
            </header>

            <div className="cls-grid">

                {/* Image + seed buttons */}
                <section className="cls-card cls-viewer-card">

                    <div className="cls-stage">
                        {imageUrl ? (
                            <div className="cls-image-wrap"
                                ref={wrapRef}
                                style={
                                    imageWidth > 0 && imageHeight > 0
                                        ? {
                                            maxWidth: `calc(max(260px, 100vh - 340px) * ${imageWidth / imageHeight})`,
                                        }
                                        : undefined
                                }
                            >

                                <img
                                    src={imageUrl}
                                    alt="Analyzed seed batch"
                                    draggable={false}
                                    onLoad={(event) =>
                                        setNaturalSize({
                                            width:
                                                event.currentTarget
                                                    .naturalWidth,
                                            height:
                                                event.currentTarget
                                                    .naturalHeight,
                                        })
                                    }
                                />

                                {imageWidth > 0 &&
                                    imageHeight > 0 &&
                                    drawOrder.map(
                                        ({ detection, index, box }) => {
                                            const [x1, y1, x2, y2] = box;

                                            const color =
                                                CLASS_COLORS[
                                                    detection.class
                                                ] || "#9ca3af";

                                            const isSelected =
                                                selected === index;

                                            return (
                                                <button
                                                    key={
                                                        detection.id ??
                                                        index
                                                    }
                                                    type="button"
                                                    className={
                                                        "cls-box" +
                                                        (isSelected
                                                            ? " selected"
                                                            : "")
                                                    }
                                                    title={`Seed ${index + 1}`}
                                                    style={{
                                                        left: `${(x1 / imageWidth) * 100}%`,
                                                        top: `${(y1 / imageHeight) * 100}%`,
                                                        width: `${((x2 - x1) / imageWidth) * 100}%`,
                                                        height: `${((y2 - y1) / imageHeight) * 100}%`,
                                                        borderColor:
                                                            isSelected
                                                                ? "#111827"
                                                                : color,
                                                    }}
                                                    onClick={() =>
                                                        openSeed(index)
                                                    }
                                                />
                                            );
                                        }
                                    )}

                                {popupOpen && selectedDetection && (
                                    <div
                                        ref={popupRef}
                                        className="cls-popup"
                                        style={{
                                            left: popupPos.x,
                                            top: popupPos.y,
                                            width: POPUP_WIDTH,
                                        }}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                    >
                                        <button
                                            type="button"
                                            className="cls-popup-close"
                                            aria-label="Close"
                                            onClick={() =>
                                                setPopupOpen(false)
                                            }
                                        >
                                            <XIcon size={16} />
                                        </button>

                                        <strong>
                                            Seed Number {selected + 1}
                                        </strong>

                                        {popupRows.map(
                                            ([label, value]) => (
                                                <p key={label}>
                                                    {label}: {value}
                                                </p>
                                            )
                                        )}
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="cls-no-image">
                                The uploaded image is no longer
                                available. Start a new test to view
                                detections.
                            </div>
                        )}
                    </div>

                    <div className="cls-seed-buttons">
                        {detections.map((detection, index) => (
                            <button
                                key={detection.id ?? index}
                                type="button"
                                className={
                                    "cls-seed-btn" +
                                    (selected === index
                                        ? " active"
                                        : "")
                                }
                                onClick={() => openSeed(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                </section>

                {/* Summary */}
                <aside className="cls-side">

                    <section className="cls-card">
                        <h2>Classification Summary</h2>

                        <div className="cls-row">
                            <span>
                                <i style={{ background: CLASS_COLORS.Normal }} />
                                Normal
                            </span>
                            <strong>{normalCount}</strong>
                        </div>

                        <div className="cls-row">
                            <span>
                                <i style={{ background: CLASS_COLORS.Abnormal }} />
                                Abnormal
                            </span>
                            <strong>{abnormalCount}</strong>
                        </div>

                        <div className="cls-row">
                            <span>
                                <i style={{ background: CLASS_COLORS.Dead }} />
                                Dead
                            </span>
                            <strong>{deadCount}</strong>
                        </div>

                        <div className="cls-row cls-total">
                            <span>Total Seeds</span>
                            <strong>{totalSeeds}</strong>
                        </div>
                    </section>

                    <section className="cls-card">
                        <span className="cls-small-label">
                            Germination Rate
                        </span>

                        <div className="cls-big-value">
                            {Math.round(germination)}%
                        </div>
                    </section>

                </aside>
            </div>

            {saveError && (
                <div className="error-message cls-error">
                    {saveError}
                </div>
            )}

            <div className="cls-actions">
                <button
                    type="button"
                    className="cls-btn"
                    onClick={() => navigate("/new-test")}
                    disabled={saving}
                >
                    <XIcon size={16} /> Cancel
                </button>

                <button
                    type="button"
                    className="cls-btn cls-btn-primary"
                    onClick={saveReport}
                    disabled={saving}
                >
                    {saving ? "Saving..." : <><SaveIcon size={16} /> Save Result</>}
                </button>
            </div>

        </div>
    );
}