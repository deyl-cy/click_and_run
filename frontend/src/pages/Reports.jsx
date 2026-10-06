import { PlusIcon, SearchIcon, PdfIcon, ExcelIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from "../components/Icons";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    alertError,
    closeAlert,
    showLoading,
    toastSuccess,
} from "../utils/alert";

const PER_PAGE = 10;

const DEFAULT_FILTERS = {
    search: "",
    sort: "newest",
    dateField: "sown",
    from: "",
    to: "",
    analyst: "",
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

    if (filters.analyst) {
        params.analyst = filters.analyst;
    }

    return params;
}

function pageList(current, last) {
    if (last <= 7) {
        return Array.from({ length: last }, (_, index) => index + 1);
    }

    const pages = [1, last, current - 1, current, current + 1]
        .filter((page) => page >= 1 && page <= last)
        .filter((page, index, all) => all.indexOf(page) === index)
        .sort((a, b) => a - b);

    const result = [];

    pages.forEach((page, index) => {
        if (index > 0 && page - pages[index - 1] > 1) {
            result.push("...");
        }

        result.push(page);
    });

    return result;
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
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [groups, setGroups] = useState([]);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({
        test_reports: 0,
        accessions: 0,
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: PER_PAGE,
        analysts: [],
    });

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState("");
    const [error, setError] = useState("");

    const requestRef = useRef(0);

    function setFilter(name, value) {
        setPage(1);

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function goToPage(number) {
        setPage(number);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    /* Reload (debounced) whenever a filter or the page changes */

    useEffect(() => {
        const timer = setTimeout(loadGroups, 300);

        return () => clearTimeout(timer);
    }, [filters, page]);

    async function loadGroups() {
        const requestId = ++requestRef.current;

        setLoading(true);
        setError("");

        try {
            const response = await api.get("/report-groups", {
                params: {
                    ...buildParams(filters),
                    page,
                    per_page: PER_PAGE,
                },
            });

            if (requestId !== requestRef.current) {
                return;
            }

            setGroups(response.data.data || []);
            setMeta((current) => ({
                ...current,
                ...(response.data.meta || {}),
            }));
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

    /* Download PDF / Excel of ALL reports matching the filters */

    async function handleDownload(kind) {
        const label = kind === "pdf" ? "PDF" : "Excel";

        setExporting(kind);
        setError("");

        showLoading(`Preparing ${label}...`, "This may take a moment.");

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

            closeAlert();
            toastSuccess(`${label} download started.`);
        } catch (err) {
            console.error(`Unable to export ${kind}:`, err);

            closeAlert();
            alertError(
                `Unable to download the ${label} file.`,
                "Download failed"
            );
        } finally {
            setExporting("");
        }
    }

    const count = groups.length;
    const totalCount = meta.accessions;

    const rangeStart =
        count === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const rangeEnd = rangeStart + count - 1;

    return (
        <div className="rl-page">

            <div className="rl-header">
                <div>
                    <span className="rl-eyebrow">HISTORICAL DATA</span>
                    <h1>Test Reports</h1>
                    <p>
                        {isAdmin
                            ? "Search and review seed analysis records from all analysts."
                            : "Search and review saved seed analysis records."}
                    </p>
                </div>

                <Link to="/new-test" className="rl-btn rl-btn-primary">
                    <PlusIcon size={17} />
                    New Test
                </Link>
            </div>

            {/* Search / sort */}
            <div className="rl-toolbar">
                <div className="rl-search">
                    <SearchIcon size={17} />
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
            <div
                className={
                    "rl-filters" + (isAdmin ? " rl-filters-admin" : "")
                }
            >
                {isAdmin && (
                    <label>
                        <span>Tested by</span>
                        <select
                            className="rl-input"
                            value={filters.analyst}
                            onChange={(event) =>
                                setFilter("analyst", event.target.value)
                            }
                        >
                            <option value="">All analysts</option>
                            {(meta.analysts || []).map((person) => (
                                <option key={person.id} value={person.id}>
                                    {person.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

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
                    disabled={totalCount === 0 || exporting !== ""}
                    onClick={() => handleDownload("pdf")}
                >
                    {exporting === "pdf" ? <><DownloadIcon size={16} /> Preparing...</> : <><PdfIcon size={16} /> Download PDF ({totalCount})</>}
                </button>

                <button
                    type="button"
                    className="rl-btn"
                    disabled={totalCount === 0 || exporting !== ""}
                    onClick={() => handleDownload("excel")}
                >
                    {exporting === "excel" ? <><DownloadIcon size={16} /> Preparing...</> : <><ExcelIcon size={16} /> Download Excel ({totalCount})</>}
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
                                {isAdmin && (
                                    <p>Tested by: {group.tested_by || "-"}</p>
                                )}
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

            {/* Pagination */}
            {totalCount > 0 && (
                <div className="rl-pagination-bar">
                    <span className="rl-page-info">
                        Showing {rangeStart}-{rangeEnd} of {totalCount}{" "}
                        accessions
                    </span>

                    {meta.last_page > 1 && (
                        <nav className="rl-pagination">
                            <button
                                type="button"
                                className="rl-page-btn"
                                disabled={meta.current_page <= 1 || loading}
                                onClick={() =>
                                    goToPage(meta.current_page - 1)
                                }
                            >
                                <ChevronLeftIcon size={16} /> Previous
                            </button>

                            {pageList(
                                meta.current_page,
                                meta.last_page
                            ).map((item, index) =>
                                item === "..." ? (
                                    <span
                                        key={`gap-${index}`}
                                        className="rl-page-gap"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        className={
                                            "rl-page-btn" +
                                            (item === meta.current_page
                                                ? " active"
                                                : "")
                                        }
                                        disabled={loading}
                                        onClick={() => goToPage(item)}
                                    >
                                        {item}
                                    </button>
                                )
                            )}

                            <button
                                type="button"
                                className="rl-page-btn"
                                disabled={
                                    meta.current_page >= meta.last_page ||
                                    loading
                                }
                                onClick={() =>
                                    goToPage(meta.current_page + 1)
                                }
                            >
                                Next <ChevronRightIcon size={16} />
                            </button>
                        </nav>
                    )}
                </div>
            )}

        </div>
    );
}