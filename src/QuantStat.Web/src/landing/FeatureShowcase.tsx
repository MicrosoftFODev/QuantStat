import DictionaryVisual from './DictionaryVisual'
import ForecastVisual from './ForecastVisual'
import MonteCarloVisual from './MonteCarloVisual'
import StatisticsVisual from './StatisticsVisual'
import MarketVisual from './MarketVisual'
import RsiVisual from './RsiVisual'

function FeatureShowcase() {
  return (
    <section className="feature-showcase">
      <div className="feature-showcase-heading">
        <span className="landing-eyebrow">
          INSIDE QUANTSTAT
        </span>

        <h2>
          One environment.
          <br />
          Multiple perspectives.
        </h2>

        <p>
          Move from market exploration to statistical
          analysis and reproducible experimentation
          without leaving the research workspace.
        </p>
      </div>

      <div className="quantstat-workflow">
        <div className="workflow-step">
          <span>01</span>
          <strong>EXPLORE</strong>
          <small>Markets</small>
        </div>

        <i />

        <div className="workflow-step">
          <span>02</span>
          <strong>ANALYZE</strong>
          <small>Statistics</small>
        </div>

        <i />

        <div className="workflow-step">
          <span>03</span>
          <strong>TEST</strong>
          <small>Simulation</small>
        </div>

        <i />

        <div className="workflow-step">
          <span>04</span>
          <strong>INTERPRET</strong>
          <small>Insight</small>
        </div>
      </div>

      <div className="feature-grid">
        <article className="feature-card feature-markets">
          <div className="feature-card-number">
            01 / MARKETS
          </div>

          <h3>
            Explore the market.
          </h3>

          <p>
            Investigate stocks and cryptocurrencies
            across configurable intervals and
            historical periods.
          </p>

          <MarketVisual />

        </article>

        <article className="feature-card feature-statistics">
          <div className="feature-card-number">
            02 / STATISTICS
          </div>

          <h3>
            Understand the distribution.
          </h3>

          <p>
            Move beyond a single return number with
            descriptive statistics, distributions
            and quantitative diagnostics.
          </p>

          <StatisticsVisual />
        </article>

        <article className="feature-card feature-rsi">
          <div className="feature-card-number">
            03 / MOMENTUM
          </div>

          <h3>
            Measure momentum.
          </h3>

          <p>
            Compare Wilder, Cutler and Exponential
            RSI while connecting indicator values
            directly to market observations.
          </p>

          <RsiVisual />

        </article>

        <article className="feature-card feature-simulation">
          <div className="feature-card-number">
            04 / SIMULATION
          </div>

          <h3>
            Test the idea, not the story.
          </h3>

          <p>
            Compare historical investment strategies
            across randomly selected market windows
            with reproducible Monte Carlo experiments.
          </p>

          <MonteCarloVisual />

        </article>

        <article className="feature-card feature-dictionary">
          <div className="feature-card-number">
            05 / DICTIONARY
          </div>

          <h3>
            Learn the mathematics.
          </h3>

          <p>
            Connect quantitative results to readable
            explanations of the statistical concepts
            and formulas behind them.
          </p>

          <DictionaryVisual />

        </article>

        <article className="feature-card feature-forecast">
          <div className="feature-card-number">
            06 / FORECAST
          </div>

          <div className="feature-coming-next">
            NEXT
          </div>

          <h3>
            Model what comes next.
          </h3>

          <p>
            The final major layer of QuantStat will
            extend the research workflow from
            historical analysis toward forecasting,
            diagnostics and uncertainty.
          </p>

          <ForecastVisual />

        </article>
      </div>

      <div className="research-principle">
        <span>
          QUANTSTAT RESEARCH PRINCIPLE
        </span>

        <h2>
          Not predictions without context.
          <br />
          <strong>
            Evidence with uncertainty.
          </strong>
        </h2>

        <p>
          QuantStat is designed around transparent
          market exploration, statistical reasoning
          and experiments that can be repeated and
          examined.
        </p>
      </div>
    </section>
  )
}


export default FeatureShowcase
