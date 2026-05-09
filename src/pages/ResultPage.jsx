import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/1-Navbar";
import ProductCard from "../components/2-ProductCard";
import DonutChart from "../components/2-DonutChart";
import { postProduct, getProduct, getReviews } from "../services/api";
import { demoRealReviews, demoFakeReviews, demoProductData } from "../data/mockReviews";
import "../styles/result.css";

/**
 * Take raw data (from backend or demo) and compute derived fields
 * so the donut chart always reflects the real scale of the review arrays.
 */
const normaliseData = (raw) => {
  const realReviews = raw.realReviews ?? [];
  const fakeReviews = raw.fakeReviews ?? [];
  const totalReviews = realReviews.length + fakeReviews.length;
  const realPercent = totalReviews > 0 ? Math.round((realReviews.length / totalReviews) * 100) : 0;
  const fakePercent = totalReviews > 0 ? 100 - realPercent : 0;

  return {
    image: raw.image ?? demoProductData.image,
    name: raw.name ?? "Unknown Product",
    store: raw.store ?? "Unknown Store",
    price: raw.price ?? 0,
    totalReviews,
    realPercent,
    fakePercent,
    realReviews,
    fakeReviews,
    realSentiment: raw.realSentiment ?? null,
    fakeSentiment: raw.fakeSentiment ?? null,
  };
};

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
 * Map a backend review object to the shape the UI components expect.
 * Backend: { review, rating, predicted_label, confidence_score, ... }
 * Frontend: { text, sentiment, rating, confidence_score }
 */
const mapReview = (r) => ({
  text: r.review ?? "",
  sentiment: ratingToSentiment(r.rating),
  rating: r.rating,
  confidence_score: r.confidence_score,
});

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productUrl = searchParams.get("url");

  const fetchResult = async () => {
    if (!productUrl) {
      return normaliseData({
        ...demoProductData,
        realReviews: demoRealReviews,
        fakeReviews: demoFakeReviews,
      });
    }

    // 1. Register the product URL and get its product_id
    const { product_id } = await postProduct(productUrl);

    // 2. Fetch product details (name, store, price, image, etc.)
    const productInfo = await getProduct(product_id);

    // 3. Fetch reviews with predictions
    const reviewRes = await getReviews(product_id);
    const allReviews = (reviewRes.data ?? []).filter(
      (r) => r.review && r.review.trim() !== ""
    );

    // 4. Split reviews into real vs fake based on predicted_label
    const realReviews = allReviews
      .filter((r) => r.predicted_label === "real")
      .map(mapReview);
    const fakeReviews = allReviews
      .filter((r) => r.predicted_label === "fake")
      .map(mapReview);

    return normaliseData({
      image: productInfo.image ?? demoProductData.image,
      name: productInfo.product_name,
      store: productInfo.store,
      price: productInfo.price,
      realReviews,
      fakeReviews,
    });
  };

  const { data: resultData, isLoading: loading, error } = useQuery({
    queryKey: ["productAnalysis", productUrl],
    queryFn: fetchResult,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <section className="result-page">
          <div className="result-status">
            <div className="spinner" />
            <p>Analyzing reviews…</p>
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <section className="result-page">
          <div className="result-status">
            <h2>Oops!</h2>
            <p>{error.message}</p>
            <button className="retry-btn" onClick={() => navigate("/")}>
              Try Again
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="result-page">
        {/* Header */}
        <div className="result-header">
          <h1>Result Summary</h1>
          <p>Click on the chart to explore more detailed reviews insights.</p>
        </div>

        {/* Card */}
        <div className="result-card">
          {/* Left: Product info */}
          <ProductCard data={resultData} />

          {/* Right: Donut chart */}
          <DonutChart data={resultData} />
        </div>
      </section>
    </>
  );
};

export default ResultPage;