function AboutQuantStat() {
  return (
    <section
      id="about"
      className="about-quantstat"
    >
      <div className="about-heading">
        <span>
          ABOUT QUANTSTAT
        </span>

        <h2>
          Research, technology
          <br />
          and quantitative thinking.
        </h2>
      </div>

      <div className="about-grid">
        <article className="about-card about-person">
          <div className="about-number">
            01 / ABOUT ME
          </div>

          <h3>
            Zois Antonopoulos
          </h3>

          <div className="about-credentials">
            <div>
              <strong>
                Statistics &amp; Insurance Science Graduate
              </strong>

              <span>
                University of Piraeus
              </span>
            </div>

            <div>
              <strong>
                MSc in FinTech
              </strong>

              <span>
                National and Kapodistrian University of Athens (EKPA)
              </span>
            </div>

            <div>
              <strong>
                Microsoft Dynamics 365 Finance &amp; Operations
              </strong>

              <span>
                X++ Developer
              </span>
            </div>
          </div>

          <p>
            QuantStat brings together my academic background
            in statistics, my postgraduate studies in financial
            technology, and my professional experience in
            software development.
          </p>

          <p>
            I built the project as a quantitative research
            environment for exploring financial markets through
            statistical analysis, market diagnostics, strategy
            simulation, Monte Carlo experimentation, and
            reproducible quantitative methods.
          </p>

          <p>
            The goal is not simply to display market prices,
            but to connect <strong>data, statistical reasoning,
            financial modelling, and software engineering</strong>
            in a transparent environment where results can be
            explored, compared, and understood.
          </p>
        </article>

        <article className="about-card">
          <div className="about-number">
            02 / TECHNOLOGY
          </div>

          <h3>
            Built as a quantitative platform.
          </h3>

          <p>
            QuantStat combines a React and TypeScript interface
            with a C#/.NET API and Alpaca market data for stocks
            and cryptocurrencies.
          </p>

          <p>
            The platform integrates Microsoft and Google
            authentication, interactive visualizations,
            statistical analysis, historical strategy simulation,
            and reproducible Monte Carlo experiments.
          </p>

          <div className="about-tech-list">
            <span>React</span>
            <span>TypeScript</span>
            <span>C# / .NET</span>
            <span>Alpaca</span>
            <span>Quantitative Analytics</span>
          </div>
        </article>

        <article className="about-card">
          <div className="about-number">
            03 / PURPOSE
          </div>

          <h3>
            From market data to statistical insight.
          </h3>

          <p>
            QuantStat is designed as a research and educational
            environment for quantitative finance.
          </p>

          <p>
            Its purpose is to connect market observations with
            statistics, distributions, momentum analysis,
            risk measures, strategy comparison, simulation,
            and financial modelling.
          </p>

          <blockquote>
            Not predictions without context.
            <strong>
              Evidence with uncertainty.
            </strong>
          </blockquote>
        </article>
      </div>
    </section>
  )
}


export default AboutQuantStat