import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/1-Navbar";
import SearchBox from "../components/1-SearchBox";
import HowItWorks from "../components/1-HowItWorks";
import OurSystem from "../components/1-OurSystem";

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToSearch) {
      document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  return (
    <>
      <Navbar />

      <main id="search-section" className="core">
        <h1>
          Fake Review Detection on <br /> Online Shopping Platforms
        </h1>
        <p>Enter the product URL to analyze its reviews</p>
        <SearchBox />
      </main>

      <HowItWorks />

      <OurSystem />
    </>
  );
};

export default Home;