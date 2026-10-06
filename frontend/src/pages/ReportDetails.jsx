import { PlusIcon, XIcon, SaveIcon, PdfIcon, ExcelIcon, EditIcon, TrashIcon } from "../components/Icons";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { confirmAction } from "../utils/alert";

const REPLICATES = [1, 2];

/* -------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------- */

function dateOnly(value) {
    return value ? String(value).slice(0, 10) : "";
}

function formatDate(value) {
    const [year, month, day] = dateOnly(value)
        .split("-")
        .map(Number);

    if (!year) {
        return "-";
    }

    return new Date(year, month - 1, day).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
}

function formatDateTime(value) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return parsed.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function calculate(normal, abnormal, dead) {
    const n = Number(normal) || 0;
    const a = Number(abnormal) || 0;
    const d = Number(dead) || 0;
    const total = n + a + d;

    return {
        total,
        viability: total > 0 ? ((n + a) / total) * 100 : 0,
        germination: total > 0 ? Math.round((n / total) * 100) : 0,
    };
}

function percent(value) {
    return `${parseFloat(Number(value).toFixed(1))}%`;
}

/* -------------------------------------------------------------
 * One replicate card
 * ----------------------------------------------------------- */

function ReplicateCard({
    number,
    report,
    canAdd,
    busyKey,
    onSaved,
    onDelete,
    onAdd,
    onExport,
}) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        normal: "",
        abnormal: "",
        dead: "",
    });

    /* ---------- Not recorded yet ---------- */

    if (!report) {
        return (
            <section className="rp-card">
                <div className="rp-card-head">
                    <span>Rep {number}</span>
                    <small className="rp-muted">Not recorded</small>
                </div>

                <div className="rp-image">
                    <span>No image for Rep {number}</span>
                </div>

                <p className="rp-empty-note">
                    No saved analysis for this replicate.
                </p>

                {canAdd && (
                    <button
                        type="button"
                        className="rp-btn rp-btn-primary"
                        onClick={() => onAdd(number)}
                    >
                        <PlusIcon size={16} /> Add Rep {number} Test
                    </button>
                )}
            </section>
        );
    }

    /* ---------- Recorded ---------- */

    const live = editing
        ? calculate(form.normal, form.abnormal, form.dead)
        : {
            total: report.total_count,
            viability: report.viability,
            germination: report.predicted_germination,
        };

    function startEdit() {
        setForm({
            normal: String(report.normal_count),
            abnormal: String(report.abnormal_count),
            dead: String(report.dead_count),
        });

        setError("");
        setEditing(true);
    }

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function saveChanges() {
        const values = [form.normal, form.abnormal, form.dead];

        if (!values.every((value) => /^\d+$/.test(value))) {
            setError("Enter whole numbers (0 or more).");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const response = await api.put(
                `/reports/${report.id}`,
                {
                    normal_count: Number(form.normal),
                    abnormal_count: Number(form.abnormal),
                    dead_count: Number(form.dead),
                }
            );

            onSaved(response.data.data);
            setEditing(false);
        } catch (err) {
            console.error("Unable to update report:", err);

            setError(
                err.response?.data?.message ||
                "Unable to save changes."
            );
        } finally {
            setSaving(false);
        }
    }

    const tiles = [
        ["normal", "Normal", report.normal_count],
        ["abnormal", "Abnormal", report.abnormal_count],
        ["dead", "Dead", report.dead_count],
    ];

    return (
        <section className="rp-card">
            <div className="rp-card-head">
                <span>Rep {number}</span>
                <small className="rp-recorded">Recorded</small>
            </div>

            <div className="rp-image">
                {report.image_url ? (
                    <img
                        src={report.image_url}
                        alt={`Rep ${number} seed batch`}
                    />
                ) : (
                    <span>No image for Rep {number}</span>
                )}
            </div>

            <div className="rp-tiles">
                {tiles.map(([key, label, value]) =>
                    editing ? (
                        <label key={key} className="rp-field">
                            <span>{label}</span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                name={key}
                                value={form[key]}
                                onChange={updateField}
                            />
                        </label>
                    ) : (
                        <div key={key} className="rp-tile">
                            <span>{label}</span>
                            <strong>{value}</strong>
                        </div>
                    )
                )}
            </div>

            <div className="rp-stats">
                <div>
                    <span>Seeds tested</span>
                    <strong>{live.total}</strong>
                </div>

                <div>
                    <span>Viability</span>
                    <strong>{percent(live.viability)}</strong>
                </div>

                <div>
                    <span>Germination rate</span>
                    <strong>{live.germination}%</strong>
                </div>
            </div>

            {report.last_edited_at && report.editor && (
                <p className="rp-edited">
                    Edited by {report.editor.name} on{" "}
                    {formatDateTime(report.last_edited_at)}
                </p>
            )}

            {error && (
                <div className="error-message rp-error">
                    {error}
                </div>
            )}

            <div className="rp-actions">
                {editing ? (
                    <>
                        <button
                            type="button"
                            className="rp-btn"
                            disabled={saving}
                            onClick={() => {
                                setEditing(false);
                                setError("");
                            }}
                        >
                            <XIcon size={16} /> Cancel
                        </button>

                        <button
                            type="button"
                            className="rp-btn rp-btn-primary"
                            disabled={saving}
                            onClick={saveChanges}
                        >
                            {saving ? "Saving..." : <><SaveIcon size={16} /> Save changes</>}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className="rp-btn rp-btn-ghost"
                            disabled={busyKey === `${report.id}-pdf`}
                            onClick={() => onExport(report, "pdf")}
                        >
                            <PdfIcon size={16} /> PDF
                        </button>

                        <button
                            type="button"
                            className="rp-btn rp-btn-ghost"
                            disabled={busyKey === `${report.id}-excel`}
                            onClick={() => onExport(report, "excel")}
                        >
                            <ExcelIcon size={16} /> Excel
                        </button>

                        <button
                            type="button"
                            className="rp-btn"
                            onClick={startEdit}
                        >
                            <EditIcon size={16} /> Edit AI results
                        </button>

                        <button
                            type="button"
                            className="rp-btn rp-btn-danger"
                            onClick={() => onDelete(report)}
                        >
                            <TrashIcon size={16} /> Delete
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}

/* -------------------------------------------------------------
 * Page
 * ----------------------------------------------------------- */

export default function ReportDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdmin = user?.role === "admin";

    const [report, setReport] = useState(null);
    const [replicates, setReplicates] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyKey, setBusyKey] = useState("");

    useEffect(() => {
        loadReport();
    }, [id]);

    async function loadReport() {
        setLoading(true);
        setError("");

        try {
            const response = await api.get(`/reports/${id}`);

            setReport(response.data.data);

            setReplicates({
                1: response.data.replicates?.["1"] || null,
                2: response.data.replicates?.["2"] || null,
            });
        } catch (err) {
            console.error("Unable to load report:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load this report."
            );
        } finally {
            setLoading(false);
        }
    }

    /* ---------- Save edited counts ---------- */

    function handleSaved(updated) {
        setReplicates((current) => ({
            ...current,
            [updated.replicate_number]: updated,
        }));
    }

    /* ---------- Delete ---------- */

    async function handleDelete(target) {
        const ok = await confirmAction({
            title: "Delete this report?",
            text: "This cannot be undone.",
            confirmText: "Delete",
            danger: true,
        });

        if (!ok) {
            return;
        }

        setError("");

        try {
            await api.delete(`/reports/${target.id}`);

            const remaining = {
                ...replicates,
                [target.replicate_number]: null,
            };

            const other = Object.values(remaining).find(Boolean);

            if (!other) {
                navigate("/reports", { replace: true });
                return;
            }

            if (String(target.id) === String(id)) {
                navigate(`/reports/${other.id}`, { replace: true });
                return;
            }

            setReplicates(remaining);
        } catch (err) {
            console.error("Unable to delete report:", err);

            setError(
                err.response?.data?.message ||
                "Unable to delete this report."
            );
        }
    }

    /* ---------- Add the missing replicate ---------- */

    function handleAdd(number) {
        navigate("/new-test", {
            state: {
                prefill: {
                    seedLotNo: report.seed_lot_no,
                    accession: report.accession || "",
                    collectionNo: report.collection_no,
                    accessionName: report.accession_name,
                    dateSown: dateOnly(report.date_sown),
                    readingDate: dateOnly(report.reading_date),
                    replicateNumber: String(number),
                },
            },
        });
    }

    /* ---------- PDF / Excel ---------- */

    async function handleExport(target, kind) {
        setBusyKey(`${target.id}-${kind}`);
        setError("");

        try {
            const response = await api.get(
                `/reports/${target.id}/export/${kind}`,
                { responseType: "blob" }
            );

            const mime =
                kind === "pdf"
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            const url = window.URL.createObjectURL(
                new Blob([response.data], { type: mime })
            );

            const link = document.createElement("a");

            link.href = url;
            link.download =
                `seed-analysis-report-${target.id}.` +
                (kind === "pdf" ? "pdf" : "xlsx");

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Unable to export ${kind}:`, err);

            setError(
                `Unable to export the report as ${
                    kind === "pdf" ? "PDF" : "Excel"
                }.`
            );
        } finally {
            setBusyKey("");
        }
    }

    /* ---------- Render ---------- */

    if (loading) {
        return <div className="loading-screen">Loading report...</div>;
    }

    if (!report) {
        return (
            <div className="rp-page">
                <div className="error-message">
                    {error || "Report not found."}
                </div>

                <Link to="/reports" className="rp-back">
                    ← Back to Reports
                </Link>
            </div>
        );
    }

    // New replicates are saved under the logged-in user, so only the
    // owner of this seed lot can add the missing one.
    const canAdd = report.user_id === user?.id;

    const recorded = REPLICATES
        .map((number) => replicates[number])
        .filter(Boolean);

    const totalNormal = recorded.reduce(
        (sum, rep) => sum + Number(rep.normal_count),
        0
    );

    const totalAbnormal = recorded.reduce(
        (sum, rep) => sum + Number(rep.abnormal_count),
        0
    );

    const totalSeeds = recorded.reduce(
        (sum, rep) => sum + Number(rep.total_count),
        0
    );

    const totalViability =
        totalSeeds > 0
            ? ((totalNormal + totalAbnormal) / totalSeeds) * 100
            : 0;

    return (
        <div className="rp-page">

            <div className="rp-header">
                <div>
                    <span className="rp-eyebrow">SAVED REPORT</span>
                    <h1>Test Report</h1>
                    <p>Complete classification and germination prediction.</p>
                </div>

                <Link to="/reports" className="rp-back">
                    ← Back to Reports
                </Link>
            </div>

            {error && <div className="error-message">{error}</div>}

            <section className="rp-info">
                <h2>{report.accession_name}</h2>

                <p><strong>2SDS Lot No.:</strong> {report.seed_lot_no}</p>
                <p><strong>Accession:</strong> {report.accession || "-"}</p>
                <p><strong>Collection No.:</strong> {report.collection_no}</p>
                <p><strong>Sowing Date:</strong> {formatDate(report.date_sown)}</p>
                <p><strong>Reading Date:</strong> {formatDate(report.reading_date)}</p>

                {isAdmin && (
                    <p>
                        <strong>Tested by:</strong>{" "}
                        {report.user?.name || "-"}
                    </p>
                )}
            </section>

            <section className="rp-summary">
                <div>
                    <span>Total Viability</span>
                    <strong className="rp-big">{percent(totalViability)}</strong>
                    <small>Normal + Abnormal; Dormant is not AI-classified</small>
                </div>

                <div>
                    <span>Normal</span>
                    <strong>{totalNormal}</strong>
                </div>

                <div>
                    <span>Seeds Tested</span>
                    <strong>{totalSeeds}</strong>
                </div>
            </section>

            <div className="rp-reps">
                {REPLICATES.map((number) => (
                    <ReplicateCard
                        key={`${number}-${replicates[number]?.id ?? "none"}`}
                        number={number}
                        report={replicates[number]}
                        canAdd={canAdd}
                        busyKey={busyKey}
                        onSaved={handleSaved}
                        onDelete={handleDelete}
                        onAdd={handleAdd}
                        onExport={handleExport}
                    />
                ))}
            </div>

        </div>
    );
}