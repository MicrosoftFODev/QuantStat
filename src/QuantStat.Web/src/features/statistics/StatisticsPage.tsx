import ReturnDistributionChart from './ReturnDistributionChart'

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

  const quote =
    quotes.find(
      candidate =>
        symbol.endsWith(candidate) &&
        symbol.length > candidate.length,
    )

  if (!quote) {
    return symbol
  }

  const base =
    symbol.slice(
      0,
      -quote.length,
    )

  return `${base}/${quote}`
}


function StatisticsPage() {
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

  const symbol =
    localStorage.getItem(
      'quantstat-symbol',
    ) ?? 'ETHUSD'

  const interval =
    Number(
      localStorage.getItem(
        'quantstat-interval',
      ) ?? 1440,
    )

  const periodDays =
    Number(
      localStorage.getItem(
        'quantstat-period-days',
      ) ?? 365,
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
          <h1>
            Statistics
          </h1>

          <p>
            Descriptive statistics and
            return-distribution analysis
          </p>
        </div>

      </section>


      <section className="selection-summary">

        <div>
          <span>
            Market
          </span>

          <strong>
            {displaySymbol(symbol)}
          </strong>
        </div>


        <div>
          <span>
            Interval
          </span>

          <strong>
            {intervalLabel(interval)}
          </strong>
        </div>


        <div>
          <span>
            Period
          </span>

          <strong>
            {periodLabel(periodDays)}
          </strong>
        </div>


        <div className="selection-note">
          Change the analysis selection
          from the Dashboard.
        </div>

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
                  Description of the selected
                  closing-price sample
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
                    Arithmetic mean
                  </span>

                  <strong>
                    {decimal(
                      result.meanPrice,
                      6,
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
                      6,
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
                      6,
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
                  Continuously compounded
                  market returns
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
                      10,
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
                      10,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Sample standard deviation
                  </span>

                  <strong>
                    {decimal(
                      result.returnStandardDeviation,
                      10,
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
                  Adjusted higher-moment
                  estimators
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
                      8,
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
                      8,
                    )}
                  </strong>
                </div>

              </div>

            </article>


            <article className="statistics-card">

              <div className="statistics-card-header">

                <h2>
                  Empirical quantiles
                </h2>

                <p>
                  Linear-interpolated
                  return thresholds
                </p>

              </div>


              <div className="quantile-grid">

                <div>
                  <span>
                    5%
                  </span>

                  <strong>
                    {percent(
                      result.quantile05,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    10%
                  </span>

                  <strong>
                    {percent(
                      result.quantile10,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    90%
                  </span>

                  <strong>
                    {percent(
                      result.quantile90,
                      4,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    95%
                  </span>

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

          <ReturnDistributionChart />

        </>
      )}
    </>
  )
}


export default StatisticsPage