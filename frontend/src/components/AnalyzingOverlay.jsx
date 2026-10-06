import { useEffect, useState } from "react";

export default function AnalyzingOverlay({ onCancel }) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(
            () => setSeconds((value) => value + 1),
            1000
        );

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="analyze-overlay">
            <div
                className="analyze-box"
                role="status"
                aria-live="polite"
            >
                <div className="analyze-spinner" />

                <h2>Analyzing image...</h2>

                <p>
                    Detecting and classifying seeds. This may take
                    a few moments.
                </p>

                <div className="analyze-time">{seconds}s</div>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={onCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}