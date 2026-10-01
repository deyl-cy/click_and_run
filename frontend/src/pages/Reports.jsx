import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";

export default function Reports() {
    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filters, setFilters] = useState({
        seedLotNo: "",
        accession: "",
        readingDate: "",
        replicateNumber: "",
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    async function loadReports(page = 1) {
        setLoading(true);
        setError("");

        try {
            const params = {
                page,
            };

            if (filters.seedLotNo.trim()) {
                params.seedLotNo =
                    filters.seedLotNo.trim();
            }

            if (filters.accession.trim()) {
                params.accession =
                    filters.accession.trim();
            }

            if (filters.readingDate) {
                params.readingDate =
                    filters.readingDate;
            }

            if (filters.replicateNumber) {
                params.replicateNumber =
                    filters.replicateNumber;
            }

            const response = await api.get(
                "/reports",
                { params }
            );

            const result = response.data;

            setReports(result.data || []);

            setPagination({
                currentPage:
                    result.current_page || 1,

                lastPage:
                    result.last_page || 1,

                total:
                    result.total || 0,
            });

        } catch (error) {
            console.error(
                "Unable to load reports:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load reports."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReports(1);
    }, []);

    function handleFilterChange(event) {
        const {
            name,
            value,
        } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleSearch(event) {
        event.preventDefault();

        loadReports(1);
    }

    function clearFilters() {
        const emptyFilters = {
            seedLotNo: "",
            accession: "",
            readingDate: "",
            replicateNumber: "",
        };

        setFilters(emptyFilters);

        setTimeout(() => {
            loadReports(1);
        }, 0);
    }

    function goToPage(page) {
        if (
            page < 1 ||
            page > pagination.lastPage ||
            page === pagination.currentPage
        ) {
            return;
        }

        loadReports(page);
    }

    function formatDate(date) {
        if (!date) {
            return "—";
        }

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );
    }

    return (
        <div className="reports-page">

            {/* HEADER */}
            <div className="page-header">

                <div>
                    <h1>Test Reports</h1>

                    <p>
                        View and manage your saved
                        seed analysis reports.
                    </p>
                </div>

                <Link
                    to="/new-test"
                    className="primary-button"
                >
                    New Test
                </Link>

            </div>


            {/* FILTERS */}
            <div className="content-card">

                <h2>Search Reports</h2>

                <form
                    className="report-filters"
                    onSubmit={handleSearch}
                >

                    <div className="filter-field">

                        <label htmlFor="seedLotNo">
                            Seed Lot No.
                        </label>

                        <input
                            id="seedLotNo"
                            name="seedLotNo"
                            type="text"
                            value={
                                filters.seedLotNo
                            }
                            onChange={
                                handleFilterChange
                            }
                            placeholder="Search seed lot"
                        />

                    </div>


                    <div className="filter-field">

                        <label htmlFor="accession">
                            Accession
                        </label>

                        <input
                            id="accession"
                            name="accession"
                            type="text"
                            value={
                                filters.accession
                            }
                            onChange={
                                handleFilterChange
                            }
                            placeholder="Search accession"
                        />

                    </div>


                    <div className="filter-field">

                        <label htmlFor="readingDate">
                            Reading Date
                        </label>

                        <input
                            id="readingDate"
                            name="readingDate"
                            type="date"
                            value={
                                filters.readingDate
                            }
                            onChange={
                                handleFilterChange
                            }
                        />

                    </div>


                    <div className="filter-field">

                        <label htmlFor="replicateNumber">
                            Replicate
                        </label>

                        <input
                            id="replicateNumber"
                            name="replicateNumber"
                            type="number"
                            min="1"
                            value={
                                filters.replicateNumber
                            }
                            onChange={
                                handleFilterChange
                            }
                            placeholder="Replicate"
                        />

                    </div>


                    <div className="filter-actions">

                        <button
                            type="submit"
                            className="primary-button"
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear
                        </button>

                    </div>

                </form>

            </div>


            {/* RESULTS */}
            <div className="content-card">

                <div className="reports-header">

                    <div>
                        <h2>Saved Reports</h2>

                        <p>
                            {pagination.total}{" "}
                            report
                            {pagination.total === 1
                                ? ""
                                : "s"}
                        </p>
                    </div>

                </div>


                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}


                {loading ? (

                    <div className="loading-state">
                        Loading reports...
                    </div>

                ) : reports.length === 0 ? (

                    <div className="empty-state">

                        <h3>
                            No reports found
                        </h3>

                        <p>
                            Try changing your
                            search filters or
                            create a new test.
                        </p>

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
                                    <th>Normal</th>
                                    <th>Abnormal</th>
                                    <th>Dead</th>
                                    <th>Viability</th>
                                    <th>Germination</th>
                                </tr>

                            </thead>


                            <tbody>

                                {reports.map(
                                    (report) => (

                                        <tr
                                            key={
                                                report.id
                                            }
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
                                                    report.normal_count
                                                }
                                            </td>

                                            <td>
                                                {
                                                    report.abnormal_count
                                                }
                                            </td>

                                            <td>
                                                {
                                                    report.dead_count
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


                {/* PAGINATION */}
                {!loading &&
                    pagination.lastPage > 1 && (

                    <div className="pagination">

                        <button
                            type="button"
                            className="secondary-button"
                            disabled={
                                pagination.currentPage ===
                                1
                            }
                            onClick={() =>
                                goToPage(
                                    pagination.currentPage -
                                    1
                                )
                            }
                        >
                            Previous
                        </button>


                        <span className="pagination-info">
                            Page{" "}
                            {pagination.currentPage}{" "}
                            of{" "}
                            {pagination.lastPage}
                        </span>


                        <button
                            type="button"
                            className="secondary-button"
                            disabled={
                                pagination.currentPage ===
                                pagination.lastPage
                            }
                            onClick={() =>
                                goToPage(
                                    pagination.currentPage +
                                    1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
}