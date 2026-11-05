import {
  useState,
} from 'react'

import type {
  SimulationResult,
  SimulationTrade,
} from './simulationTypes'


interface TradeDetailsProps {
  random: SimulationResult
  dca: SimulationResult
  rsi: SimulationResult
  rsiLabel: string
}


interface TradeTableProps {
  title: string
  subtitle: string
  trades: SimulationTrade[]
  showSignal?: boolean
}


function currency(
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


function quantity(
  value: number,
): string {
  return value.toLocaleString(
    'en-US',
    {
      maximumFractionDigits: 8,
    },
  )
}


function dateTime(
  value: string,
): string {
  return new Date(
    value,
  ).toLocaleString()
}


function TradeTable({
  title,
  subtitle,
  trades,
  showSignal = false,
}: TradeTableProps) {
  return (
    <section className="chart-card">
      <div className="card-heading">
        <div>
          <h2>
            {title}
          </h2>

          <p>
            {subtitle}
          </p>
        </div>

        <strong>
          {trades.length} trades
        </strong>
      </div>

      {trades.length === 0 ? (
        <div className="simulation-warning">
          No purchases were executed for this strategy.
        </div>
      ) : (
        <div className="simulation-table-wrapper">
          <table className="simulation-table">
            <thead>
              <tr>
                <th>
                  #
                </th>

                {showSignal && (
                  <>
                    <th>
                      Signal date
                    </th>

                    <th>
                      Signal
                    </th>
                  </>
                )}

                <th>
                  Execution date
                </th>

                <th>
                  Price
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Quantity
                </th>
              </tr>
            </thead>

            <tbody>
              {trades.map(
                (
                  trade,
                  index,
                ) => (
                  <tr
                    key={
                      `${title}-${trade.date}-${trade.index}-${index}`
                    }
                  >
                    <td>
                      {index + 1}
                    </td>

                    {showSignal && (
                      <>
                        <td>
                          {
                            trade.signalDate
                              ? dateTime(
                                  trade.signalDate,
                                )
                              : '-'
                          }
                        </td>

                        <td>
                          {
                            trade.signalValue !== undefined
                              ? trade.signalValue.toFixed(2)
                              : '-'
                          }
                        </td>
                      </>
                    )}

                    <td>
                      {dateTime(
                        trade.date,
                      )}
                    </td>

                    <td>
                      {currency(
                        trade.price,
                      )}
                    </td>

                    <td>
                      {currency(
                        trade.amount,
                      )}
                    </td>

                    <td>
                      {quantity(
                        trade.quantity,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}


function TradeDetails({
  random,
  dca,
  rsi,
  rsiLabel,
}: TradeDetailsProps) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(false)

  const totalTrades =
    random.trades.length +
    dca.trades.length +
    rsi.trades.length

  return (
    <>
      <section className="chart-card simulation-trade-control">
        <div className="card-heading">
          <div>
            <h2>
              Trade details
            </h2>

            <p>
              Individual purchases are hidden by default. Expand them to audit the historical simulation.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setExpanded(
                current =>
                  !current,
              )
            }
          >
            {
              expanded
                ? 'Hide Trade Details'
                : `Show Trade Details (${totalTrades})`
            }
          </button>
        </div>
      </section>

      {expanded && (
        <>
          <TradeTable
            title="Random purchases"
            subtitle={`Seed ${random.seed}`}
            trades={random.trades}
          />

          <TradeTable
            title="Regular DCA purchases"
            subtitle="Purchases distributed across the selected historical period."
            trades={dca.trades}
          />

          <TradeTable
            title="RSI strategy purchases"
            subtitle={`${rsiLabel}. Signal uses candle t and execution uses candle t + 1.`}
            trades={rsi.trades}
            showSignal
          />
        </>
      )}
    </>
  )
}


export default TradeDetails
