import { useState, useMemo } from "react";
import refreshIcon from "../assets/refresh-icon.svg";
import MOCK_LOGS from "../data/mockLogs";
import "../styles/admin.css";

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

const AdminPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [logs, setLogs] = useState(MOCK_LOGS);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);

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

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === "admin" && password === "admin123") {
            setIsLoggedIn(true);
            setError("");
        } else {
            setError("Invalid username or password");
        }
    };

    const handleRefresh = (id) => {
        setLogs((prev) =>
            prev.map((log) =>
                log.id === id
                    ? {
                        ...log,
                        scrapeStatus: "pending",
                        analyzeStatus: "pending",
                        overallStatus: "pending",
                        scrapeTime: new Date().toISOString().slice(0, 16).replace("T", " "),
                        analyzeTime: "-",
                    }
                    : log
            )
        );
        console.log(`Re-scraping and re-analyzing log #${id}`);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUsername("");
        setPassword("");
    };

    // LOGIN VIEW
    if (!isLoggedIn) {
        return (
            <div className="admin-login-wrapper">
                <form className="admin-login-card" onSubmit={handleLogin}>
                    <h1>Login</h1>

                    <div className="input-group">
                        <label htmlFor="admin-username">Username</label>
                        <input
                            id="admin-username"
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="admin-password">Password</label>
                        <input
                            id="admin-password"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        Login
                    </button>

                    {error && <p className="login-error">{error}</p>}
                </form>
            </div>
        );
    }

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
                                <th>Submitted At</th>
                                <th>Last Scraped</th>
                                <th>Last Analyzed</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-row">
                                        No logs found
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id}>
                                        {/* Product */}
                                        <td>
                                            <div className="product-cell">
                                                <span className="product-name">{log.productName}</span>
                                                <a
                                                    className="product-url"
                                                    href={log.productUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {truncateUrl(log.productUrl)}
                                                </a>
                                            </div>
                                        </td>

                                        {/* Submitted At */}
                                        <td>{log.submittedAt}</td>

                                        {/* Last Scraped */}
                                        <td>
                                            <div className="status-cell">
                                                <span className="status-time">{log.scrapeTime}</span>
                                                <span className={getBadgeClass(log.scrapeStatus)}>
                                                    {capitalize(log.scrapeStatus)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Last Analyzed */}
                                        <td>
                                            <div className="status-cell">
                                                <span className="status-time">{log.analyzeTime}</span>
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
                                                onClick={() => handleRefresh(log.id)}
                                            >
                                                <img src={refreshIcon} alt="Refresh" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
