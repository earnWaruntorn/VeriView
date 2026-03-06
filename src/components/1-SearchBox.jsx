import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Searchbox = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = () => {
    if (!url) {
      alert("Please enter a product URL");
      return;
    }
    console.log("Analyze URL:", url);
    navigate(`/result?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Paste Product URL here"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={handleAnalyze}>Analyze</button>
    </div>
  );
};

export default Searchbox;