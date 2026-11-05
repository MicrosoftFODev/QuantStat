import type {
  EquityAnalytics,
  SimulationResult,
} from './simulationTypes'


interface StrategyComparisonProps {
  random: SimulationResult
  randomAnalytics: EquityAnalytics

  dca: SimulationResult
  dcaAnalytics: EquityAnalytics

  rsi: SimulationResult
  rsiAnalytics: EquityAnalytics

  lumpSum: SimulationResult
  lumpSumAnalytics: EquityAnalytics

  rsiLabel: string
  rsiPeriod: number

  winnerName: string
  winnerDifference: number
}


interface StrategyCardProps {
  name: string
  subtitle: string
  result: SimulationResult
  analytics: EquityAnalytics
}


function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    },
  ).format(value)
}


function formatPercent(
  value: number,
): string {
  return `${value.toFixed(2)}%`
}


function StrategyCard({
  name,
  subtitle,
  result,
  analytics,
}: StrategyCardProps) {
  return (
    <article className="strategy-comparison-card">
      <div className="strategy-comparison-heading">
        <span>
          {name}
        </span>

        <strong>
          {subtitle}
        </strong>
      </div>

      <dl>
        <div>
          <dt>
            Final Wealth
          </dt>

          <dd>
            {formatCurrency(
              result.finalWealth,
            )}
          </dd>
        </div>

        <div>
          <dt>
            PnL
          </dt>

          <dd
            className={
              result.pnl >= 0
                ? 'positive-value'
                : 'negative-value'
            }
          >
            {formatCurrency(
              result.pnl,
            )}
          </dd>
        </div>

        <div>
          <dt>
            Return
          </dt>

          <dd
            className={
              result.returnPercent >= 0
                ? 'positive-value'
                : 'negative-value'
            }
          >
            {formatPercent(
              result.returnPercent,
            )}
          </dd>
        </div>

        <div>
          <dt>
            Max Drawdown
          </dt>

          <dd className="negative-value">
            {formatPercent(
              analytics.maxDrawdownPercent,
            )}
          </dd>
        </div>

        <div>
          <dt>
            Capital Deployed
          </dt>

          <dd>
            {formatPercent(
              analytics.capitalUtilizationPercent,
            )}
          </dd>
        </div>
      </dl>
    </article>
  )
}


function StrategyComparison({
  random,
  randomAnalytics,
  dca,
  dcaAnalytics,
  rsi,
  rsiAnalytics,
  lumpSum,
  lumpSumAnalytics,
  rsiLabel,
  rsiPeriod,
  winnerName,
  winnerDifference,
}: StrategyComparisonProps) {
  return (
    <section className="chart-card">
      <div className="card-heading">
        <div>
          <h2>
            Strategy benchmark comparison
          </h2>

          <p>
            Same starting capital and terminal valuation date across strategies.
          </p>
        </div>
      </div>

      <div className="strategy-comparison-grid">
        <StrategyCard
          name="Random Timing"
          subtitle={`Seed ${random.seed}`}
          result={random}
          analytics={randomAnalytics}
        />

        <StrategyCard
          name="Regular DCA"
          subtitle="Even spacing"
          result={dca}
          analytics={dcaAnalytics}
        />

        <StrategyCard
          name={rsiLabel}
          subtitle={`Period ${rsiPeriod}`}
          result={rsi}
          analytics={rsiAnalytics}
        />

        <StrategyCard
          name="Lump Sum / Buy & Hold"
          subtitle="Full initial investment"
          result={lumpSum}
          analytics={lumpSumAnalytics}
        />

        <article className="strategy-winner-card">
          <span>
            Best historical result
          </span>

          <strong>
            {winnerName}
          </strong>

          <small>
            Advantage over second place
          </small>

          <b>
            {formatCurrency(
              winnerDifference,
            )}
          </b>
        </article>
      </div>
    </section>
  )
}


export default StrategyComparison
