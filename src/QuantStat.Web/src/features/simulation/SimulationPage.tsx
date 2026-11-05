import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getDashboard,
} from '../../api/quantStatApi'

import type {
  DashboardResult,
} from '../../models/market'


import type {
  SimulationResult,
  SimulationSelection,
} from './simulationTypes'

import WealthChart
  from './WealthChart'

import StrategyComparison
  from './StrategyComparison'

import TradeDetails
  from './TradeDetails'

import {
  buildEquityAnalytics,
  createSeed,
  rsiTypeLabel,
  runDcaSimulation,
  runLumpSumSimulation,
  runRandomSimulation,
  runRsiSimulation,
} from './simulationEngine'






function readSelection(): SimulationSelection {
  const assetClass =
    localStorage.getItem(
      'quantstat-asset-class',
    ) === 'crypto'
      ? 'crypto'
      : 'stock'

  const defaultSymbol =
    assetClass === 'crypto'
      ? 'BTC/USD'
      : 'AAPL'

  return {
    assetClass,

    symbol:
      localStorage.getItem(
        'quantstat-symbol',
      ) ?? defaultSymbol,

    interval:
      Number(
        localStorage.getItem(
          'quantstat-interval',
        ) ?? 1440,
      ),

    periodDays:
      Number(
        localStorage.getItem(
          'quantstat-period-days',
        ) ?? 365,
      ),
  }
}


function intervalLabel(
  minutes: number,
): string {
  const labels:
    Record<number, string> = {
      1: '1 Minute',
      5: '5 Minutes',
      15: '15 Minutes',
      30: '30 Minutes',
      60: '1 Hour',
      240: '4 Hours',
      1440: '1 Day',
      10080: '1 Week',
      21600: '15 Days',
    }

  return labels[minutes] ??
    `${minutes} Minutes`
}


function periodLabel(
  days: number,
): string {
  const labels:
    Record<number, string> = {
      30: '30 Days',
      90: '90 Days',
      180: '180 Days',
      365: '1 Year',
      720: 'Maximum',
    }

  return labels[days] ??
    `${days} Days`
}


function displaySymbol(
  symbol: string,
): string {
  const quotes = [
    'USDT',
    'USDC',
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'CHF',
    'BTC',
    'ETH',
  ]

  if (symbol.includes('/')) {
    return symbol
  }

  const quote =
    quotes.find(
      candidate =>
        symbol.endsWith(
          candidate,
        ) &&
        symbol.length >
          candidate.length,
    )

  if (!quote) {
    return symbol
  }

  return `${symbol.slice(
    0,
    -quote.length,
  )}/${quote}`
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


function formatNumber(
  value: number,
  digits = 6,
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        digits,
    },
  ).format(value)
}




function SimulationPage() {
  const [
    selection,
    setSelection,
  ] =
    useState<SimulationSelection>(
      readSelection,
    )

  const [
    dashboard,
    setDashboard,
  ] =
    useState<
      DashboardResult | null
    >(null)

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    amountPerPurchase,
    setAmountPerPurchase,
  ] =
    useState(100)

  const [
    numberOfPurchases,
    setNumberOfPurchases,
  ] =
    useState(20)

  const [
    rsiType,
    setRsiType,
  ] =
    useState<
      'wilder' |
      'cutler' |
      'exponential'
    >('wilder')

  const [
    rsiPeriod,
    setRsiPeriod,
  ] =
    useState(14)

  const [
    rsiThreshold,
    setRsiThreshold,
  ] =
    useState(35)

  const [
    seed,
    setSeed,
  ] =
    useState(
      createSeed,
    )

  const [
    simulation,
    setSimulation,
  ] =
    useState<
      SimulationResult | null
    >(null)


  const dcaSimulation =
    useMemo(
      () => {
        if (
          !dashboard ||
          !simulation
        ) {
          return null
        }

        return runDcaSimulation(
          dashboard,
          amountPerPurchase,
          numberOfPurchases,
        )
      },
      [
        dashboard,
        simulation,
        amountPerPurchase,
        numberOfPurchases,
      ],
    )


  const lumpSumSimulation =
    useMemo(
      () => {
        if (
          !dashboard ||
          !simulation
        ) {
          return null
        }

        return runLumpSumSimulation(
          dashboard,
          amountPerPurchase,
          numberOfPurchases,
        )
      },
      [
        dashboard,
        simulation,
        amountPerPurchase,
        numberOfPurchases,
      ],
    )


  const rsiSimulation =
    useMemo(
      () => {
        if (
          !dashboard ||
          !simulation
        ) {
          return null
        }

        return runRsiSimulation(
          dashboard,
          amountPerPurchase,
          numberOfPurchases,
          rsiType,
          rsiThreshold,
        )
      },
      [
        dashboard,
        simulation,
        amountPerPurchase,
        numberOfPurchases,
        rsiType,
        rsiThreshold,
      ],
    )


  const startingBudget =
    amountPerPurchase *
    numberOfPurchases


  const parametersValid =
    Number.isFinite(
      amountPerPurchase,
    ) &&
    amountPerPurchase > 0 &&
    Number.isInteger(
      numberOfPurchases,
    ) &&
    numberOfPurchases > 0 &&
    Number.isInteger(
      rsiPeriod,
    ) &&
    rsiPeriod > 0 &&
    Number.isFinite(
      rsiThreshold,
    ) &&
    rsiThreshold >= 0 &&
    rsiThreshold <= 100 &&
    Number.isInteger(seed) &&
    seed >= 0


  const availableObservations =
    dashboard?.points.filter(
      point =>
        Number.isFinite(
          point.price,
        ) &&
        point.price > 0,
    ).length ?? 0


  const purchaseWarning =
    useMemo(
      () =>
        dashboard &&
        numberOfPurchases >
          availableObservations
          ? `Only ${availableObservations} valid candles are available. The simulation will execute ${availableObservations} purchases and keep the remaining budget as cash.`
          : null,
      [
        dashboard,
        numberOfPurchases,
        availableObservations,
      ],
    )


  useEffect(() => {
    const synchronizeSelection =
      (): void => {
        setSelection(
          readSelection(),
        )

        setSimulation(null)
      }

    window.addEventListener(
      'quantstat-market-selection-changed',
      synchronizeSelection,
    )

    window.addEventListener(
      'quantstat-market-selection-invalidated',
      synchronizeSelection,
    )

    window.addEventListener(
      'storage',
      synchronizeSelection,
    )

    return () => {
      window.removeEventListener(
        'quantstat-market-selection-changed',
        synchronizeSelection,
      )

      window.removeEventListener(
        'quantstat-market-selection-invalidated',
        synchronizeSelection,
      )

      window.removeEventListener(
        'storage',
        synchronizeSelection,
      )
    }
  }, [])


  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setError(null)
    setDashboard(null)
    setSimulation(null)

    getDashboard(
      selection.symbol,
      selection.interval,
      selection.periodDays,
      controller.signal,
      selection.assetClass,
      rsiPeriod,
    )
      .then(
        result => {
          setDashboard(
            result,
          )
        },
      )
      .catch(
        (
          reason: unknown,
        ) => {
          if (
            reason instanceof
              DOMException &&
            reason.name ===
              'AbortError'
          ) {
            return
          }

          setError(
            reason instanceof Error
              ? reason.message
              : 'Simulation data could not be loaded.',
          )
        },
      )
      .finally(() => {
        if (
          !controller.signal
            .aborted
        ) {
          setLoading(false)
        }
      })

    return () =>
      controller.abort()
  }, [selection, rsiPeriod])


  const handleRun =
    (): void => {
      if (
        !dashboard ||
        !parametersValid
      ) {
        return
      }

      try {
        setError(null)

        setSimulation(
          runRandomSimulation(
            dashboard,
            amountPerPurchase,
            numberOfPurchases,
            seed,
          ),
        )
      }
      catch (
        reason: unknown
      ) {
        setSimulation(null)

        setError(
          reason instanceof Error
            ? reason.message
            : 'The simulation could not be completed.',
        )
      }
    }


  const handleNewSeed =
    (): void => {
      const nextSeed =
        createSeed()

      setSeed(nextSeed)
      setSimulation(null)
    }


  const handleRunNew =
    (): void => {
      if (
        !dashboard ||
        !parametersValid
      ) {
        return
      }

      const nextSeed =
        createSeed()

      setSeed(nextSeed)
      setError(null)

      try {
        setSimulation(
          runRandomSimulation(
            dashboard,
            amountPerPurchase,
            numberOfPurchases,
            nextSeed,
          ),
        )
      }
      catch (
        reason: unknown
      ) {
        setSimulation(null)

        setError(
          reason instanceof Error
            ? reason.message
            : 'The simulation could not be completed.',
        )
      }
    }


  const randomAnalytics =
    useMemo(
      () =>
        dashboard &&
        simulation
          ? buildEquityAnalytics(
              dashboard,
              simulation.trades,
              simulation.startingBudget,
            )
          : null,
      [
        dashboard,
        simulation,
      ],
    )


  const dcaAnalytics =
    useMemo(
      () =>
        dashboard &&
        dcaSimulation
          ? buildEquityAnalytics(
              dashboard,
              dcaSimulation.trades,
              dcaSimulation.startingBudget,
            )
          : null,
      [
        dashboard,
        dcaSimulation,
      ],
    )


  const rsiAnalytics =
    useMemo(
      () =>
        dashboard &&
        rsiSimulation
          ? buildEquityAnalytics(
              dashboard,
              rsiSimulation.trades,
              rsiSimulation.startingBudget,
            )
          : null,
      [
        dashboard,
        rsiSimulation,
      ],
    )


  const lumpSumAnalytics =
    useMemo(
      () =>
        dashboard &&
        lumpSumSimulation
          ? buildEquityAnalytics(
              dashboard,
              lumpSumSimulation.trades,
              lumpSumSimulation.startingBudget,
            )
          : null,
      [
        dashboard,
        lumpSumSimulation,
      ],
    )

  const benchmarkWinner =
    useMemo(
      () => {
        if (
          !simulation ||
          !dcaSimulation ||
          !lumpSumSimulation ||
          !rsiSimulation
        ) {
          return null
        }

        const strategies = [
          {
            name: 'Random timing',
            wealth:
              simulation.finalWealth,
          },
          {
            name: 'Regular DCA',
            wealth:
              dcaSimulation.finalWealth,
          },
          {
            name: 'Lump Sum / Buy & Hold',
            wealth:
              lumpSumSimulation.finalWealth,
          },
          {
            name:
              `${rsiTypeLabel(rsiType)} < ${rsiThreshold}`,
            wealth:
              rsiSimulation.finalWealth,
          },
        ]

        const ordered =
          [...strategies].sort(
            (left, right) =>
              right.wealth -
              left.wealth,
          )

        return {
          winner:
            ordered[0],
          difference:
            ordered[0].wealth -
            ordered[1].wealth,
        }
      },
      [
        simulation,
        dcaSimulation,
        lumpSumSimulation,
        rsiSimulation,
        rsiType,
        rsiThreshold,
      ],
    )

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>
            Simulation
          </h1>

          <p>
            Historical investment strategy simulation and Monte Carlo analysis
          </p>
        </div>
      </section>


      <section className="selection-summary">
        <div>
          <span>
            Market
          </span>

          <strong>
            {displaySymbol(
              selection.symbol,
            )}
          </strong>
        </div>

        <div>
          <span>
            Asset class
          </span>

          <strong>
            {
              selection.assetClass ===
              'stock'
                ? 'Stock'
                : 'Crypto'
            }
          </strong>
        </div>

        <div>
          <span>
            Interval
          </span>

          <strong>
            {intervalLabel(
              selection.interval,
            )}
          </strong>
        </div>

        <div>
          <span>
            Period
          </span>

          <strong>
            {periodLabel(
              selection.periodDays,
            )}
          </strong>
        </div>

        <div className="selection-note">
          Change the market selection
          from Markets.
        </div>
      </section>


      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}


      <section className="chart-card">
        <div className="card-heading">
          <div>
            <h2>
              Random purchase simulation
            </h2>

            <p>
              Purchase times are sampled uniformly from distinct completed candles.
            </p>
          </div>
        </div>


        <div className="simulation-parameters">
          <label className="simulation-field">
            <span>
              Amount per purchase
            </span>

            <input
              type="number"
              min="0.01"
              step="10"
              value={
                amountPerPurchase
              }
              onChange={event => {
                setAmountPerPurchase(
                  Number(
                    event.target.value,
                  ),
                )

                setSimulation(null)
              }}
            />

            <small>
              Capital allocated to each executed purchase.
            </small>
          </label>


          <label className="simulation-field">
            <span>
              Number of purchases
            </span>

            <input
              type="number"
              min="1"
              step="1"
              value={
                numberOfPurchases
              }
              onChange={event => {
                setNumberOfPurchases(
                  Number(
                    event.target.value,
                  ),
                )

                setSimulation(null)
              }}
            />

            <small>
              Requested number of distinct random purchase events.
            </small>
          </label>


          <label className="simulation-field">
            <span>
              RSI type
            </span>

            <select
              value={rsiType}
              onChange={event => {
                setRsiType(
                  event.target.value as
                    | 'wilder'
                    | 'cutler'
                    | 'exponential',
                )

                setSimulation(null)
              }}
            >
              <option value="wilder">
                Wilder RSI
              </option>

              <option value="cutler">
                Cutler RSI
              </option>

              <option value="exponential">
                Exponential RSI
              </option>
            </select>

            <small>
              Momentum indicator used by the RSI strategy.
            </small>
          </label>


          <label className="simulation-field">
            <span>
              RSI period
            </span>

            <input
              type="number"
              min="1"
              step="1"
              value={rsiPeriod}
              onChange={event => {
                setRsiPeriod(
                  Number(
                    event.target.value,
                  ),
                )

                setSimulation(null)
              }}
            />

            <small>
              Lookback period calculated by QuantStat.Core.
            </small>
          </label>


          <label className="simulation-field">
            <span>
              RSI buy threshold
            </span>

            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={rsiThreshold}
              onChange={event => {
                setRsiThreshold(
                  Number(
                    event.target.value,
                  ),
                )

                setSimulation(null)
              }}
            />

            <small>
              Buy signal when RSI is below this level.
            </small>
          </label>

          <label className="simulation-field">
            <span>
              Random seed
            </span>

            <input
              type="number"
              min="0"
              step="1"
              value={seed}
              onChange={event => {
                setSeed(
                  Number(
                    event.target.value,
                  ),
                )

                setSimulation(null)
              }}
            />

            <small>
              The same seed reproduces the same random purchase times.
            </small>
          </label>


          <div className="simulation-budget">
            <span>
              Starting budget
            </span>

            <strong>
              {formatCurrency(
                startingBudget,
              )}
            </strong>

            <small>
              Amount per purchase multiplied by requested purchases
            </small>
          </div>


          <div className="simulation-budget">
            <span>
              Available candles
            </span>

            <strong>
              {loading
                ? '...'
                : availableObservations}
            </strong>

            <small>
              Valid completed observations available for sampling
            </small>
          </div>


          <div className="simulation-budget">
            <span>
              Sampling method
            </span>

            <strong>
              Uniform
            </strong>

            <small>
              Without replacement across completed candles
            </small>
          </div>
        </div>


        {!parametersValid && (
          <div className="error-banner">
            Enter a positive purchase amount, a whole number of purchases and a non-negative whole-number seed.
          </div>
        )}


        {purchaseWarning && (
          <div className="simulation-warning">
            {purchaseWarning}
          </div>
        )}


        <div className="simulation-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={
              handleNewSeed
            }
          >
            Generate New Seed
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={
              loading ||
              !dashboard ||
              !parametersValid
            }
            onClick={
              handleRunNew
            }
          >
            Run with New Seed
          </button>

          <button
            type="button"
            className="primary-button"
            disabled={
              loading ||
              !dashboard ||
              !parametersValid
            }
            onClick={
              handleRun
            }
          >
            {
              loading
                ? 'Loading Data...'
                : 'Run Simulation'
            }
          </button>
        </div>
      </section>


      {simulation && (
        <>
          <section className="simulation-results-grid">
            <article className="simulation-result-card">
              <span>
                Final wealth
              </span>

              <strong>
                {formatCurrency(
                  simulation.finalWealth,
                )}
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                PnL
              </span>

              <strong
                className={
                  simulation.pnl >= 0
                    ? 'positive-value'
                    : 'negative-value'
                }
              >
                {formatCurrency(
                  simulation.pnl,
                )}
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                Total return
              </span>

              <strong
                className={
                  simulation.returnPercent >=
                  0
                    ? 'positive-value'
                    : 'negative-value'
                }
              >
                {formatNumber(
                  simulation.returnPercent,
                  2,
                )}
                %
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                Average entry
              </span>

              <strong>
                {formatCurrency(
                  simulation.averageEntryPrice,
                )}
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                Final market price
              </span>

              <strong>
                {formatCurrency(
                  simulation.finalPrice,
                )}
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                Executed purchases
              </span>

              <strong>
                {
                  simulation.executedPurchases
                }
                {' / '}
                {
                  simulation.requestedPurchases
                }
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                Invested capital
              </span>

              <strong>
                {formatCurrency(
                  simulation.investedCapital,
                )}
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                Unused cash
              </span>

              <strong>
                {formatCurrency(
                  simulation.unusedCash,
                )}
              </strong>
            </article>

            <article className="simulation-result-card">
              <span>
                Total quantity
              </span>

              <strong>
                {formatNumber(
                  simulation.totalQuantity,
                  8,
                )}
              </strong>
            </article>
          </section>


          {
            dcaSimulation &&
            rsiSimulation &&
            lumpSumSimulation &&
            randomAnalytics &&
            dcaAnalytics &&
            rsiAnalytics &&
            lumpSumAnalytics && (
              <>
                <StrategyComparison
                  random={
                    simulation
                  }
                  randomAnalytics={
                    randomAnalytics
                  }
                  dca={
                    dcaSimulation
                  }
                  dcaAnalytics={
                    dcaAnalytics
                  }
                  rsi={
                    rsiSimulation
                  }
                  rsiAnalytics={
                    rsiAnalytics
                  }
                  lumpSum={
                    lumpSumSimulation
                  }
                  lumpSumAnalytics={
                    lumpSumAnalytics
                  }
                  rsiLabel={
                    `${rsiTypeLabel(rsiType)} < ${rsiThreshold}`
                  }
                  rsiPeriod={
                    rsiPeriod
                  }
                  winnerName={
                    benchmarkWinner?.winner.name ??
                    '-'
                  }
                  winnerDifference={
                    benchmarkWinner?.difference ??
                    0
                  }
                />

                <TradeDetails
                  random={
                    simulation
                  }
                  dca={
                    dcaSimulation
                  }
                  rsi={
                    rsiSimulation
                  }
                  rsiLabel={
                    `${rsiTypeLabel(rsiType)}, period ${rsiPeriod}, below ${rsiThreshold}`
                  }
                />
              </>
            )
          }


      {
        randomAnalytics &&
        dcaAnalytics &&
        rsiAnalytics &&
        lumpSumAnalytics && (
          <WealthChart
            random={
              randomAnalytics
            }
            dca={
              dcaAnalytics
            }
            rsi={
              rsiAnalytics
            }
            lumpSum={
              lumpSumAnalytics
            }
          />
        )
      }

        </>
      )}

      <section className="simulation-disclaimer">
        Historical simulation only. Results depend on the selected market period and do not represent a forecast or investment recommendation.
      </section>
    </>
  )
}


export default SimulationPage
