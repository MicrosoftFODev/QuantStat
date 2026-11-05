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


interface StrategyRow {
  name: string
  detail: string
  color: string
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


function formatSignedCurrency(
  value: number,
): string {
  const formatted =
    formatCurrency(
      Math.abs(value),
    )

  if (value > 0) {
    return `+${formatted}`
  }

  if (value < 0) {
    return `-${formatted}`
  }

  return formatted
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
  const strategies:
    StrategyRow[] = [
      {
        name:
          'Random Timing',
        detail:
          `Seed ${random.seed}`,
        color:
          '#6c8cff',
        result:
          random,
        analytics:
          randomAnalytics,
      },
      {
        name:
          'Regular DCA',
        detail:
          'Even spacing',
        color:
          '#22c55e',
        result:
          dca,
        analytics:
          dcaAnalytics,
      },
      {
        name:
          rsiLabel,
        detail:
          `Period ${rsiPeriod}`,
        color:
          '#a78bfa',
        result:
          rsi,
        analytics:
          rsiAnalytics,
      },
      {
        name:
          'Lump Sum / Buy & Hold',
        detail:
          'Full initial investment',
        color:
          '#f59e0b',
        result:
          lumpSum,
        analytics:
          lumpSumAnalytics,
      },
    ]

  return (
    <section className="strategy-panel">
      <div className="strategy-panel-header">
        <div>
          <span className="simulation-eyebrow">
            Historical strategies
          </span>

          <h2>
            Strategy comparison
          </h2>

          <p>
            Same starting capital and terminal valuation date.
          </p>
        </div>

        <div className="strategy-best">
          <span>
            Best historical
          </span>

          <strong>
            {winnerName}
          </strong>

          <small>
            +{formatCurrency(
              winnerDifference,
            )}{' '}
            vs second
          </small>
        </div>
      </div>


      <div className="strategy-table-wrap">
        <table className="strategy-table">
          <thead>
            <tr>
              <th>
                Strategy
              </th>

              <th>
                Wealth
              </th>

              <th>
                PnL
              </th>

              <th>
                Return
              </th>

              <th>
                Max DD
              </th>

              <th>
                Deployed
              </th>
            </tr>
          </thead>

          <tbody>
            {strategies.map(
              strategy => {
                const isWinner =
                  strategy.name ===
                  winnerName

                return (
                  <tr
                    key={
                      strategy.name
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
                              strategy.color,
                          }}
                        />

                        <div>
                          <strong>
                            {
                              strategy.name
                            }
                          </strong>

                          <small>
                            {
                              strategy.detail
                            }
                          </small>
                        </div>

                        {isWinner && (
                          <span className="strategy-best-badge">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="strategy-value-strong">
                      {formatCurrency(
                        strategy.result
                          .finalWealth,
                      )}
                    </td>

                    <td
                      className={
                        strategy.result
                          .pnl >= 0
                          ? 'positive-value'
                          : 'negative-value'
                      }
                    >
                      {formatSignedCurrency(
                        strategy.result.pnl,
                      )}
                    </td>

                    <td
                      className={
                        strategy.result
                          .returnPercent >= 0
                          ? 'positive-value'
                          : 'negative-value'
                      }
                    >
                      {formatSignedPercent(
                        strategy.result
                          .returnPercent,
                      )}
                    </td>

                    <td
                      className={
                        strategy.analytics
                          .maxDrawdownPercent <
                        0
                          ? 'negative-value'
                          : undefined
                      }
                    >
                      {formatSignedPercent(
                        strategy.analytics
                          .maxDrawdownPercent,
                      )}
                    </td>

                    <td>
                      {
                        strategy.analytics
                          .capitalUtilizationPercent
                          .toFixed(1)
                      }
                      %
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
