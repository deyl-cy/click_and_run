import { RefreshIcon, CheckIcon, XIcon } from "../components/Icons";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, } from "recharts";


export default function Dashboard() {
    const [dashboard, setDashboard] = useState(null);

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard(filters = {}) {
        setLoading(true);
        setError("");

        try {
            const params = {};

            if (filters.from) {
                params.from = filters.from;
            }

            if (filters.to) {
                params.to = filters.to;
            }

            const response = await api.get("/dashboard", {
                params,
            });

            console.log("Dashboard response:", response.data);

            setDashboard(response.data.data);
        } catch (error) {
            console.error("Unable to load dashboard:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleApplyFilters() {
        if (
            fromDate &&
            toDate &&
            fromDate > toDate
        ) {
            setError("The From date cannot be later than the To date.");
            return;
        }

        loadDashboard({
            from: fromDate,
            to: toDate,
        });
    }

    function handleClearFilters() {
        setFromDate("");
        setToDate("");

        loadDashboard();
    }

    function formatDate(date) {
        if (!date) return "—";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    if (loading) {
        return (
            <div className="content-card">
                <div className="loading-state">
                    Loading dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content-card">
                <div className="error-message">
                    {error}
                </div>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                        setError("");
                        loadDashboard();
                    }}
                >
                    <RefreshIcon size={16} /> Retry
                </button>
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    const statistics = dashboard.statistics || {};

    const recentReports =
        dashboard.recentReports || [];

    const analytics =
        dashboard.analytics || [];

    const distributionData = [
        {
            name: "Normal",
            value: Number(
                statistics.normalCount || 0
            ),
        },
        {
            name: "Abnormal",
            value: Number(
                statistics.abnormalCount || 0
            ),
        },
        {
            name: "Dead",
            value: Number(
                statistics.deadCount || 0
            ),
        },
    ];

    const distributionColors = [
        "#16a34a",
        "#f59e0b",
        "#dc2626",
    ];

    return (
        <div className="dashboard-page">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>

                    <p>
                        Overview of your rice seed
                        analysis activity.
                    </p>
                </div>

                <Link
                    to="/new-test"
                    className="primary-button"
                >
                    New Test
                </Link>
            </div>

            {/* Date Filters */}
            <div className="content-card dashboard-filter-card">
                <div className="dashboard-filter-header">
                    <div>
                        <h2>Filter Dashboard</h2>

                        <p>
                            Filter statistics and analytics
                            by reading date.
                        </p>
                    </div>
                </div>

                <div className="dashboard-filters">

                    <div className="filter-field">
                        <label htmlFor="dashboard-from">
                            From
                        </label>

                        <input
                            id="dashboard-from"
                            type="date"
                            value={fromDate}
                            onChange={(event) =>
                                setFromDate(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="filter-field">
                        <label htmlFor="dashboard-to">
                            To
                        </label>

                        <input
                            id="dashboard-to"
                            type="date"
                            value={toDate}
                            onChange={(event) =>
                                setToDate(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="filter-actions">
                        <button
                            type="button"
                            className="primary-button"
                            onClick={handleApplyFilters}
                        >
                            <CheckIcon size={16} /> Apply
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleClearFilters}
                        >
                            <XIcon size={16} /> Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid">

                <div className="stat-card">
                    <div className="stat-card-title">
                        Total Reports
                    </div>

                    <div className="stat-card-value">
                        {statistics.totalReports ?? 0}
                    </div>

                    <div className="stat-card-description">
                        Saved seed tests
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-title">
                        Seeds Analyzed
                    </div>

                    <div className="stat-card-value">
                        {statistics.totalSeeds ?? 0}
                    </div>

                    <div className="stat-card-description">
                        Total detected seeds
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-title">
                        Average Viability
                    </div>

                    <div className="stat-card-value">
                        {statistics.averageViability ?? 0}%
                    </div>

                    <div className="stat-card-description">
                        Across saved reports
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-title">
                        Average Germination
                    </div>

                    <div className="stat-card-value">
                        {statistics.averagePredictedGermination ?? 0}%
                    </div>

                    <div className="stat-card-description">
                        Predicted germination
                    </div>
                </div>

            </div>

            {/* Analysts Table of admins */}
            {Array.isArray(dashboard.analysts) && (
                <div className="content-card">
                    <div className="reports-header">
                        <div>
                            <h2>By Analyst</h2>
                            <p>Reports and results per analyst.</p>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Analyst</th>
                                    <th>Reports</th>
                                    <th>Seeds</th>
                                    <th>Avg viability</th>
                                    <th>Avg germination</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.analysts.map((row) => (
                                    <tr key={row.user_id}>
                                        <td>{row.name}</td>
                                        <td>{row.reports}</td>
                                        <td>{row.seeds}</td>
                                        <td>{row.viability}%</td>
                                        <td>{row.germination}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Analysis Trends */}
            <div className="content-card">

                <div className="reports-header">
                    <div>
                        <h2>
                            Analysis Trends
                        </h2>

                        <p>
                            Viability and predicted
                            germination across saved
                            reports.
                        </p>
                    </div>
                </div>

                {analytics.length === 0 ? (
                    <div className="empty-state">
                        <h3>
                            No analytics available
                        </h3>

                        <p>
                            No saved reports match
                            the selected date range.
                        </p>
                    </div>
                ) : (
                    <div className="dashboard-chart">

                        <ResponsiveContainer
                            width="100%"
                            height={350}
                        >
                            <LineChart
                                data={analytics}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 10,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                />

                                <XAxis
                                    dataKey="seed_lot_no"
                                    tick={{
                                        fontSize: 12,
                                    }}
                                />

                                <YAxis
                                    domain={[0, 100]}
                                    tickFormatter={(value) =>
                                        `${value}%`
                                    }
                                    tick={{
                                        fontSize: 12,
                                    }}
                                />

                                <Tooltip
                                    formatter={(value) =>
                                        `${value}%`
                                    }
                                    labelFormatter={(label) =>
                                        `Seed Lot: ${label}`
                                    }
                                />

                                <Legend />

                                <Line
                                    type="monotone"
                                    dataKey="viability"
                                    name="Viability"
                                    stroke="#16a34a"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="predicted_germination"
                                    name="Predicted Germination"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                    </div>
                )}
            </div>

            {/* Distribution */}
            <div className="content-card">

                <div className="reports-header">
                    <div>
                        <h2>
                            Seed Condition Distribution
                        </h2>

                        <p>
                            Overall classification of
                            detected seeds across the
                            selected reports.
                        </p>
                    </div>
                </div>

                {Number(statistics.totalSeeds || 0) === 0 ? (
                    <div className="empty-state">

                        <h3>
                            No seed data available
                        </h3>

                        <p>
                            No seed data matches the
                            selected date range.
                        </p>

                    </div>
                ) : (
                    <div className="distribution-chart">

                        <ResponsiveContainer
                            width="100%"
                            height={350}
                        >
                            <PieChart>

                                <Pie
                                    data={distributionData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={120}
                                    paddingAngle={3}
                                    label={({
                                        name,
                                        percent,
                                    }) =>
                                        `${name} ${(
                                            percent * 100
                                        ).toFixed(1)}%`
                                    }
                                >
                                    {distributionData.map(
                                        (
                                            entry,
                                            index
                                        ) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    distributionColors[
                                                        index
                                                    ]
                                                }
                                            />
                                        )
                                    )}
                                </Pie>

                                <Tooltip
                                    formatter={(
                                        value,
                                        name
                                    ) => [
                                        value,
                                        name,
                                    ]}
                                />

                                <Legend />

                            </PieChart>
                        </ResponsiveContainer>

                    </div>
                )}
            </div>

            {/* Recent Reports */}
            <div className="content-card">

                <div className="reports-header">

                    <div>
                        <h2>
                            Recent Reports
                        </h2>

                        <p>
                            Latest saved seed analysis
                            reports within the selected
                            date range.
                        </p>
                    </div>

                    <Link
                        to="/reports"
                        className="secondary-button"
                    >
                        View All Reports
                    </Link>

                </div>

                {recentReports.length === 0 ? (
                    <div className="empty-state">

                        <h3>
                            No reports yet
                        </h3>

                        <p>
                            Run a seed analysis to
                            create your first report.
                        </p>

                        <Link
                            to="/new-test"
                            className="primary-button"
                        >
                            Start New Test
                        </Link>

                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table className="results-table">

                            <thead>
                                <tr>
                                    <th>Seed Lot</th>
                                    <th>Accession</th>
                                    <th>Reading Date</th>
                                    <th>Replicate</th>
                                    <th>Total</th>
                                    <th>Viability</th>
                                    <th>Germination</th>
                                </tr>
                            </thead>

                            <tbody>

                                {recentReports.map(
                                    (report) => (
                                        <tr
                                            key={report.id}
                                        >
                                            <td>
                                                <Link
                                                    to={`/reports/${report.id}`}
                                                    className="table-link"
                                                >
                                                    {
                                                        report.seed_lot_no
                                                    }
                                                </Link>
                                            </td>

                                            <td>
                                                {
                                                    report.accession ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    report.reading_date
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    report.replicate_number
                                                }
                                            </td>

                                            <td>
                                                {
                                                    report.total_count
                                                }
                                            </td>

                                            <td>
                                                {
                                                    report.viability
                                                }%
                                            </td>

                                            <td>
                                                {
                                                    report.predicted_germination
                                                }%
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}