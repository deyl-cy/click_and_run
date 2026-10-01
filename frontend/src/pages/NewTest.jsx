import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SeedLotForm from "../components/SeedLotForm";
import ImagePicker from "../components/ImagePicker";
import api from "../services/api";

const DEFAULT_CONFIDENCE = 30;

export default function NewTest() {
    const navigate = useNavigate();
    const location = useLocation();

    // "Add Rep 2 Test" sends the seed details in navigation state.
    const [details, setDetails] = useState(
        location.state?.prefill ?? null
    );
    const [image, setImage] = useState(null);
    const [confidence, setConfidence] = useState(DEFAULT_CONFIDENCE);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleDetailsSubmit(data) {
        setError("");
        setDetails(data);
    }

    async function handleAnalyze() {
        if (!image || !details) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();

            formData.append("image", image);

            formData.append("seedLotNo", details.seedLotNo);
            formData.append("accession", details.accession || "");
            formData.append("collectionNo", details.collectionNo);
            formData.append("accessionName", details.accessionName);
            formData.append("dateSown", details.dateSown);
            formData.append("readingDate", details.readingDate);
            formData.append("replicateNumber", details.replicateNumber);

            // Slider is 5-95 (%); the API expects 0-1.
            formData.append("confidence", String(confidence / 100));

            const response = await api.post(
                "/reports/analyze",
                formData
            );

            const result = response.data?.data;

            navigate("/results", {
                state: {
                    details: result?.details,
                    analysis: result?.analysis,
                    image: image,
                },
            });

        } catch (error) {
            console.error("Analysis error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to analyze the image."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="new-test-page">

            <div className="page-header">
                <div>
                    <h1>New Test</h1>

                    <p>
                        Analyze a new rice seed batch.
                    </p>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {!details ? (
                <div className="content-card">
                    <SeedLotForm
                        onSubmit={handleDetailsSubmit}
                        loading={loading}
                    />
                </div>
            ) : (
                <>
                    <div className="content-card">

                        <div className="test-step-header">

                            <div>
                                <h2>Seed Batch Image</h2>

                                <p>
                                    Select the image containing
                                    the seeds to analyze.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setDetails(null);
                                    setImage(null);
                                    setError("");
                                }}
                            >
                                Back
                            </button>

                        </div>

                        <ImagePicker
                            onChange={setImage}
                        />

                    </div>

                    <div className="content-card conf-card">

                        <div className="conf-title">
                            <h2>Detection Confidence</h2>
                        </div>

                        <p className="conf-subtitle">
                            Minimum confidence required for a
                            seedling to be counted.
                        </p>

                        <label className="conf-label" htmlFor="confidence">
                            Confidence Threshold{" "}
                            <strong>{confidence}%</strong>
                        </label>

                        <input
                            id="confidence"
                            type="range"
                            className="conf-slider"
                            min="5"
                            max="95"
                            step="1"
                            value={confidence}
                            onChange={(event) =>
                                setConfidence(
                                    Number(event.target.value)
                                )
                            }
                        />

                        <p className="conf-hint">
                            Lower catches more seedlings but risks
                            false positives. Higher is stricter but
                            may miss faint or partial seedlings.
                            Default: {DEFAULT_CONFIDENCE}%.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="primary-button"
                        disabled={!image || loading}
                        onClick={handleAnalyze}
                    >
                        {loading
                            ? "Analyzing..."
                            : "Analyze Image"}
                    </button>
                </>
            )}

        </div>
    );
}