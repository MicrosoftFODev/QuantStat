import type {
  MonteCarloStrategySummary,
} from './simulationTypes'


interface TerminalWealthDistributionProps {
  summaries:
    MonteCarloStrategySummary[]

  runCount: number
}


const strategyColors:
  Record<string, string> = {
    random: '#6c8cff',
    dca: '#22c55e',
    rsi: '#a78bfa',
    lumpSum: '#f59e0b',
  }


function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    },
  ).format(value)
}


function TerminalWealthDistribution({
  summaries,
  runCount,
}: TerminalWealthDistributionProps) {
  if (summaries.length === 0) {
    return null
  }

  const ordered =
    [...summaries].sort(
      (
        left,
        right,
      ) =>
        right.finalWealth.median -
        left.finalWealth.median,
    )

  const minimum =
    Math.min(
      ...ordered.map(
        summary =>
          summary.finalWealth
            .percentile05,
      ),
    )

  const maximum =
    Math.max(
      ...ordered.map(
        summary =>
          summary.finalWealth
            .percentile95,
      ),
    )

  const range =
    Math.max(
      maximum - minimum,
      1,
    )

  const position =
    (
      value: number,
    ): number =>
      (
        value - minimum
      ) /
      range *
      100

  return (
    <section className="chart-card terminal-wealth-card">
      <div className="card-heading">
        <div>
          <span className="simulation-eyebrow">
            Aggregate Monte Carlo results
          </span>

          <h2>
            Terminal wealth percentiles
          </h2>

          <p>
            Distribution of final portfolio wealth
            across{' '}
            {runCount.toLocaleString()}
            {' '}
            completed historical simulations.
          </p>
        </div>
      </div>

      <div className="terminal-wealth-legend">
        <span>
          P05
        </span>

        <span>
          P25
        </span>

        <strong>
          Median
        </strong>

        <span>
          P75
        </span>

        <span>
          P95
        </span>
      </div>

      <div className="terminal-wealth-scale">
        <span>
          {formatCurrency(
            minimum,
          )}
        </span>

        <span>
          Terminal wealth
        </span>

        <span>
          {formatCurrency(
            maximum,
          )}
        </span>
      </div>

      <div className="terminal-wealth-rows">
        {ordered.map(
          summary => {
            const p05 =
              position(
                summary.finalWealth
                  .percentile05,
              )

            const p25 =
              position(
                summary.finalWealth
                  .percentile25,
              )

            const median =
              position(
                summary.finalWealth
                  .median,
              )

            const p75 =
              position(
                summary.finalWealth
                  .percentile75,
              )

            const p95 =
              position(
                summary.finalWealth
                  .percentile95,
              )

            const color =
              strategyColors[
                summary.strategyId
              ] ??
              '#94a3b8'

            return (
              <article
                key={
                  summary.strategyId
                }
                className="terminal-wealth-row"
              >
                <div className="terminal-wealth-name">
                  <span
                    className="strategy-dot"
                    style={{
                      backgroundColor:
                        color,
                    }}
                  />

                  <div>
                    <strong>
                      {
                        summary.strategyName
                      }
                    </strong>

                    <small>
                      Median{' '}
                      {
                        formatCurrency(
                          summary
                            .finalWealth
                            .median,
                        )
                      }
                    </small>
                  </div>
                </div>

                <div className="terminal-wealth-range">
                  <div
                    className="terminal-range-p05-p95"
                    style={{
                      left:
                        `${p05}%`,
                      width:
                        `${Math.max(
                          p95 - p05,
                          0.5,
                        )}%`,
                    }}
                  />

                  <div
                    className="terminal-range-p25-p75"
                    style={{
                      left:
                        `${p25}%`,
                      width:
                        `${Math.max(
                          p75 - p25,
                          0.5,
                        )}%`,
                      backgroundColor:
                        color,
                    }}
                  />

                  <i
                    className="terminal-marker terminal-marker-p05"
                    style={{
                      left:
                        `${p05}%`,
                    }}
                  />

                  <i
                    className="terminal-marker terminal-marker-p25"
                    style={{
                      left:
                        `${p25}%`,
                    }}
                  />

                  <i
                    className="terminal-marker terminal-marker-median"
                    style={{
                      left:
                        `${median}%`,
                      backgroundColor:
                        color,
                    }}
                  />

                  <i
                    className="terminal-marker terminal-marker-p75"
                    style={{
                      left:
                        `${p75}%`,
                    }}
                  />

                  <i
                    className="terminal-marker terminal-marker-p95"
                    style={{
                      left:
                        `${p95}%`,
                    }}
                  />
                </div>

                <div className="terminal-wealth-values">
                  <span>
                    P05{' '}
                    {
                      formatCurrency(
                        summary
                          .finalWealth
                          .percentile05,
                      )
                    }
                  </span>

                  <strong>
                    Median{' '}
                    {
                      formatCurrency(
                        summary
                          .finalWealth
                          .median,
                      )
                    }
                  </strong>

                  <span>
                    P95{' '}
                    {
                      formatCurrency(
                        summary
                          .finalWealth
                          .percentile95,
                      )
                    }
                  </span>
                </div>
              </article>
            )
          },
        )}
      </div>

      <div className="terminal-wealth-note">
        P05-P95 contains the middle 90% of
        terminal outcomes. The median is the
        middle result across all completed runs.
      </div>
    </section>
  )
}


export default TerminalWealthDistribution