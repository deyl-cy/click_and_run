import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    BI,
    BackIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    SearchIcon,
} from "../components/Icons";
import api from "../services/api";

const PER_PAGE = 15;

const ACTION_STYLE = {
    "auth.login": { icon: "box-arrow-in-right", tone: "green" },
    "auth.login_failed": { icon: "exclamation-triangle", tone: "red" },
    "auth.logout": { icon: "box-arrow-right", tone: "gray" },
    "report.created": { icon: "file-earmark-plus", tone: "blue" },
    "report.updated": { icon: "pencil-square", tone: "amber" },
    "report.deleted": { icon: "trash", tone: "red" },
    "user.created": { icon: "person-plus", tone: "blue" },
    "user.updated": { icon: "person-gear", tone: "amber" },
    "user.status": { icon: "person-check", tone: "purple" },
    "settings.updated": { icon: "gear", tone: "purple" },
};

const GROUPS = [
    { value: "", label: "All activity" },
    { value: "auth", label: "Sign-ins & sign-outs" },
    { value: "report", label: "Reports" },
    { value: "user", label: "User management" },
    { value: "settings", label: "Settings" },
    { value: "auth.login_failed", label: "Failed sign-ins only" },
];

function formatWhen(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [labels, setLabels] = useState({});
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [action, setAction] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);

            try {
                const response = await api.get("/admin/activity-logs", {
                    params: {
                        search: debouncedSearch || undefined,
                        action: action || undefined,
                        from: from || undefined,
                        to: to || undefined,
                        page,
                        per_page: PER_PAGE,
                    },
                });

                if (cancelled) {
                    return;
                }

                setLogs(response.data.data);
                setMeta(response.data.meta);
                setLabels(response.data.actions || {});
            } catch {
                if (!cancelled) {
                    setLogs([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [debouncedSearch, action, from, to, page]);

    function clearFilters() {
        setSearch("");
        setDebouncedSearch("");
        setAction("");
        setFrom("");
        setTo("");
        setPage(1);
    }

    const hasFilters = search || action || from || to;

    return (
        <div className="activity-log-page">

            <div className="page-header">
                <div>
                    <h1>Activity Log</h1>
                    <p>Review sign-ins, report changes and administrative actions.</p>
                </div>

                <Link to="/admin" className="secondary-button">
                    <BackIcon size={15} /> Back
                </Link>
            </div>

            <div className="content-card">

                <div className="al-filters">

                    <div className="al-search">
                        <SearchIcon size={15} />
                        <input
                            type="text"
                            placeholder="Search user, activity or IP..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <select
                        value={action}
                        onChange={(event) => {
                            setAction(event.target.value);
                            setPage(1);
                        }}
                    >
                        {GROUPS.map((group) => (
                            <option key={group.value} value={group.value}>
                                {group.label}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={from}
                        max={to || undefined}
                        onChange={(event) => {
                            setFrom(event.target.value);
                            setPage(1);
                        }}
                        aria-label="From date"
                    />

                    <input
                        type="date"
                        value={to}
                        min={from || undefined}
                        onChange={(event) => {
                            setTo(event.target.value);
                            setPage(1);
                        }}
                        aria-label="To date"
                    />

                    {hasFilters && (
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={clearFilters}
                        >
                            Clear
                        </button>
                    )}

                </div>

                <div className="al-table-wrap">
                    <table className="al-table">
                        <thead>
                            <tr>
                                <th>When</th>
                                <th>User</th>
                                <th>Activity</th>
                                <th>IP address</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan="4" className="al-empty">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="al-empty">
                                        No activity found.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                logs.map((log) => {
                                    const style =
                                        ACTION_STYLE[log.action] ||
                                        { icon: "dot", tone: "gray" };

                                    return (
                                        <tr key={log.id}>
                                            <td className="al-when">
                                                {formatWhen(log.created_at)}
                                            </td>

                                            <td>{log.user_name || "—"}</td>

                                            <td>
                                                <div className="al-activity">
                                                    <span className={`al-icon al-${style.tone}`}>
                                                        <BI name={style.icon} size={15} />
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {labels[log.action] || log.action}
                                                        </strong>
                                                        <span>{log.description}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="al-ip">
                                                {log.ip_address || "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                <div className="al-pagination">
                    <span>
                        {meta.total} {meta.total === 1 ? "entry" : "entries"}
                    </span>

                    <div>
                        <button
                            type="button"
                            className="secondary-button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((value) => value - 1)}
                        >
                            <ChevronLeftIcon size={14} /> Prev
                        </button>

                        <span className="al-page">
                            Page {meta.current_page} of {meta.last_page}
                        </span>

                        <button
                            type="button"
                            className="secondary-button"
                            disabled={page >= meta.last_page || loading}
                            onClick={() => setPage((value) => value + 1)}
                        >
                            Next <ChevronRightIcon size={14} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
