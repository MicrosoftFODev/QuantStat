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
  MonteCarloResult,
  SimulationResult,
  SimulationSelection,
} from './simulationTypes'

import WealthChart
  from './WealthChart'

import StrategyComparison
  from './StrategyComparison'

import TradeDetails
  from './TradeDetails'

import SimulationSetup
  from './SimulationSetup'

import MonteCarloWinRates
  from './MonteCarloWinRates'

import {
  buildEquityAnalytics,
  createSeed,
  rsiTypeLabel,
} from './simulationEngine'

import {
  runMonteCarloSimulation,
} from './monteCarloEngine'






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


function displaySymbol(
  symbol: string,
): string {
  const normalized =
    symbol.trim()

  if (
    normalized.includes('/')
  ) {
    return normalized
  }

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

  const quote =
    quotes.find(
      candidate =>
        normalized.endsWith(
          candidate,
        ) &&
        normalized.length >
          candidate.length,
    )

  if (!quote) {
    return normalized
  }

  return `${normalized.slice(
    0,
    -quote.length,
  )}/${quote}`
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

  return (
    labels[days] ??
    `${days} Days`
  )
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

  return (
    labels[minutes] ??
    `${minutes} Minutes`
  )
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


  const [
    monteCarlo,
    setMonteCarlo,
  ] =
    useState<
      MonteCarloResult | null
    >(null)


  const monteCarloRunCount =
    1_000


  const representativeRun =
    useMemo(
      () => {
        if (!monteCarlo) {
          return null
        }

        return (
          monteCarlo.runs.find(
            run =>
              run.runNumber ===
              monteCarlo
                .representativeRunNumber,
          ) ?? null
        )
      },
      [
        monteCarlo,
      ],
    )


  const representativeDashboard =
    useMemo(
      () => {
        if (
          !dashboard ||
          !monteCarlo ||
          !representativeRun
        ) {
          return null
        }

        const validPoints =
          dashboard.points.filter(
            point =>
              Number.isFinite(
                point.price,
              ) &&
              point.price > 0,
          )

        return {
          ...dashboard,

          points:
            validPoints.slice(
              representativeRun
                .windowStartIndex,

              representativeRun
                .windowStartIndex +
                monteCarlo.windowSize,
            ),
        }
      },
      [
        dashboard,
        monteCarlo,
        representativeRun,
      ],
    )


  const dcaSimulation =
    monteCarlo
      ?.representativeDca ??
    null


  const lumpSumSimulation =
    monteCarlo
      ?.representativeLumpSum ??
    null


  const rsiSimulation =
    monteCarlo
      ?.representativeRsi ??
    null


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


  const executeMonteCarlo =
    (
      masterSeed: number,
    ): void => {
      if (
        !dashboard ||
        !parametersValid
      ) {
        return
      }

      try {
        setError(null)

        const result =
          runMonteCarloSimulation(
            dashboard,
            {
              runCount:
                monteCarloRunCount,

              masterSeed,

              amountPerPurchase,

              requestedPurchases:
                numberOfPurchases,

              rsiType,
              rsiPeriod,
              rsiThreshold,
            },
          )

        setMonteCarlo(
          result,
        )

        setSimulation(
          result
            .representativeRandom,
        )
      }
      catch (
        reason: unknown
      ) {
        setMonteCarlo(null)
        setSimulation(null)

        setError(
          reason instanceof Error
            ? reason.message
            : 'The Monte Carlo simulation could not be completed.',
        )
      }
    }


  const handleRun =
    (): void => {
      executeMonteCarlo(
        seed,
      )
    }


  const handleNewSeed =
    (): void => {
      const nextSeed =
        createSeed()

      setSeed(nextSeed)
      setMonteCarlo(null)
      setSimulation(null)
    }


  const handleRunNew =
    (): void => {
      const nextSeed =
        createSeed()

      setSeed(nextSeed)

      executeMonteCarlo(
        nextSeed,
      )
    }


  const randomAnalytics =
    useMemo(
      () =>
        representativeDashboard &&
        simulation
          ? buildEquityAnalytics(
              representativeDashboard,
              simulation.trades,
              simulation.startingBudget,
            )
          : null,
      [
        representativeDashboard,
        simulation,
      ],
    )


  const dcaAnalytics =
    useMemo(
      () =>
        representativeDashboard &&
        dcaSimulation
          ? buildEquityAnalytics(
              representativeDashboard,
              dcaSimulation.trades,
              dcaSimulation.startingBudget,
            )
          : null,
      [
        representativeDashboard,
        dcaSimulation,
      ],
    )


  const rsiAnalytics =
    useMemo(
      () =>
        representativeDashboard &&
        rsiSimulation
          ? buildEquityAnalytics(
              representativeDashboard,
              rsiSimulation.trades,
              rsiSimulation.startingBudget,
            )
          : null,
      [
        representativeDashboard,
        rsiSimulation,
      ],
    )


  const lumpSumAnalytics =
    useMemo(
      () =>
        representativeDashboard &&
        lumpSumSimulation
          ? buildEquityAnalytics(
              representativeDashboard,
              lumpSumSimulation.trades,
              lumpSumSimulation.startingBudget,
            )
          : null,
      [
        representativeDashboard,
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
            {
              monteCarlo && (
                <>
                  {' '}
                  Ãƒâ€šÃ‚Â· {
                    monteCarlo
                      .runs.length
                      .toLocaleString()
                  } runs completed
                </>
              )
            }
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


      <SimulationSetup
        amountPerPurchase={
          amountPerPurchase
        }
        numberOfPurchases={
          numberOfPurchases
        }
        startingBudget={
          startingBudget
        }
        rsiType={
          rsiType
        }
        rsiPeriod={
          rsiPeriod
        }
        rsiThreshold={
          rsiThreshold
        }
        seed={
          seed
        }
        availableObservations={
          availableObservations
        }
        loading={
          loading
        }
        parametersValid={
          parametersValid &&
          dashboard !== null
        }
        purchaseWarning={
          purchaseWarning
        }
        onAmountChange={
          value => {
            setAmountPerPurchase(
              value,
            )
            setMonteCarlo(null)
            setSimulation(null)
          }
        }
        onPurchasesChange={
          value => {
            setNumberOfPurchases(
              value,
            )
            setMonteCarlo(null)
            setSimulation(null)
          }
        }
        onRsiTypeChange={
          value => {
            setRsiType(
              value,
            )
            setMonteCarlo(null)
            setSimulation(null)
          }
        }
        onRsiPeriodChange={
          value => {
            setRsiPeriod(
              value,
            )
            setMonteCarlo(null)
            setSimulation(null)
          }
        }
        onRsiThresholdChange={
          value => {
            setRsiThreshold(
              value,
            )
            setMonteCarlo(null)
            setSimulation(null)
          }
        }
        onSeedChange={
          value => {
            setSeed(
              value,
            )
            setMonteCarlo(null)
            setSimulation(null)
          }
        }
        onGenerateSeed={
          handleNewSeed
        }
        onRunNewSeed={
          handleRunNew
        }
        onRun={
          handleRun
        }
      />
      {
        monteCarlo && (
          <MonteCarloWinRates
            result={
              monteCarlo
            }
          />
        )
      }


      {
        monteCarlo && (
          <MonteCarloWinRates
            result={
              monteCarlo
            }
          />
        )
      }


      {simulation && (
        <>


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
