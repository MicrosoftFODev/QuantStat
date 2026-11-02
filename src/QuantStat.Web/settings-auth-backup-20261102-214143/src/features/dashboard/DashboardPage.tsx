import {
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getDashboard,
  getMarkets,
} from '../../api/quantStatApi'

import type {
  DashboardResult,
  MarketMetadata,
} from '../../models/market'


function formatPercent(
  value: number,
): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}


function shortDate(
  value: string,
): string {
  return new Date(
    value,
  ).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    },
  )
}


function DashboardPage() {
  const [metadata, setMetadata] =
    useState<MarketMetadata | null>(
      null,
    )

  const [dashboard, setDashboard] =
    useState<DashboardResult | null>(
      null,
    )

  const [symbol, setSymbol] =
    useState(
    () =>
      localStorage.getItem(
        'quantstat-symbol',
      ) ?? 'ETHUSD',
  )

  const [interval, setInterval] =
    useState(
    () =>
      Number(
        localStorage.getItem(
          'quantstat-interval',
        ) ?? 1440,
      ),
  )

  const [periodDays, setPeriodDays] =
    useState(
    () =>
      Number(
        localStorage.getItem(
          'quantstat-period-days',
        ) ?? 365,
      ),
  )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(
      null,
    )



  useEffect(() => {
    localStorage.setItem(
      'quantstat-symbol',
      symbol,
    )

    localStorage.setItem(
      'quantstat-interval',
      interval.toString(),
    )

    localStorage.setItem(
      'quantstat-period-days',
      periodDays.toString(),
    )
  }, [
    symbol,
    interval,
    periodDays,
  ])
  useEffect(() => {
    const controller =
      new AbortController()

    getMarkets(
      controller.signal,
    )
      .then(result => {
        setMetadata(result)

        const ethereum =
          result.markets.find(
            market =>
              market.symbol ===
              'ETHUSD',
          )

        if (
          !ethereum &&
          result.markets.length > 0
        ) {
          setSymbol(
            result.markets[0].symbol,
          )
        }
      })
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
            : 'Market metadata could not be loaded.',
        )
      })

    return () =>
      controller.abort()
  }, [])


  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    getDashboard(
      symbol,
      interval,
      periodDays,
      controller.signal,
    )
      .then(setDashboard)
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
            : 'Dashboard could not be loaded.',
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


  const selectedMarket =
    metadata?.markets.find(
      market =>
        market.symbol === symbol,
    )


  const currency =
    selectedMarket?.quoteAsset ??
    'USD'


  const formatPrice =
    (value: number): string =>
      new Intl.NumberFormat(
        'en-US',
        {
          style: 'currency',
          currency,
          maximumFractionDigits:
            value >= 100
              ? 2
              : 6,
        },
      ).format(value)


  const chartData =
    useMemo(
      () =>
        dashboard?.points.map(
          point => ({
            ...point,
            chartDate:
              shortDate(
                point.date,
              ),
          }),
        ) ?? [],
      [dashboard],
    )


  return (
    <>

      <section className="page-heading">

        <div>
          <h1>
            Dashboard
          </h1>

          <p>
            Market overview and
            quantitative summary
          </p>
        </div>

      </section>


      <section className="filters">

        <label>
          Market

          <select
            value={symbol}
            onChange={event =>
              setSymbol(
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
              setInterval(
                Number(
                  event.target.value,
                ),
              )
            }
          >

            {(metadata?.intervals ?? [
              {
                name: '1 Day',
                minutes: 1440,
                isDefault: true,
              },
            ]).map(item => (

              <option
                key={item.minutes}
                value={item.minutes}
              >
                {item.name}
              </option>

            ))}

          </select>
        </label>


        <label>
          Period

          <select
            value={periodDays}
            onChange={event =>
              setPeriodDays(
                Number(
                  event.target.value,
                ),
              )
            }
          >

            {(metadata?.periods ?? [
              {
                name: '1 Year',
                days: 365,
                isDefault: true,
              },
            ]).map(item => (

              <option
                key={item.days}
                value={item.days}
              >
                {item.name}
              </option>

            ))}

          </select>
        </label>

      </section>


      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}


      {loading && !dashboard && (
        <div className="loading-card">
          Loading market data...
        </div>
      )}


      {dashboard && (
        <>

          <section className="metric-grid">

            <article className="metric-card">

              <span>
                Latest price
              </span>

              <strong>
                {formatPrice(
                  dashboard.latestPrice,
                )}
              </strong>

              <small>
                Latest completed close
              </small>

            </article>


            <article className="metric-card">

              <span>
                Price change
              </span>

              <strong
                className={
                  dashboard
                    .priceChangePercent >= 0
                    ? 'positive'
                    : 'negative'
                }
              >
                {formatPercent(
                  dashboard
                    .priceChangePercent,
                )}
              </strong>

              <small>
                {formatPrice(
                  dashboard.priceChange,
                )}
              </small>

            </article>


            <article className="metric-card">

              <span>
                Observations
              </span>

              <strong>
                {
                  dashboard
                    .observationCount
                }
              </strong>

              <small>
                Completed candles
              </small>

            </article>


            <article className="metric-card">

              <span>
                Annualized volatility
              </span>

              <strong>
                {(
                  dashboard
                    .annualizedVolatility *
                  100
                ).toFixed(2)}%
              </strong>

              <small>
                Based on log returns
              </small>

            </article>

          </section>


          <section className="chart-card">

            <div className="card-heading">

              <div>
                <h2>
                  Price
                </h2>

                <p>
                  {
                    selectedMarket
                      ?.displayName ??
                    symbol
                  }
                </p>
              </div>

              <div className="legend">

                <span className="price-key">
                  Price
                </span>

                <span className="mean-key">
                  Mean
                </span>

              </div>

            </div>


            <div className="chart-container">

              <ResponsiveContainer>

                <ComposedChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 18,
                    left: 8,
                    bottom: 0,
                  }}
                >

                  <CartesianGrid
                    stroke="var(--grid)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="chartDate"
                    minTickGap={40}
                    tick={{
                      fill: 'var(--muted)',
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    domain={[
                      'auto',
                      'auto',
                    ]}
                    tick={{
                      fill: 'var(--muted)',
                      fontSize: 11,
                    }}
                    width={75}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        'var(--tooltip)',
                      border:
                        '1px solid var(--border)',
                      borderRadius: 12,
                      color:
                        'var(--text)',
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#6c8cff"
                    strokeWidth={2.3}
                    dot={false}
                    name="Price"
                  />

                  <Line
                    type="linear"
                    dataKey="meanPrice"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="7 5"
                    dot={false}
                    name="Mean"
                  />

                </ComposedChart>

              </ResponsiveContainer>

            </div>

          </section>


          <section className="chart-card">

            <div className="card-heading">

              <div>
                <h2>
                  Wilder RSI
                </h2>

                <p>
                  14-period momentum
                  indicator
                </p>
              </div>


              <div className="rsi-value">
                {
                  dashboard.points
                    .at(-1)
                    ?.wilderRsi
                    ?.toFixed(2)
                  ??
                  '—'
                }
              </div>

            </div>


            <div className="chart-container rsi-chart">

              <ResponsiveContainer>

                <LineChart
                  data={chartData}
                >

                  <CartesianGrid
                    stroke="var(--grid)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="chartDate"
                    minTickGap={40}
                    tick={{
                      fill: 'var(--muted)',
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[
                      0,
                      30,
                      50,
                      70,
                      100,
                    ]}
                    width={45}
                  />

                  <Tooltip />

                  <ReferenceLine
                    y={70}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                  />

                  <ReferenceLine
                    y={30}
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                  />

                  <Line
                    type="monotone"
                    dataKey="wilderRsi"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="Wilder RSI"
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </section>

        </>
      )}

    </>
  )
}


export default DashboardPage
