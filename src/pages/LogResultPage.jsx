import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { demoRealReviews, demoFakeReviews } from "../data/mockReviews";
import prevArrowSvg from "../assets/prev-arrow.svg";
import nextArrowSvg from "../assets/next-arrow.svg";
import "../styles/logresult.css";

const computeSentiment = (reviews) => {
    if (!reviews || reviews.length === 0) return { positive: 0, neutral: 0, negative: 0 };

    const counts = { positive: 0, neutral: 0, negative: 0 };
    reviews.forEach((r) => {
        const s = (typeof r === "object" ? r.sentiment : null) || "neutral";
        if (counts[s] !== undefined) counts[s]++;
    });

    const total = reviews.length;
    const positive = Math.round((counts.positive / total) * 100);
    const negative = Math.round((counts.negative / total) * 100);
    const neutral = 100 - positive - negative;

    return { positive, neutral, negative };
};

const REVIEWS_PER_PAGE = 10;

const LogResultPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    useEffect(() => {
        if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
            navigate("/admin/login");
        }
    }, [navigate]);

    const totalReviews = state.totalReviews ?? 0;
    const realPercent = state.realPercent ?? 0;
    const fakePercent = state.fakePercent ?? 0;
    const productName = state.productName ?? "Unknown Product";
    const productUrl = state.productUrl ?? "";
    const stateRealReviews = state.realReviews;
    const stateFakeReviews = state.fakeReviews;

    const goBack = () => {
        navigate("/admin");
    };

    // viewMode: null = all reviews (default), "real" = real only, "fake" = fake only
    const [viewMode, setViewMode] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSentiment, setSelectedSentiment] = useState(null);
    const [hoveredSentiment, setHoveredSentiment] = useState(null);

    const handleViewModeToggle = (mode) => {
        if (viewMode === mode) {
            // Clicking the active filter again → back to default
            setViewMode(null);
        } else {
            setViewMode(mode);
        }
        setCurrentPage(1);
        setSelectedSentiment(null);
    };

    // Resolve review arrays (use state data if available, fallback to mock)
    const realReviews = stateRealReviews && stateRealReviews.length > 0
        ? stateRealReviews
        : demoRealReviews;
    const fakeReviews = stateFakeReviews && stateFakeReviews.length > 0
        ? stateFakeReviews
        : demoFakeReviews;

    // Build the displayed reviews based on viewMode
    const rawReviews = useMemo(() => {
        if (viewMode === "real") return realReviews;
        if (viewMode === "fake") return fakeReviews;
        // Default: combine both real and fake
        return [...realReviews, ...fakeReviews];
    }, [viewMode, realReviews, fakeReviews]);

    const reviews = rawReviews.filter(r => !selectedSentiment || r.sentiment === selectedSentiment);

    const sentiment = useMemo(() => computeSentiment(rawReviews), [rawReviews]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startIdx = (safePage - 1) * REVIEWS_PER_PAGE;
    const pageReviews = reviews.slice(startIdx, startIdx + REVIEWS_PER_PAGE);

    const goToPage = (p) => {
        if (p >= 1 && p <= totalPages) setCurrentPage(p);
    };

    // Build visible page numbers (max 5)
    const pageNumbers = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pageNumbers.push(i);

    return (
        <section className="logresult-page">
            <div className="logresult-card">
                {/* Header */}
                <div className="logresult-header">
                    <h1>Review Analysis</h1>
                    <p className="logresult-product-name">
                        Product: <span>{productName}</span>
                    </p>
                    <p className="logresult-total">
                        Total Reviews: <span>{totalReviews}</span>
                    </p>

                    {/* Back button */}
                    <button
                        className="logresult-back-btn"
                        onClick={goBack}
                    >
                        Back
                    </button>
                </div>

                {/* Info banner — clickable Real/Fake filters */}
                <div className="logresult-info-banner">
                    <div className="logresult-info-item">
                        <span className="info-label">Product URL</span>
                        <span className="info-value">
                            {productUrl ? (
                                <a href={productUrl} target="_blank" rel="noopener noreferrer">
                                    {productUrl.length > 50 ? productUrl.slice(0, 50) + "..." : productUrl}
                                </a>
                            ) : "N/A"}
                        </span>
                    </div>
                    <div className="logresult-info-divider" />
                    <div
                        className={`logresult-info-item logresult-info-clickable ${viewMode === "real" ? "logresult-filter-real-active" : ""}`}
                        onClick={() => handleViewModeToggle("real")}
                    >
                        <span className="info-label">Real Reviews</span>
                        <span className="info-value">{realPercent}%</span>
                    </div>
                    <div className="logresult-info-divider" />
                    <div
                        className={`logresult-info-item logresult-info-clickable ${viewMode === "fake" ? "logresult-filter-fake-active" : ""}`}
                        onClick={() => handleViewModeToggle("fake")}
                    >
                        <span className="info-label">Fake Reviews</span>
                        <span className="info-value">{fakePercent}%</span>
                    </div>
                </div>

                {/* Active filter indicator */}
                {viewMode && (
                    <div className={`logresult-filter-badge ${viewMode === "real" ? "badge-real" : "badge-fake"}`}>
                        Showing {viewMode === "real" ? "Real" : "Fake"} Reviews
                        <span className="logresult-filter-badge-count">({rawReviews.length})</span>
                        <button
                            className="logresult-filter-badge-clear"
                            onClick={() => { setViewMode(null); setCurrentPage(1); setSelectedSentiment(null); }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Sentiment Bar */}
                <div className="logresult-sentiment-section">
                    <p className="logresult-sentiment-hint">Click to filter by sentiment</p>

                    <div className="logresult-sentiment-bar">
                        <div
                            className={`logresult-sentiment-segment logresult-seg-positive ${(selectedSentiment || hoveredSentiment) &&
                                selectedSentiment !== "positive" &&
                                hoveredSentiment !== "positive"
                                ? "faded"
                                : ""
                                }`}
                            style={{ width: `${sentiment.positive}%` }}
                            onMouseEnter={() => setHoveredSentiment("positive")}
                            onMouseLeave={() => setHoveredSentiment(null)}
                            onClick={() => setSelectedSentiment(selectedSentiment === "positive" ? null : "positive")}
                        >
                            {sentiment.positive}%
                        </div>
                        <div
                            className={`logresult-sentiment-segment logresult-seg-neutral ${(selectedSentiment || hoveredSentiment) &&
                                selectedSentiment !== "neutral" &&
                                hoveredSentiment !== "neutral"
                                ? "faded"
                                : ""
                                }`}
                            style={{ width: `${sentiment.neutral}%` }}
                            onMouseEnter={() => setHoveredSentiment("neutral")}
                            onMouseLeave={() => setHoveredSentiment(null)}
                            onClick={() => setSelectedSentiment(selectedSentiment === "neutral" ? null : "neutral")}
                        >
                            {sentiment.neutral}%
                        </div>
                        <div
                            className={`logresult-sentiment-segment logresult-seg-negative ${(selectedSentiment || hoveredSentiment) &&
                                selectedSentiment !== "negative" &&
                                hoveredSentiment !== "negative"
                                ? "faded"
                                : ""
                                }`}
                            style={{ width: `${sentiment.negative}%` }}
                            onMouseEnter={() => setHoveredSentiment("negative")}
                            onMouseLeave={() => setHoveredSentiment(null)}
                            onClick={() => setSelectedSentiment(selectedSentiment === "negative" ? null : "negative")}
                        >
                            {sentiment.negative}%
                        </div>
                    </div>

                    <div className="logresult-sentiment-labels">
                        <div
                            className={`logresult-label-wrapper logresult-wrapper-positive ${(selectedSentiment || hoveredSentiment) &&
                                selectedSentiment !== "positive" &&
                                hoveredSentiment !== "positive"
                                ? "faded"
                                : ""
                                }`}
                            style={{ width: `${sentiment.positive}%` }}
                        >
                            <span className="logresult-label-positive">Positive</span>
                        </div>
                        <div
                            className={`logresult-label-wrapper logresult-wrapper-neutral ${(selectedSentiment || hoveredSentiment) &&
                                selectedSentiment !== "neutral" &&
                                hoveredSentiment !== "neutral"
                                ? "faded"
                                : ""
                                }`}
                            style={{ width: `${sentiment.neutral}%` }}
                        >
                            <span className="logresult-label-neutral">Neutral</span>
                        </div>
                        <div
                            className={`logresult-label-wrapper logresult-wrapper-negative ${(selectedSentiment || hoveredSentiment) &&
                                selectedSentiment !== "negative" &&
                                hoveredSentiment !== "negative"
                                ? "faded"
                                : ""
                                }`}
                            style={{ width: `${sentiment.negative}%` }}
                        >
                            <span className="logresult-label-negative">Negative</span>
                        </div>
                    </div>
                </div>

                {/* Review List */}
                <div className="logresult-review-list">
                    {pageReviews.map((rev, i) => (
                        <div className="logresult-review-item" key={startIdx + i}>
                            <p>{typeof rev === "string" ? rev : rev.text}</p>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="logresult-pagination">
                        <button
                            className="logresult-page-arrow"
                            onClick={() => goToPage(safePage - 1)}
                            disabled={safePage === 1}
                        >
                            <img src={prevArrowSvg} alt="Previous" />
                        </button>

                        {pageNumbers.map((n) => (
                            <button
                                key={n}
                                className={`logresult-page-num ${n === safePage ? "active" : ""}`}
                                onClick={() => goToPage(n)}
                            >
                                {n}
                            </button>
                        ))}

                        <button
                            className="logresult-page-arrow"
                            onClick={() => goToPage(safePage + 1)}
                            disabled={safePage === totalPages}
                        >
                            <img src={nextArrowSvg} alt="Next" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default LogResultPage;
