import { useEffect, useRef, useState } from "react";

export default function DetectionImage({
    src,
    detections = [],
}) {
    const imageRef = useRef(null);

    const [displaySize, setDisplaySize] = useState({
        width: 0,
        height: 0,
    });

    function updateSize() {
        if (!imageRef.current) {
            return;
        }

        setDisplaySize({
            width: imageRef.current.clientWidth,
            height: imageRef.current.clientHeight,
        });
    }

    useEffect(() => {
        updateSize();

        window.addEventListener("resize", updateSize);

        return () => {
            window.removeEventListener(
                "resize",
                updateSize
            );
        };
    }, []);

    function handleImageLoad() {
        updateSize();
    }

    function getDetectionClass(detectionClass) {
        const value = String(
            detectionClass || ""
        ).toLowerCase();

        if (value === "normal") {
            return "normal";
        }

        if (value === "abnormal") {
            return "abnormal";
        }

        if (value === "dead") {
            return "dead";
        }

        return "unknown";
    }

    if (!src) {
        return (
            <div className="empty-message">
                No image available for this report.
            </div>
        );
    }

    return (
        <div className="detection-viewer">

            <div className="detection-image-container">

                <img
                    ref={imageRef}
                    src={src}
                    alt="Analyzed seed batch"
                    className="detection-image"
                    onLoad={handleImageLoad}
                />

                <div className="detection-overlay">

                    {detections.map(
                        (detection, index) => {

                            const x1 = Number(
                                detection.x1
                            );

                            const y1 = Number(
                                detection.y1
                            );

                            const x2 = Number(
                                detection.x2
                            );

                            const y2 = Number(
                                detection.y2
                            );

                            if (
                                !Number.isFinite(x1) ||
                                !Number.isFinite(y1) ||
                                !Number.isFinite(x2) ||
                                !Number.isFinite(y2)
                            ) {
                                return null;
                            }

                            const naturalWidth =
                                imageRef.current
                                    ?.naturalWidth || 1;

                            const naturalHeight =
                                imageRef.current
                                    ?.naturalHeight || 1;

                            const scaleX =
                                displaySize.width /
                                naturalWidth;

                            const scaleY =
                                displaySize.height /
                                naturalHeight;

                            const left =
                                x1 * scaleX;

                            const top =
                                y1 * scaleY;

                            const width =
                                (x2 - x1) *
                                scaleX;

                            const height =
                                (y2 - y1) *
                                scaleY;

                            const confidence =
                                detection.confidence != null
                                    ? (
                                        Number(
                                            detection.confidence
                                        ) * 100
                                    ).toFixed(1)
                                    : null;

                            const className =
                                getDetectionClass(
                                    detection.class
                                );

                            return (
                                <div
                                    key={
                                        detection.id ??
                                        index
                                    }
                                    className={`detection-box detection-box-${className}`}
                                    style={{
                                        left,
                                        top,
                                        width,
                                        height,
                                    }}
                                >
                                    <span
                                        className={`detection-label detection-label-${className}`}
                                    >
                                        {detection.class ||
                                            "Unknown"}

                                        {confidence !== null &&
                                            ` ${confidence}%`}
                                    </span>
                                </div>
                            );
                        }
                    )}

                </div>

            </div>

            <div className="detection-legend">

                <div className="legend-item">
                    <span className="legend-box legend-normal" />
                    <span>Normal</span>
                </div>

                <div className="legend-item">
                    <span className="legend-box legend-abnormal" />
                    <span>Abnormal</span>
                </div>

                <div className="legend-item">
                    <span className="legend-box legend-dead" />
                    <span>Dead</span>
                </div>

            </div>

        </div>
    );
}

