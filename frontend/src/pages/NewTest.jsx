import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SeedLotForm from "../components/SeedLotForm";
import ImagePicker from "../components/ImagePicker";
import api from "../services/api";

export default function NewTest() {
    const navigate = useNavigate();
    const location = useLocation();

    const [details, setDetails] = useState(
        location.state?.prefill ?? null
    );
    const [image, setImage] = useState(null);

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

            formData.append(
                "seedLotNo",
                details.seedLotNo
            );

            formData.append(
                "accession",
                details.accession || ""
            );

            formData.append(
                "collectionNo",
                details.collectionNo
            );

            formData.append(
                "accessionName",
                details.accessionName
            );

            formData.append(
                "dateSown",
                details.dateSown
            );

            formData.append(
                "readingDate",
                details.readingDate
            );

            formData.append(
                "replicateNumber",
                details.replicateNumber
            );

            const response = await api.post(
                "/reports/analyze",
                formData
            );

            console.log("Analysis API response:", response.data);

            const result = response.data?.data;

            console.log("Details:", result?.details);
            console.log("Analysis:", result?.analysis);
            console.log("Counts:", result?.analysis?.counts);

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

                </div>
            )}

        </div>
    );
}