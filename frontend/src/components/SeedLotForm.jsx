import { useState } from "react";

export default function SeedLotForm({
    onSubmit,
    loading = false,
}) {
    const [form, setForm] = useState({
        seedLotNo: "",
        accession: "",
        collectionNo: "",
        accessionName: "",
        dateSown: "",
        readingDate: "",
        replicateNumber: "",
    });

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        onSubmit(form);
    }

    return (
        <form
            className="seed-test-form"
            onSubmit={handleSubmit}
        >
            <div className="form-section">
                <h2>Seed Information</h2>

                <div className="form-grid">

                    <label>
                        Seed Lot No.
                        <input
                            name="seedLotNo"
                            value={form.seedLotNo}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <label>
                        Accession No.
                        <input
                            name="accession"
                            value={form.accession}
                            onChange={updateField}
                        />
                    </label>

                    <label>
                        Collection No.
                        <input
                            name="collectionNo"
                            value={form.collectionNo}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <label>
                        Accession Name
                        <input
                            name="accessionName"
                            value={form.accessionName}
                            onChange={updateField}
                            required
                        />
                    </label>

                </div>
            </div>

            <div className="form-section">
                <h2>Test Information</h2>

                <div className="form-grid">

                    <label>
                        Date Sown
                        <input
                            type="date"
                            name="dateSown"
                            value={form.dateSown}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <label>
                        Reading Date
                        <input
                            type="date"
                            name="readingDate"
                            value={form.readingDate}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <label>
                        Replicate
                        <select
                            name="replicateNumber"
                            value={form.replicateNumber}
                            onChange={updateField}
                            required
                        >
                            <option value="">
                                Select replicate
                            </option>

                            <option value="1">
                                Rep 1
                            </option>

                            <option value="2">
                                Rep 2
                            </option>
                        </select>
                    </label>

                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="primary-button"
            >
                {loading
                    ? "Preparing..."
                    : "Continue"}
            </button>
        </form>
    );
}