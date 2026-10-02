import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";

const DEFAULT_FILTERS = {
    search: "",
    sort: "newest",
    dateField: "sown",
    from: "",
    to: "",
};

function formatDate(value) {
    const [year, month, day] = String(value || "")
        .slice(0, 10)
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

function buildParams(filters) {
    const params = {
        sort: filters.sort,
        dateField: filters.dateField,
    };

    if (filters.search.trim()) {
        params.search = filters.search.trim();
    }

    if (filters.from) {
        params.from = filters.from;
    }

    if (filters.to) {
        params.to = filters.to;
    }

    return params;
}

function repLine(number, rep) {
    if (!rep) {
        return `Rep ${number}: Not recorded`;
    }

    return (
        `Rep ${number}: N ${rep.normal_count} / ` +
        `AB ${rep.abnormal_count} / D ${rep.dead_count}`
    );
}

export default function Reports() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [groups, setGroups] = useState([]);
    const [meta, setMeta] = useState({
        test_reports: 0,
        accessions: 0,
    });

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState("");
    const [error, setError] = useState("");

    const requestRef = useRef(0);

    function setFilter(name, value) {
        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    /* Reload (debounced) whenever a filter changes */

    useEffect(() => {
        const timer = setTimeout(loadGroups, 300);

        return () => clearTimeout(timer);
    }, [filters]);

    async function loadGroups() {
        const requestId = ++requestRef.current;

        setLoading(true);
        setError("");

        try {
            const response = await api.get("/report-groups", {
                params: buildParams(filters),
            });

            if (requestId !== requestRef.current) {
                return;
            }

            setGroups(response.data.data || []);
            setMeta(
                response.data.meta || {
                    test_reports: 0,
                    accessions: 0,
                }
            );
        } catch (err) {
            if (requestId !== requestRef.current) {
                return;
            }

            console.error("Unable to load reports:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load the test reports."
            );
        } finally {
            if (requestId === requestRef.current) {
                setLoading(false);
            }
        }
    }

    /* Download PDF / Excel of everything currently listed */

    async function handleDownload(kind) {
        setExporting(kind);
        setError("");

        try {
            const response = await api.get(
                `/report-groups/export/${kind}`,
                {
                    params: buildParams(filters),
                    responseType: "blob",
                }
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
                `seed-test-reports-${new Date().toLocaleDateString("en-CA")}.` +
                (kind === "pdf" ? "pdf" : "xlsx");

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Unable to export ${kind}:`, err);

            setError(
                `Unable to download the ${
                    kind === "pdf" ? "PDF" : "Excel"
                } file.`
            );
        } finally {
            setExporting("");
        }
    }

    const count = groups.length;

    return (
        <div className="rl-page">

            <div className="rl-header">
                <div>
                    <span className="rl-eyebrow">HISTORICAL DATA</span>
                    <h1>Test Reports</h1>
                    <p>Search and review saved seed analysis records.</p>
                </div>

                <Link to="/new-test" className="rl-btn rl-btn-primary">
                    + New Test
                </Link>
            </div>

            {/* Search / sort */}
            <div className="rl-toolbar">
                <div className="rl-search">
                    <span>⌕</span>
                    <input
                        type="text"
                        placeholder="Search lot, accession, or name"
                        value={filters.search}
                        onChange={(event) =>
                            setFilter("search", event.target.value)
                        }
                    />
                </div>

                <select
                    className="rl-input"
                    value={filters.sort}
                    onChange={(event) =>
                        setFilter("sort", event.target.value)
                    }
                >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name">Accession name (A-Z)</option>
                    <option value="viability">Highest viability</option>
                </select>

                <span className="rl-count">
                    {meta.test_reports} test reports /{" "}
                    {meta.accessions} accessions
                </span>
            </div>

            {/* Date filters / downloads */}
            <div className="rl-filters">
                <label>
                    <span>Date field</span>
                    <select
                        className="rl-input"
                        value={filters.dateField}
                        onChange={(event) =>
                            setFilter("dateField", event.target.value)
                        }
                    >
                        <option value="sown">Sowing date</option>
                        <option value="reading">Reading date</option>
                    </select>
                </label>

                <label>
                    <span>From</span>
                    <input
                        type="date"
                        className="rl-input"
                        value={filters.from}
                        onChange={(event) =>
                            setFilter("from", event.target.value)
                        }
                    />
                </label>

                <label>
                    <span>To</span>
                    <input
                        type="date"
                        className="rl-input"
                        value={filters.to}
                        onChange={(event) =>
                            setFilter("to", event.target.value)
                        }
                    />
                </label>

                <button
                    type="button"
                    className="rl-btn rl-btn-primary"
                    disabled={count === 0 || exporting !== ""}
                    onClick={() => handleDownload("pdf")}
                >
                    {exporting === "pdf"
                        ? "Preparing..."
                        : `Download PDF (${count})`}
                </button>

                <button
                    type="button"
                    className="rl-btn"
                    disabled={count === 0 || exporting !== ""}
                    onClick={() => handleDownload("excel")}
                >
                    {exporting === "excel"
                        ? "Preparing..."
                        : `Download Excel (${count})`}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* List */}
            <div className="rl-list">
                {loading && count === 0 ? (
                    <div className="rl-empty">Loading reports...</div>
                ) : count === 0 ? (
                    <div className="rl-empty">
                        No test reports found.
                    </div>
                ) : (
                    groups.map((group) => (
                        <Link
                            key={group.key}
                            to={`/reports/${group.id}`}
                            className="rl-card"
                        >
                            <div className="rl-thumb">
                                {group.image_url ? (
                                    <img src={group.image_url} alt="" />
                                ) : (
                                    <span>No image</span>
                                )}
                            </div>

                            <div className="rl-body">
                                <h3>{group.accession_name}</h3>
                                <p>Lot No.: {group.seed_lot_no}</p>
                                <p>Accession: {group.accession || "-"}</p>
                                <p>Date Sown: {formatDate(group.date_sown)}</p>
                                <p>{repLine(1, group.reps?.[1])}</p>
                                <p>{repLine(2, group.reps?.[2])}</p>
                            </div>

                            <div className="rl-score">
                                <strong>
                                    {Number(group.viability).toFixed(1)}%
                                </strong>
                                <span>Total Viability</span>
                            </div>

                            <span className="rl-chevron">›</span>
                        </Link>
                    ))
                )}
            </div>

        </div>
    );
}