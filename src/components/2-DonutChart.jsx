import { useNavigate } from "react-router-dom";

const DonutChart = ({ data }) => {
  const navigate = useNavigate();
  const radius = 100;
  const strokeWidth = 28;
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const realPct = data?.realPercent ?? 0;
  const fakePct = data?.fakePercent ?? 0;
  const total = data?.totalReviews ?? 0;
  const realStroke = (realPct / 100) * circumference;
  const fakeStroke = (fakePct / 100) * circumference;

  const handleClick = () => {
    navigate("/detail", {
      state: {
        realPercent: realPct,
        fakePercent: fakePct,
        totalReviews: total,
        realReviews: data?.realReviews ?? [],
        fakeReviews: data?.fakeReviews ?? [],
        realSentiment: data?.realSentiment ?? null,
        fakeSentiment: data?.fakeSentiment ?? null,
      },
    });
  };

  return (
    <div
      className="chart-wrapper chart-clickable"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title="Click to view review details"
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Real reviews (green) */}
        <circle
          className="donut-arc"
          cx={center}
          cy={center}
          r={radius}
          stroke="#2EDF94"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${realStroke} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Fake reviews (red) */}
        <circle
          className="donut-arc"
          cx={center}
          cy={center}
          r={radius}
          stroke="#c0504d"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${fakeStroke} ${circumference}`}
          strokeDashoffset={-realStroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div className="chart-center">
        <h2>{realPct}%</h2>
        <span>True</span>
      </div>

      <p className="total-review">
        Total Reviews: <span>{total.toLocaleString()}</span>
      </p>
      {/* <div className="chart-hover-hint">Click to explore details</div> */}
    </div>
  );
};

export default DonutChart;