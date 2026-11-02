import {
  Activity,
  BarChart3,
  Sigma,
  TrendingUp,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  getStatistics,
} from './statisticsApi'

import type {
  StatisticsResponse,
} from './statisticsModels'

import type {
  MarketMetadata,
} from '../../models/market'

interface Props {
  metadata: MarketMetadata | null
  symbol: string
  interval: number
  periodDays: number

  onSymbolChange: (
    value: string
  ) => void

  onIntervalChange: (
    value: number
  ) => void

  onPeriodChange: (
    value: number
  ) => void
}


function decimal(
  value: number,
  digits = 6,
): string {
  return value.toLocaleString(
    undefined,
    {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    },
  )
}


function percent(
  value: number,
  digits = 2,
): string {
  return `${(value * 100).toFixed(digits)}%`
}


function StatisticsPage({
  metadata,
  symbol,
  interval,
  periodDays,
  onSymbolChange,
  onIntervalChange,
  onPeriodChange,
}: Props) {
  const [data, setData] =
    useState<StatisticsResponse | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(
      null,
    )


  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    getStatistics(
      symbol,
      interval,
      periodDays,
      controller.signal,
    )
      .then(setData)
      .catch((reason: unknown) => {
        if (
          reason instanceof DOMException &&
          reason.name === 'AbortError'
        ) {
          return
        }

        setError(
          reason instanceof Error
            ? reason.message
            : 'Statistics could not be loaded.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () =>
      controller.abort()
  }, [
    symbol,
    interval,
    periodDays,
  ])


  const result =
    data?.result


  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Statistics</h1>
          <p>
            Descriptive statistics and
            return-distribution analysis
          </p>
        </div>
      </section>


      <section className="filters">
        <label>
          Market

          <select
            value={symbol}
            onChange={event =>
              onSymbolChange(
                event.target.value,
              )
            }
          >
            {metadata?.markets.map(
              market => (
                <option
                  key={market.symbol}
                  value={market.symbol}
                >
                  {market.displayName}
                </option>
              ),
            )}

            {!metadata && (
              <option value="ETHUSD">
                ETH/USD
              </option>
            )}
          </select>
        </label>


        <label>
          Interval

          <select
            value={interval}
            onChange={event =>
              onIntervalChange(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            {metadata?.intervals.map(
              item => (
                <option
                  key={item.minutes}
                  value={item.minutes}
                >
                  {item.name}
                </option>
              ),
            )}
          </select>
        </label>


        <label>
          Period

          <select
            value={periodDays}
            onChange={event =>
              onPeriodChange(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            {metadata?.periods.map(
              item => (
                <option
                  key={item.days}
                  value={item.days}
                >
                  {item.name}
                </option>
              ),
            )}
          </select>
        </label>
      </section>


      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}


      {loading && !result && (
        <div className="loading-card">
          Calculating statistics...
        </div>
      )}


      {result && (
        <>
          <section className="statistics-summary-grid">

            <article className="metric-card">
              <BarChart3
                size={18}
                className="stat-icon"
              />

              <span>
                Observations
              </span>

              <strong>
                {result.observationCount}
              </strong>

              <small>
                Valid closing prices
              </small>
            </article>


            <article className="metric-card">
              <Sigma
                size={18}
                className="stat-icon"
              />

              <span>
                Mean price
              </span>

              <strong>
                {decimal(
                  result.meanPrice,
                  2,
                )}
              </strong>

              <small>
                Arithmetic mean
              </small>
            </article>


            <article className="metric-card">
              <Activity
                size={18}
                className="stat-icon"
              />

              <span>
                Volatility
              </span>

              <strong>
                {percent(
                  result.annualizedVolatility,
                )}
              </strong>

              <small>
                Annualized estimate
              </small>
            </article>


            <article className="metric-card">
              <TrendingUp
                size={18}
                className="stat-icon"
              />

              <span>
                Mean log return
              </span>

              <strong>
                {percent(
                  result.meanLogReturn,
                  4,
                )}
              </strong>

              <small>
                Average period return
              </small>
            </article>

          </section>


          <section className="statistics-sections">

            <article className="statistics-card">
              <div className="statistics-card-header">
                <h2>
                  Price statistics
                </h2>

                <p>
                  Description of the
                  selected closing-price sample
                </p>
              </div>


              <div className="stat-table">

                <div>
                  <span>
                    Observations
                  </span>

                  <strong>
                    {result.observationCount}
                  </strong>
                </div>


                <div>
                  <span>
                    Mean
                  </span>

                  <strong>
                    {decimal(
                      result.meanPrice,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Minimum
                  </span>

                  <strong>
                    {decimal(
                      result.minimumPrice,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Maximum
                  </span>

                  <strong>
                    {decimal(
                      result.maximumPrice,
                      4,
                    )}
                  </strong>
                </div>

              </div>
            </article>


            <article className="statistics-card">
              <div className="statistics-card-header">
                <h2>
                  Return statistics
                </h2>

                <p>
                  Statistics calculated from
                  continuously compounded returns
                </p>
              </div>


              <div className="stat-table">

                <div>
                  <span>
                    Mean log return
                  </span>

                  <strong>
                    {decimal(
                      result.meanLogReturn,
                      8,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Sample variance
                  </span>

                  <strong>
                    {decimal(
                      result.returnVariance,
                      8,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Standard deviation
                  </span>

                  <strong>
                    {decimal(
                      result.returnStandardDeviation,
                      8,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Annualized volatility
                  </span>

                  <strong>
                    {percent(
                      result.annualizedVolatility,
                      4,
                    )}
                  </strong>
                </div>

              </div>
            </article>


            <article className="statistics-card">
              <div className="statistics-card-header">
                <h2>
                  Distribution shape
                </h2>

                <p>
                  Higher-moment characteristics
                  of the return distribution
                </p>
              </div>


              <div className="stat-table">

                <div>
                  <span>
                    Adjusted skewness
                  </span>

                  <strong>
                    {decimal(
                      result.skewness,
                      6,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Excess kurtosis
                  </span>

                  <strong>
                    {decimal(
                      result.excessKurtosis,
                      6,
                    )}
                  </strong>
                </div>

              </div>
            </article>


            <article className="statistics-card">
              <div className="statistics-card-header">
                <h2>
                  Return quantiles
                </h2>

                <p>
                  Empirical return-distribution
                  thresholds
                </p>
              </div>


              <div className="quantile-grid">

                <div>
                  <span>5%</span>

                  <strong>
                    {percent(
                      result.quantile05,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>10%</span>

                  <strong>
                    {percent(
                      result.quantile10,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>90%</span>

                  <strong>
                    {percent(
                      result.quantile90,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>95%</span>

                  <strong>
                    {percent(
                      result.quantile95,
                      4,
                    )}
                  </strong>
                </div>

              </div>
            </article>

          </section>
        </>
      )}
    </>
  )
}


export default StatisticsPage