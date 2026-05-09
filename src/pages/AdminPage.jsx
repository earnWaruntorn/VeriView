import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminLogs, reAnalyze, getReviews } from "../services/api";
import refreshIcon from "../assets/refresh-icon.svg";
import "../styles/admin.css";

function formatLocalTime(utcString) {
    if (!utcString || utcString === "-") return "-";
    // Ensure the string is treated as UTC if it doesn't have a timezone identifier
    const timeStr = utcString.endsWith("Z") ? utcString : `${utcString}Z`;
    const d = new Date(timeStr);
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
    if (!str) return "-";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateProductName(name, maxLen = 35) {
    if (!name) return "Unknown Product";
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen) + "...";
}

function truncateUrl(url, maxLen = 28) {
    if (!url) return "";
    if (url.length <= maxLen) return url;
    return url.slice(0, maxLen) + "...";
}

/**
 * Derive sentiment from the star rating.
 * 4-5 stars → positive, 3 stars → neutral, 1-2 stars → negative.
 */
const ratingToSentiment = (rating) => {
    if (rating >= 4) return "positive";
    if (rating === 3) return "neutral";
    return "negative";
};

/**
 * Map a backend product to the shape the admin UI expects.
 * Backend fields: product_id, product_name, product_code, store, price,
 *                 status, created_at, last_scraped_products, last_predicted,
 *                 last_scraped_reviews
 */
function mapProductToLog(p) {
    const productUrl = `https://www.lazada.co.th/products/${p.product_code}.html`;

    // Derive scrape/analyze statuses from timestamps
    let scrapeStatus = "pending";
    if (p.status === "error") scrapeStatus = "error";
    else if (p.last_scraped_products || p.last_scraped_reviews) scrapeStatus = "scraped";

    let analyzeStatus = "pending";
    if (p.status === "error") analyzeStatus = "error";
    else if (p.last_predicted) analyzeStatus = "analyzed";

    return {
        id: p.product_id,
        productName: truncateProductName(p.product_name),
        productUrl,
        submittedAt: p.created_at,
        scrapeTime: p.last_scraped_products || p.last_scraped_reviews || "-",
        scrapeStatus,
        analyzeTime: p.last_predicted || "-",
        analyzeStatus,
        realReviewPercent: null, // Will be computed when viewing details
        realReviews: [],
        fakeReviews: [],
    };
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
    const [sortBy, setSortBy] = useState("submittedAt");

    const token = sessionStorage.getItem("adminToken");

    // Fetch logs from backend
    const fetchLogs = async () => {
        try {
            const data = await getAdminLogs(token);
            const products = data.products || [];
            const mapped = products.map(mapProductToLog);

            // For completed products, fetch reviews to compute real/fake ratio
            const enriched = await Promise.all(
                mapped.map(async (log) => {
                    if (log.analyzeStatus !== "analyzed") return log;

                    try {
                        const reviewRes = await getReviews(log.id);
                        const allReviews = (reviewRes.data ?? []).filter(
                            (r) => r.review && r.review.trim() !== ""
                        );
                        const realCount = allReviews.filter(
                            (r) => r.predicted_label === "real"
                        ).length;
                        const total = allReviews.length;
                        const realPercent = total > 0
                            ? Math.round((realCount / total) * 100)
                            : null;

                        return { ...log, realReviewPercent: realPercent };
                    } catch {
                        return log;
                    }
                })
            );

            setLogs(enriched);
        } catch (err) {
            console.error("Failed to fetch admin logs:", err);
            setLogs([]);
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

    // Filter and sort logs
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

        // Sort (most recent first)
        result = [...result].sort((a, b) => {
            const key = sortBy === "analyzeTime" ? "analyzeTime" : "submittedAt";
            const timeA = a[key] && a[key] !== "-" ? new Date(a[key]).getTime() : 0;
            const timeB = b[key] && b[key] !== "-" ? new Date(b[key]).getTime() : 0;
            return timeB - timeA;
        });

        return result;
    }, [logs, searchQuery, statusFilter, sortBy]);

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
                        realReviewPercent: null,
                        scrapeTime: new Date().toISOString(),
                        analyzeTime: "-",
                    }
                    : l
            )
        );

        try {
            await reAnalyze(id, token);
            // Re-fetch updated logs from backend
            await fetchLogs();
        } catch (err) {
            console.error(`Failed to re-analyze product #${id}:`, err);
            // Re-fetch to restore actual state
            await fetchLogs();
        }
    };

    const handleViewLog = async (log) => {
        // Only allow navigation for fully analyzed logs
        const isComplete =
            log.scrapeStatus === "scraped" && log.analyzeStatus === "analyzed";
        if (!isComplete) return;

        try {
            // Fetch real reviews from backend
            const reviewRes = await getReviews(log.id);
            const allReviews = (reviewRes.data ?? []).filter(
                (r) => r.review && r.review.trim() !== ""
            );

            const realReviews = allReviews
                .filter((r) => r.predicted_label === "real")
                .map((r) => ({
                    text: r.review ?? "",
                    sentiment: ratingToSentiment(r.rating),
                    rating: r.rating,
                    confidence_score: r.confidence_score,
                }));
            const fakeReviews = allReviews
                .filter((r) => r.predicted_label === "fake")
                .map((r) => ({
                    text: r.review ?? "",
                    sentiment: ratingToSentiment(r.rating),
                    rating: r.rating,
                    confidence_score: r.confidence_score,
                }));

            const totalReviews = realReviews.length + fakeReviews.length;
            const realPercent = totalReviews > 0
                ? Math.round((realReviews.length / totalReviews) * 100)
                : 0;
            const fakePercent = totalReviews > 0 ? 100 - realPercent : 0;

            navigate("/admin/log-result", {
                state: {
                    productName: log.productName,
                    productUrl: log.productUrl,
                    totalReviews,
                    realPercent,
                    fakePercent,
                    realReviews,
                    fakeReviews,
                },
            });
        } catch (err) {
            console.error("Failed to fetch reviews for log:", err);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("isAdminLoggedIn");
        sessionStorage.removeItem("adminToken");
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

                {/* Search bar + sort */}
                <div className="admin-search">
                    <input
                        type="text"
                        placeholder="Search by product name or URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="submittedAt">Sort by: Submitted At</option>
                        <option value="analyzeTime">Sort by: Last Analyzed</option>
                    </select>
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
