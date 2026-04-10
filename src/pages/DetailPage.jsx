import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/1-Navbar";
import { demoRealReviews, demoFakeReviews } from "../data/mockReviews";
import backBtnSvg from "../assets/back-btn.svg";
import prevArrowSvg from "../assets/prev-arrow.svg";
import nextArrowSvg from "../assets/next-arrow.svg";
import "../styles/detail.css";

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

const DetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    const totalReviews = state.totalReviews ?? 0;
    const realPercent = state.realPercent ?? 0;
    const fakePercent = state.fakePercent ?? 0;
    const stateRealReviews = state.realReviews;
    const stateFakeReviews = state.fakeReviews;

    const productUrl = state.productUrl ?? "";
    const goBackToResult = () => {
        const path = productUrl ? `/result?url=${encodeURIComponent(productUrl)}` : "/result";
        navigate(path);
    };

    const [showReal, setShowReal] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSentiment, setSelectedSentiment] = useState(null);
    const [hoveredSentiment, setHoveredSentiment] = useState(null);

    const rawReviews = showReal
        ? (stateRealReviews && stateRealReviews.length > 0 ? stateRealReviews : demoRealReviews)
        : (stateFakeReviews && stateFakeReviews.length > 0 ? stateFakeReviews : demoFakeReviews);

    const reviews = rawReviews.filter(r => !selectedSentiment || r.sentiment === selectedSentiment);

    const sentiment = useMemo(() => computeSentiment(rawReviews), [rawReviews]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startIdx = (safePage - 1) * REVIEWS_PER_PAGE;
    const pageReviews = reviews.slice(startIdx, startIdx + REVIEWS_PER_PAGE);

    const handleToggle = () => {
        setShowReal((prev) => !prev);
        setCurrentPage(1);
        setSelectedSentiment(null); // Reset filter when toggling real/fake
    };

    const goToPage = (p) => {
        if (p >= 1 && p <= totalPages) setCurrentPage(p);
    };

    // Build visible page numbers (max 5)
    const pageNumbers = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pageNumbers.push(i);

    return (
        <>
            <Navbar />

            <section className="detail-page">
                <div className="detail-card">
                    {/* Header */}
                    <div className="detail-header">
                        <h1>Review Details</h1>
                        <p className="detail-total">
                            Total Reviews: <span>{totalReviews}</span>
                        </p>

                        {/* Back button */}
                        <img
                            className="detail-back-btn"
                            src={backBtnSvg}
                            alt="Go back"
                            onClick={goBackToResult}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && goBackToResult()}
                        />
                    </div>

                    {/* Toggle Real-Fake */}
                    <div className="detail-toggle-row">
                        <button
                            className={`toggle-pill ${showReal ? "toggle-real" : "toggle-fake"}`}
                            onClick={handleToggle}
                        >
                            <span className="toggle-label">
                                {showReal ? "Real" : "Fake"}
                            </span>
                            <span className="toggle-knob" />
                        </button>
                    </div>

                    {/* Sentiment Bar */}
                    <div className="sentiment-section">
                        <p className="sentiment-hint">Click to view sentiment analysis</p>

                        <div className="sentiment-bar">
                            <div
                                className={`sentiment-segment seg-positive ${(selectedSentiment || hoveredSentiment) &&
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
                                className={`sentiment-segment seg-neutral ${(selectedSentiment || hoveredSentiment) &&
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
                                className={`sentiment-segment seg-negative ${(selectedSentiment || hoveredSentiment) &&
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

                        <div className="sentiment-labels">
                            <div
                                className={`label-wrapper wrapper-positive ${(selectedSentiment || hoveredSentiment) &&
                                    selectedSentiment !== "positive" &&
                                    hoveredSentiment !== "positive"
                                    ? "faded"
                                    : ""
                                    }`}
                                style={{ width: `${sentiment.positive}%` }}
                            >
                                <span className="label-positive">Positive</span>
                            </div>
                            <div
                                className={`label-wrapper wrapper-neutral ${(selectedSentiment || hoveredSentiment) &&
                                    selectedSentiment !== "neutral" &&
                                    hoveredSentiment !== "neutral"
                                    ? "faded"
                                    : ""
                                    }`}
                                style={{ width: `${sentiment.neutral}%` }}
                            >
                                <span className="label-neutral">Neutral</span>
                            </div>
                            <div
                                className={`label-wrapper wrapper-negative ${(selectedSentiment || hoveredSentiment) &&
                                    selectedSentiment !== "negative" &&
                                    hoveredSentiment !== "negative"
                                    ? "faded"
                                    : ""
                                    }`}
                                style={{ width: `${sentiment.negative}%` }}
                            >
                                <span className="label-negative">Negative</span>
                            </div>
                        </div>
                    </div>

                    {/* Review List */}
                    <div className="review-list">
                        {pageReviews.map((rev, i) => (
                            <div className="review-item" key={startIdx + i}>
                                <p>{typeof rev === "string" ? rev : rev.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="detail-pagination">
                            <button
                                className="page-arrow"
                                onClick={() => goToPage(safePage - 1)}
                                disabled={safePage === 1}
                            >
                                <img src={prevArrowSvg} alt="Previous" />
                            </button>

                            {pageNumbers.map((n) => (
                                <button
                                    key={n}
                                    className={`page-num ${n === safePage ? "active" : ""}`}
                                    onClick={() => goToPage(n)}
                                >
                                    {n}
                                </button>
                            ))}

                            <button
                                className="page-arrow"
                                onClick={() => goToPage(safePage + 1)}
                                disabled={safePage === totalPages}
                            >
                                <img src={nextArrowSvg} alt="Next" />
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default DetailPage;
