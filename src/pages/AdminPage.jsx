import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import refreshIcon from "../assets/refresh-icon.svg";
import MOCK_LOGS from "../data/mockLogs";
import "../styles/admin.css";

function formatLocalTime(utcString) {
    if (!utcString || utcString === "-") return "-";
    const d = new Date(utcString);
    if (isNaN(d.getTime())) return utcString;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getBadgeClass(status) {
    switch (status) {
        case "scraped":
            return "status-badge badge-scraped";
        case "analyzed":
            return "status-badge badge-analyzed";
        case "pending":
            return "status-badge badge-pending-sm";
        case "error":
            return "status-badge badge-error-sm";
        default:
            return "status-badge";
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateUrl(url, maxLen = 28) {
    if (url.length <= maxLen) return url;
    return url.slice(0, maxLen) + "...";
}

/**
 * Returns the snapped green (real) width percentage based on the 1:4 tier system.
 * 1-25% real  → green 25%
 * 26-50% real → green 50%
 * 51-75% real → green 75%
 * 76-100% real → green 100%
 */
function getRatioTier(realPercent) {
    if (realPercent == null) return null;
    if (realPercent <= 25) return 25;
    if (realPercent <= 50) return 50;
    if (realPercent <= 75) return 75;
    return 100;
}

const AdminPage = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);

    // Fetch logs from backend; fall back to mock data when API is unreachable
    const fetchLogs = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/admin/logs");
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            setLogs(data);   // real data replaces mock entirely
        } catch {
            // Backend not available – use mock data as fallback
            setLogs(MOCK_LOGS);
        }
    };

    // Load logs once user is authenticated
    useEffect(() => {
        if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
            navigate("/admin/login");
        } else {
            fetchLogs();
        }
    }, [navigate]);

    // Filter logs by search query AND status filter
    const filteredLogs = useMemo(() => {
        let result = logs;

        // Apply status filter
        if (statusFilter === "completed") {
            result = result.filter(
                (log) => log.scrapeStatus === "scraped" && log.analyzeStatus === "analyzed"
            );
        } else if (statusFilter === "pending") {
            result = result.filter(
                (log) => log.scrapeStatus === "pending" || log.analyzeStatus === "pending"
            );
        } else if (statusFilter === "errors") {
            result = result.filter(
                (log) => log.scrapeStatus === "error" || log.analyzeStatus === "error"
            );
        }

        // Apply search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (log) =>
                    log.productName.toLowerCase().includes(q) ||
                    log.productUrl.toLowerCase().includes(q)
            );
        }

        return result;
    }, [logs, searchQuery, statusFilter]);

    // Summary counts
    const summary = useMemo(() => {
        const total = logs.length;
        let completed = 0, pending = 0, errors = 0;
        logs.forEach((log) => {
            if (log.scrapeStatus === "scraped" && log.analyzeStatus === "analyzed") {
                completed++;
            }
            if (log.scrapeStatus === "pending" || log.analyzeStatus === "pending") {
                pending++;
            }
            if (log.scrapeStatus === "error" || log.analyzeStatus === "error") {
                errors++;
            }
        });
        return { total, completed, pending, errors };
    }, [logs]);



    const handleRefresh = async (log) => {
        const id = log.id;
        // Optimistically set to pending in the UI
        setLogs((prev) =>
            prev.map((l) =>
                l.id === id
                    ? {
                        ...l,
                        scrapeStatus: "pending",
                        analyzeStatus: "pending",
                        overallStatus: "pending",
                        realReviewPercent: null,
                        scrapeTime: new Date().toISOString(),
                        analyzeTime: "-",
                    }
                    : l
            )
        );

        try {
            // Try backend refresh endpoint
            await fetch(`http://localhost:8000/api/admin/refresh/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: log.productUrl }),
            });
            // Re-fetch updated logs from backend
            await fetchLogs();
        } catch {
            // Backend not available – keep the optimistic local update
            console.log(`Re-scraping and re-analyzing log #${id} for URL: ${log.productUrl} (mock)`);
        }
    };

    const handleViewLog = (log) => {
        // Only allow navigation for fully analyzed logs
        const isComplete =
            log.scrapeStatus === "scraped" && log.analyzeStatus === "analyzed";
        if (!isComplete) return;

        const totalReviews = (log.realReviews?.length || 0) + (log.fakeReviews?.length || 0);
        const realPercent = log.realReviewPercent ?? 0;
        const fakePercent = 100 - realPercent;

        navigate("/admin/log-result", {
            state: {
                productName: log.productName,
                productUrl: log.productUrl,
                totalReviews,
                realPercent,
                fakePercent,
                realReviews: log.realReviews || [],
                fakeReviews: log.fakeReviews || [],
            },
        });
    };

    const handleLogout = () => {
        sessionStorage.removeItem("isAdminLoggedIn");
        navigate("/admin/login");
    };

    // DASHBOARD VIEW
    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-card">
                <div className="admin-header">
                    <h1>Admin</h1>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                {/* Summary bar */}
                <div className="admin-summary">
                    <div
                        className={`summary-item summary-clickable${statusFilter === null || statusFilter === "total" ? " summary-active" : ""}`}
                        onClick={() => setStatusFilter((prev) => (prev === null || prev === "total" ? null : "total"))}
                    >
                        <span className="summary-count">{summary.total}</span>
                        <span className="summary-label">Total</span>
                    </div>
                    <div
                        className={`summary-item summary-completed summary-clickable${statusFilter === "completed" ? " summary-active" : ""}`}
                        onClick={() => setStatusFilter((prev) => (prev === "completed" ? null : "completed"))}
                    >
                        <span className="summary-count">{summary.completed}</span>
                        <span className="summary-label">Completed</span>
                    </div>
                    <div
                        className={`summary-item summary-pending summary-clickable${statusFilter === "pending" ? " summary-active" : ""}`}
                        onClick={() => setStatusFilter((prev) => (prev === "pending" ? null : "pending"))}
                    >
                        <span className="summary-count">{summary.pending}</span>
                        <span className="summary-label">Pending</span>
                    </div>
                    <div
                        className={`summary-item summary-errors summary-clickable${statusFilter === "errors" ? " summary-active" : ""}`}
                        onClick={() => setStatusFilter((prev) => (prev === "errors" ? null : "errors"))}
                    >
                        <span className="summary-count">{summary.errors}</span>
                        <span className="summary-label">Errors</span>
                    </div>
                </div>

                {/* Search bar */}
                <div className="admin-search">
                    <input
                        type="text"
                        placeholder="Search by product name or URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Scrollable table */}
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Result</th>
                                <th>Submitted At</th>
                                <th>Last Scraped</th>
                                <th>Last Analyzed</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-row">
                                        No logs found
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const isComplete =
                                        log.scrapeStatus === "scraped" && log.analyzeStatus === "analyzed";
                                    return (
                                        <tr
                                            key={log.id}
                                            className={isComplete ? "admin-row-clickable" : ""}
                                            onClick={() => handleViewLog(log)}
                                        >
                                            {/* Product */}
                                            <td>
                                                <div className="product-cell">
                                                    <span className="product-name">{log.productName}</span>
                                                    <a
                                                        className="product-url"
                                                        href={log.productUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {truncateUrl(log.productUrl)}
                                                    </a>
                                                </div>
                                            </td>

                                            {/* Ratio Bar */}
                                            <td>
                                                {(() => {
                                                    const hasIncomplete =
                                                        log.scrapeStatus === "pending" ||
                                                        log.scrapeStatus === "error" ||
                                                        log.analyzeStatus === "pending" ||
                                                        log.analyzeStatus === "error";
                                                    if (hasIncomplete) {
                                                        return <span className="ratio-na">—</span>;
                                                    }
                                                    const tier = getRatioTier(log.realReviewPercent);
                                                    if (tier === null) {
                                                        return <span className="ratio-na">N/A</span>;
                                                    }
                                                    return (
                                                        <div className="ratio-bar-wrapper">
                                                            <div className="ratio-bar">
                                                                <div
                                                                    className="ratio-bar-green"
                                                                    style={{ width: `${tier}%` }}
                                                                />
                                                                <div
                                                                    className="ratio-bar-red"
                                                                    style={{ width: `${100 - tier}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Submitted At */}
                                            <td>{formatLocalTime(log.submittedAt)}</td>

                                            {/* Last Scraped */}
                                            <td>
                                                <div className="status-cell">
                                                    <span className="status-time">{formatLocalTime(log.scrapeTime)}</span>
                                                    <span className={getBadgeClass(log.scrapeStatus)}>
                                                        {capitalize(log.scrapeStatus)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Last Analyzed */}
                                            <td>
                                                <div className="status-cell">
                                                    <span className="status-time">{formatLocalTime(log.analyzeTime)}</span>
                                                    <span className={getBadgeClass(log.analyzeStatus)}>
                                                        {capitalize(log.analyzeStatus)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Refresh */}
                                            <td>
                                                <button
                                                    className="refresh-btn"
                                                    title="Re-scrape and re-analyze"
                                                    onClick={(e) => { e.stopPropagation(); handleRefresh(log); }}
                                                >
                                                    <img src={refreshIcon} alt="Refresh" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
