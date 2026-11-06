import type {
  MonteCarloStrategySummary,
} from './simulationTypes'


interface StrategyComparisonProps {
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
      maximumFractionDigits: 2,
    },
  ).format(value)
}


function formatSignedPercent(
  value: number,
): string {
  if (value > 0) {
    return `+${value.toFixed(2)}%`
  }

  return `${value.toFixed(2)}%`
}


function StrategyComparison({
  summaries,
  runCount,
}: StrategyComparisonProps) {
  const rankedSummaries =
    [...summaries].sort(
      (
        left,
        right,
      ) => {
        if (
          right.wins !== left.wins
        ) {
          return (
            right.wins -
            left.wins
          )
        }

        return (
          right.finalWealth.median -
          left.finalWealth.median
        )
      },
    )

  const winner =
    rankedSummaries[0] ??
    null

  return (
    <section className="strategy-panel">
      <div className="strategy-panel-header">
        <div>
          <span className="simulation-eyebrow">
            Overall Monte Carlo results
          </span>

          <h2>
            Aggregate strategy comparison
          </h2>

          <p>
            Summary across{' '}
            {runCount.toLocaleString()}
            {' '}
            completed runs.
          </p>
        </div>

        {winner && (
          <div className="strategy-best">
            <span>
              Overall winner
            </span>

            <strong>
              {winner.strategyName}
            </strong>

            <small>
              {winner.wins.toLocaleString()}
              {' / '}
              {runCount.toLocaleString()}
              {' wins'}
            </small>
          </div>
        )}
      </div>

      <div className="strategy-table-wrap">
        <table className="strategy-table">
          <thead>
            <tr>
              <th>
                Strategy
              </th>

              <th>
                Median wealth
              </th>

              <th>
                Median return
              </th>

              <th>
                Loss probability
              </th>

              <th>
                Median max DD
              </th>

              <th>
                Wins
              </th>
            </tr>
          </thead>

          <tbody>
            {rankedSummaries.map(
              summary => {
                const isWinner =
                  summary.strategyId ===
                  winner?.strategyId

                return (
                  <tr
                    key={
                      summary.strategyId
                    }
                    className={
                      isWinner
                        ? 'strategy-row-best'
                        : undefined
                    }
                  >
                    <td>
                      <div className="strategy-name-cell">
                        <span
                          className="strategy-dot"
                          style={{
                            backgroundColor:
                              strategyColors[
                                summary
                                  .strategyId
                              ] ??
                              '#94a3b8',
                          }}
                        />

                        <div>
                          <strong>
                            {
                              summary
                                .strategyName
                            }
                          </strong>

                          <small>
                            {
                              summary.wins
                                .toLocaleString()
                            }
                            {' outright wins'}
                          </small>
                        </div>

                        {isWinner && (
                          <span className="strategy-best-badge">
                            Overall
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="strategy-value-strong">
                      {formatCurrency(
                        summary
                          .finalWealth
                          .median,
                      )}
                    </td>

                    <td
                      className={
                        summary
                          .returns
                          .median >= 0
                          ? 'positive-value'
                          : 'negative-value'
                      }
                    >
                      {formatSignedPercent(
                        summary
                          .returns
                          .median,
                      )}
                    </td>

                    <td>
                      {
                        summary
                          .lossProbabilityPercent
                          .toFixed(1)
                      }
                      %
                    </td>

                    <td
                      className={
                        summary
                          .maxDrawdowns
                          .median < 0
                          ? 'negative-value'
                          : undefined
                      }
                    >
                      {formatSignedPercent(
                        summary
                          .maxDrawdowns
                          .median,
                      )}
                    </td>

                    <td>
                      <strong>
                        {
                          summary.wins
                            .toLocaleString()
                        }
                      </strong>

                      <small>
                        {' / '}
                        {
                          runCount
                            .toLocaleString()
                        }
                      </small>
                    </td>
                  </tr>
                )
              },
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}


export default StrategyComparison