import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/1-Navbar";
import ProductCard from "../components/2-ProductCard";
import DonutChart from "../components/2-DonutChart";
import { demoRealReviews, demoFakeReviews, demoProductData } from "../data/mockReviews";
import "../styles/result.css";

// Expected backend response shape (POST /api/analyze):
// {
//   image:         string,
//   name:          string,
//   store:         string,
//   price:         number,
//   realReviews:   Array<{ text: string, sentiment: "positive"|"neutral"|"negative" }>,
//   fakeReviews:   Array<{ text: string, sentiment: "positive"|"neutral"|"negative" }>,
// }
//
// The frontend will COMPUTE these values from the arrays:
//   totalReviews  = realReviews.length + fakeReviews.length
//   realPercent   = Math.round(realReviews.length / totalReviews * 100)
//   fakePercent   = 100 - realPercent

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

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productUrl = searchParams.get("url");

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no URL provided, show demo data immediately
    if (!productUrl) {
      setResultData(
        normaliseData({
          ...demoProductData,
          realReviews: demoRealReviews,
          fakeReviews: demoFakeReviews,
        })
      );
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      setLoading(true);
      setError(null);

      try {
        // const res = await fetch(`http://localhost:8000/api/analyze`, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ url: productUrl }),
        // });
        // if (!res.ok) throw new Error("Failed to analyze product");
        // const data = await res.json();
        // setResultData(normaliseData(data));

        // ── Simulated delay with demo data (remove when backend is ready) ──
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setResultData(
          normaliseData({
            ...demoProductData,
            realReviews: demoRealReviews,
            fakeReviews: demoFakeReviews,
          })
        );
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [productUrl]);

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
            <p>{error}</p>
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