import { XIcon, ScanIcon } from "../components/Icons";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SeedLotForm from "../components/SeedLotForm";
import ImagePicker from "../components/ImagePicker";
import AnalyzingOverlay from "../components/AnalyzingOverlay";
import api from "../services/api";
import useSettings from "../hooks/useSettings";
import { closeAlert, confirmAction } from "../utils/alert";

export default function NewTest() {
    const navigate = useNavigate();
    const location = useLocation();

    // "Add Rep 2 Test" sends the seed details in navigation state.
    const [details, setDetails] = useState(
        location.state?.prefill ?? null
    );
    const [image, setImage] = useState(null);
    const settings = useSettings();
    const [chosenConfidence, setConfidence] = useState(null);
    // Until the analyst moves the slider, use the admin's default.
    const confidence = chosenConfidence ?? settings.default_confidence;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const controllerRef = useRef(null);
    const confirmingRef = useRef(false);

    async function handleCancelAnalysis() {
        if (confirmingRef.current) {
            return;
        }

        confirmingRef.current = true;

        const ok = await confirmAction({
            title: "Stop the analysis?",
            text: "The image will not be analyzed and you will need to start again.",
            confirmText: "Yes, stop",
            cancelText: "Keep analyzing",
            danger: true,
        });

        confirmingRef.current = false;

        if (ok) {
            controllerRef.current?.abort();
        }
    }

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

        const controller = new AbortController();
        controllerRef.current = controller;

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
                formData,
                { signal: controller.signal }
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
            if (error.code === "ERR_CANCELED") {
                return;
            }

            console.error("Analysis error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to analyze the image."
            );
        } finally {
            // The analysis finished while the "stop?" popup was open.
            if (confirmingRef.current) {
                closeAlert();
            }

            setLoading(false);
        }
    }

    return (
        <div className="new-test-page">

            {loading && (
                <AnalyzingOverlay onCancel={handleCancelAnalysis} />
            )}

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
                                <XIcon size={16} /> Back
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
                            Default: {settings.default_confidence}%.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="primary-button"
                        disabled={!image || loading}
                        onClick={handleAnalyze}
                    >
                        {loading ? "Analyzing..." : <><ScanIcon size={17} /> Analyze Image</>}
                    </button>
                </>
            )}

        </div>
    );
}