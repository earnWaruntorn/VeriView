const HowItWorks = () => {
  return (
    <section className="how-it-works">
      <h2>How It Works</h2>

      <div className="steps">
        <div className="step">
          <div className="circle">1</div>
          <h3>Paste Product URL</h3>
          <p>Copy and paste the product URL<br/>from online store</p>
        </div>

        <div className="step">
          <div className="circle">2</div>
          <h3>Automated Analysis</h3>
          <p>
            Our system scans and evaluates<br/>the authenticity of reviews
          </p>
        </div>

        <div className="step">
          <div className="circle">3</div>
          <h3>Explore result real-time</h3>
          <p>
            View clear, real-time insights<br/>showing whether the reviews<br/>are genuine or potentially fake.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;