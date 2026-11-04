import {
  usePreferences,
} from '../../preferences/PreferencesContext'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

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
  assetClassLabel,
  currentAssetClass,
  defaultSymbolForAssetClass,
  getDashboard,
  getMarkets,
} from '../../api/quantStatApi'

import type {
  AssetClass,
} from '../../api/quantStatApi'

import type {
  DashboardResult,
  MarketInstrument,
  MarketMetadata,
} from '../../models/market'


type MarketView =
  | 'all'
  | 'watchlist'


type SortKey =
  | 'displayName'
  | 'symbol'
  | 'baseAsset'


type SortDirection =
  | 'ascending'
  | 'descending'


interface WatchlistItem {
  assetClass: AssetClass
  symbol: string
}


const WATCHLIST_KEY =
  'quantstat-market-watchlist-v2'


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


function watchlistId(
  assetClass: AssetClass,
  symbol: string,
): string {
  return `${assetClass}:${symbol}`
}


function readWatchlist():
  WatchlistItem[] {
  try {
    const stored =
      localStorage.getItem(
        WATCHLIST_KEY,
      )

    if (!stored) {
      return []
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      item =>
        item &&
        (
          item.assetClass ===
            'stock' ||
          item.assetClass ===
            'crypto'
        ) &&
        typeof item.symbol ===
          'string',
    )
  }
  catch {
    return []
  }
}


type ChartTooltipPayload = {
  payload?: {
    date?: string
    price?: number
    meanPrice?: number
    wilderRsi?: number | null
  }
}


type MarketTooltipProps = {
  active?: boolean
  payload?: readonly ChartTooltipPayload[]
  symbol: string
  formatPrice: (value: number) => string
}


function PriceTooltip({
  active,
  payload,
  symbol,
  formatPrice,
}: MarketTooltipProps) {
  if (
    !active ||
    !payload?.length
  ) {
    return null
  }

  const point =
    payload[0]?.payload

  if (
    !point ||
    typeof point.price !== 'number'
  ) {
    return null
  }

  const differenceFromMean =
    typeof point.meanPrice === 'number' &&
    point.meanPrice !== 0
      ? (
          (
            point.price -
            point.meanPrice
          ) /
          point.meanPrice
        ) * 100
      : null

  return (
    <div className="qs-chart-tooltip">

      <div className="qs-tooltip-heading">
        <strong>
          {symbol}
        </strong>

        <span>
          {
            point.date
              ? new Date(
                  point.date,
                ).toLocaleDateString(
                  undefined,
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  },
                )
              : ''
          }
        </span>
      </div>


      <div className="qs-tooltip-row">
        <span>
          Price
        </span>

        <strong>
          {formatPrice(
            point.price,
          )}
        </strong>
      </div>


      {typeof point.meanPrice ===
        'number' && (
        <div className="qs-tooltip-row">
          <span>
            Mean
          </span>

          <strong>
            {formatPrice(
              point.meanPrice,
            )}
          </strong>
        </div>
      )}


      {differenceFromMean !==
        null && (
        <div className="qs-tooltip-row qs-tooltip-secondary">
          <span>
            vs Mean
          </span>

          <strong
            className={
              differenceFromMean >= 0
                ? 'positive'
                : 'negative'
            }
          >
            {
              differenceFromMean >= 0
                ? '+'
                : ''
            }
            {
              differenceFromMean
                .toFixed(2)
            }%
          </strong>
        </div>
      )}

    </div>
  )
}


function RsiTooltip({
  active,
  payload,
  symbol,
}: Omit<
  MarketTooltipProps,
  'formatPrice'
>) {
  if (
    !active ||
    !payload?.length
  ) {
    return null
  }

  const point =
    payload[0]?.payload

  const rsi =
    point?.wilderRsi

  if (
    typeof rsi !== 'number'
  ) {
    return null
  }

  const state =
    rsi >= 70
      ? 'Overbought'
      : rsi <= 30
        ? 'Oversold'
        : 'Neutral'

  const stateClass =
    rsi >= 70
      ? 'overbought'
      : rsi <= 30
        ? 'oversold'
        : 'neutral'

  return (
    <div className="qs-chart-tooltip">

      <div className="qs-tooltip-heading">
        <strong>
          {symbol}
        </strong>

        <span>
          {
            point?.date
              ? new Date(
                  point.date,
                ).toLocaleDateString(
                  undefined,
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  },
                )
              : ''
          }
        </span>
      </div>


      <div className="qs-tooltip-row">
        <span>
          Wilder RSI
        </span>

        <strong className="qs-rsi-value">
          {rsi.toFixed(2)}
        </strong>
      </div>


      <div className="qs-tooltip-row">
        <span>
          State
        </span>

        <strong
          className={`qs-rsi-state ${stateClass}`}
        >
          {state}
        </strong>
      </div>


      <div className="qs-tooltip-rsi-scale">

        <span className="oversold">
          30 Oversold
        </span>

        <span>
          50 Neutral
        </span>

        <span className="overbought">
          70 Overbought
        </span>

      </div>

    </div>
  )
}


function MarketsPage() {
  const {
    preferences,
  } =
    usePreferences()

  const [
    assetClass,
    setAssetClass,
  ] =
    useState<AssetClass>(
      () =>
        currentAssetClass(),
    )

  const [
    metadata,
    setMetadata,
  ] =
    useState<MarketMetadata | null>(
      null,
    )

  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardResult | null>(
      null,
    )

  const [
    symbol,
    setSymbol,
  ] =
    useState(
      () => {
        const storedAssetClass =
          currentAssetClass()

        const storedSymbol =
          localStorage.getItem(
            'quantstat-symbol',
          )

        if (
          storedAssetClass ===
            'stock' &&
          storedSymbol?.includes('/')
        ) {
          return 'AAPL'
        }

        if (
          storedAssetClass ===
            'crypto' &&
          !storedSymbol?.includes('/')
        ) {
          return 'BTC/USD'
        }

        return storedSymbol ??
          defaultSymbolForAssetClass(
            storedAssetClass,
          )
      },
    )

  const [
    interval,
    setInterval,
  ] =
    useState(
      () =>
        Number(
          localStorage.getItem(
            'quantstat-interval',
          ) ?? 1440,
        ),
    )

  const [
    periodDays,
    setPeriodDays,
  ] =
    useState(
      () =>
        Number(
          localStorage.getItem(
            'quantstat-period-days',
          ) ?? 365,
        ),
    )

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    view,
    setView,
  ] =
    useState<MarketView>(
      'all',
    )

  const [
    sortKey,
    setSortKey,
  ] =
    useState<SortKey>(
      'displayName',
    )

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<SortDirection>(
      'ascending',
    )

  const [
    browserOpen,
    setBrowserOpen,
  ] =
    useState(false)

  const [
    loadingMetadata,
    setLoadingMetadata,
  ] =
    useState(true)

  const [
    loadingDashboard,
    setLoadingDashboard,
  ] =
    useState(true)

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    watchlist,
    setWatchlist,
  ] =
    useState<WatchlistItem[]>(
      () =>
        readWatchlist(),
    )


  useEffect(() => {
    localStorage.setItem(
      'quantstat-asset-class',
      assetClass,
    )

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

    localStorage.setItem(
      WATCHLIST_KEY,
      JSON.stringify(
        watchlist,
      ),
    )
  }, [
    assetClass,
    symbol,
    interval,
    periodDays,
    watchlist,
  ])


  useEffect(() => {
    const controller =
      new AbortController()

    setLoadingMetadata(true)
    setError(null)

    getMarkets(
      controller.signal,
      assetClass,
    )
      .then(result => {
        setMetadata(result)

        const symbolIsValid =
          result.markets.some(
            market =>
              market.symbol ===
              symbol,
          )

        if (
          !symbolIsValid &&
          result.markets.length > 0
        ) {
          const preferredSymbol =
            defaultSymbolForAssetClass(
              assetClass,
            )

          const preferredMarket =
            result.markets.find(
              market =>
                market.symbol ===
                preferredSymbol,
            )

          setSymbol(
            preferredMarket?.symbol ??
            result.markets[0].symbol,
          )
        }

        const intervalIsValid =
          result.intervals.some(
            item =>
              item.minutes ===
              interval,
          )

        if (
          !intervalIsValid &&
          result.intervals.length > 0
        ) {
          const defaultInterval =
            result.intervals.find(
              item =>
                item.isDefault,
            ) ??
            result.intervals[0]

          setInterval(
            defaultInterval.minutes,
          )
        }
      })
      .catch(
        (reason: unknown) => {
          if (
            reason instanceof
              DOMException &&
            reason.name ===
              'AbortError'
          ) {
            return
          }

          setMetadata(null)

          setError(
            reason instanceof Error
              ? reason.message
              : 'Markets could not be loaded.',
          )
        },
      )
      .finally(() => {
        if (
          !controller.signal.aborted
        ) {
          setLoadingMetadata(false)
        }
      })

    return () =>
      controller.abort()
  }, [
    assetClass,
    refreshKey,
  ])


  useEffect(() => {
    const controller =
      new AbortController()

    setLoadingDashboard(true)
    setError(null)

    getDashboard(
      symbol,
      interval,
      periodDays,
      controller.signal,
      assetClass,
    )
      .then(setDashboard)
      .catch(
        (reason: unknown) => {
          if (
            reason instanceof
              DOMException &&
            reason.name ===
              'AbortError'
          ) {
            return
          }

          setDashboard(null)

          setError(
            reason instanceof Error
              ? reason.message
              : 'Market analysis could not be loaded.',
          )
        },
      )
      .finally(() => {
        if (
          !controller.signal.aborted
        ) {
          setLoadingDashboard(false)
        }
      })

    return () =>
      controller.abort()
  }, [
    assetClass,
    symbol,
    interval,
    periodDays,
    refreshKey,
  ])


  const selectedMarket =
    metadata?.markets.find(
      market =>
        market.symbol ===
        symbol,
    )


  const currency =
    selectedMarket?.quoteAsset ??
    preferences.currency ??
    'USD'


  const formatPrice =
    (value: number): string =>
      new Intl.NumberFormat(
        'en-US',
        {
          style: 'currency',
          currency:
            currency === 'BTC' ||
            currency === 'ETH'
              ? 'USD'
              : currency,
          maximumFractionDigits:
            value >= 100
              ? 2
              : 6,
        },
      ).format(value)


  const watchlistIds =
    useMemo(
      () =>
        new Set(
          watchlist.map(
            item =>
              watchlistId(
                item.assetClass,
                item.symbol,
              ),
          ),
        ),
      [watchlist],
    )


  const visibleMarkets =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toUpperCase()

      const filtered =
        (
          metadata?.markets ??
          []
        ).filter(
          market => {
            const matchesSearch =
              !normalizedSearch ||
              market.symbol
                .toUpperCase()
                .includes(
                  normalizedSearch,
                ) ||
              market.displayName
                .toUpperCase()
                .includes(
                  normalizedSearch,
                ) ||
              market.baseAsset
                .toUpperCase()
                .includes(
                  normalizedSearch,
                )

            const matchesView =
              view === 'all' ||
              watchlistIds.has(
                watchlistId(
                  assetClass,
                  market.symbol,
                ),
              )

            return (
              matchesSearch &&
              matchesView
            )
          },
        )

      return [...filtered].sort(
        (left, right) => {
          const comparison =
            left[sortKey]
              .localeCompare(
                right[sortKey],
                undefined,
                {
                  sensitivity:
                    'base',
                },
              )

          return sortDirection ===
            'ascending'
              ? comparison
              : -comparison
        },
      )
    }, [
      assetClass,
      metadata,
      search,
      sortDirection,
      sortKey,
      view,
      watchlistIds,
    ])


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


  function changeAssetClass(
    nextAssetClass:
      AssetClass,
  ): void {
    if (
      nextAssetClass ===
      assetClass
    ) {
      return
    }

    const nextSymbol =
      defaultSymbolForAssetClass(
        nextAssetClass,
      )

    setAssetClass(
      nextAssetClass,
    )

    setSymbol(
      nextSymbol,
    )

    setInterval(
      1440,
    )

    setMetadata(null)
    setDashboard(null)
    setSearch('')
    setView('all')
    setError(null)

    localStorage.removeItem(
      'quantstat-provider',
    )

    window.dispatchEvent(
      new CustomEvent(
        'quantstat-market-selection-changed',
        {
          detail: {
            assetClass:
              nextAssetClass,

            symbol:
              nextSymbol,
          },
        },
      ),
    )
  }


  function selectMarket(
    market:
      MarketInstrument,
  ): void {
    setSymbol(
      market.symbol,
    )

    setBrowserOpen(
      false,
    )

    window.dispatchEvent(
      new CustomEvent(
        'quantstat-market-selection-changed',
        {
          detail: {
            assetClass,

            symbol:
              market.symbol,
          },
        },
      ),
    )
  }


  function toggleWatchlist(
    market:
      MarketInstrument,
  ): void {
    const id =
      watchlistId(
        assetClass,
        market.symbol,
      )

    setWatchlist(
      current =>
        current.some(
          item =>
            watchlistId(
              item.assetClass,
              item.symbol,
            ) === id,
        )
          ? current.filter(
              item =>
                watchlistId(
                  item.assetClass,
                  item.symbol,
                ) !== id,
            )
          : [
              ...current,
              {
                assetClass,
                symbol:
                  market.symbol,
              },
            ],
    )
  }


  function changeSort(
    nextKey:
      SortKey,
  ): void {
    if (
      nextKey ===
      sortKey
    ) {
      setSortDirection(
        current =>
          current ===
            'ascending'
            ? 'descending'
            : 'ascending',
      )

      return
    }

    setSortKey(
      nextKey,
    )

    setSortDirection(
      'ascending',
    )
  }


  function sortIcon(
    key:
      SortKey,
  ) {
    if (sortKey !== key) {
      return (
        <ArrowUpDown
          size={13}
        />
      )
    }

    return sortDirection ===
      'ascending'
        ? (
          <ArrowUp
            size={13}
          />
        )
        : (
          <ArrowDown
            size={13}
          />
        )
  }


  return (
    <>

      <section className="page-heading markets-heading">

        <div>
          <h1>
            Markets
          </h1>

          <p>
            Discover and analyze stocks
            and cryptocurrencies with
            Alpaca market data.
          </p>

          <small>
            Alpaca · {
              assetClassLabel(
                assetClass,
              )
            }
          </small>
        </div>


        <button
          className="market-refresh-button"
          type="button"
          disabled={
            loadingMetadata ||
            loadingDashboard
          }
          onClick={() =>
            setRefreshKey(
              current =>
                current + 1,
            )
          }
        >
          <RefreshCw
            size={16}
            className={
              loadingMetadata ||
              loadingDashboard
                ? 'spinning'
                : undefined
            }
          />

          Refresh
        </button>

      </section>


      <section className="filters unified-market-filters">

        <label>
          Asset class

          <select
            value={assetClass}
            onChange={event =>
              changeAssetClass(
                event.target.value as AssetClass
              )
            }
          >
            <option value="stock">
              Stocks
            </option>

            <option value="crypto">
              Crypto
            </option>
          </select>
        </label>


        <label>
          Instrument

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
              <option value={symbol}>
                {symbol}
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
            ]).map(
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
            ]).map(
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


      <section className="unified-market-browser-toggle">

        <button
          type="button"
          onClick={() =>
            setBrowserOpen(
              current =>
                !current,
            )
          }
        >
          <Search size={16} />

          Browse instruments

          {browserOpen
            ? (
              <ChevronUp
                size={16}
              />
            )
            : (
              <ChevronDown
                size={16}
              />
            )}
        </button>

        <span>
          {
            watchlist.filter(
              item =>
                item.assetClass ===
                assetClass,
            ).length
          }
          {' '}
          watchlist instruments
        </span>

      </section>


      {browserOpen && (
        <section className="unified-market-browser">

          <div className="market-v2-toolbar">

            <label className="market-v2-search">
              <span>
                Search instruments
              </span>

              <div>
                <Search size={17} />

                <input
                  type="search"
                  value={search}
                  placeholder={
                    assetClass ===
                      'stock'
                      ? 'AAPL, Microsoft, NVIDIA...'
                      : 'BTC, ETH, SOL...'
                  }
                  onChange={event =>
                    setSearch(
                      event.target.value,
                    )
                  }
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch('')
                    }
                  >
                    Clear
                  </button>
                )}
              </div>
            </label>

          </div>


          <div className="market-v2-tabs">

            <button
              type="button"
              className={
                view === 'all'
                  ? 'active'
                  : undefined
              }
              onClick={() =>
                setView('all')
              }
            >
              All instruments

              <span>
                {
                  metadata
                    ?.markets
                    .length ?? 0
                }
              </span>
            </button>


            <button
              type="button"
              className={
                view === 'watchlist'
                  ? 'active'
                  : undefined
              }
              onClick={() =>
                setView(
                  'watchlist',
                )
              }
            >
              <Star size={14} />

              Watchlist
            </button>

          </div>


          <div className="markets-table-scroll">

            <table className="markets-table market-v2-table">

              <thead>
                <tr>
                  <th className="market-watch-column">
                    Watch
                  </th>

                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        changeSort(
                          'displayName',
                        )
                      }
                    >
                      Instrument
                      {sortIcon(
                        'displayName',
                      )}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        changeSort(
                          'symbol',
                        )
                      }
                    >
                      Symbol
                      {sortIcon(
                        'symbol',
                      )}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        changeSort(
                          'baseAsset',
                        )
                      }
                    >
                      Asset
                      {sortIcon(
                        'baseAsset',
                      )}
                    </button>
                  </th>

                  <th>
                    Status
                  </th>

                  <th className="market-action-column">
                    Selection
                  </th>
                </tr>
              </thead>


              <tbody>

                {visibleMarkets.map(
                  market => {
                    const active =
                      market.symbol ===
                      symbol

                    const watched =
                      watchlistIds.has(
                        watchlistId(
                          assetClass,
                          market.symbol,
                        ),
                      )

                    return (
                      <tr
                        key={market.symbol}
                        className={
                          active
                            ? 'active-market-row'
                            : undefined
                        }
                      >

                        <td className="market-watch-column">
                          <button
                            type="button"
                            className={
                              watched
                                ? 'market-watch-button active'
                                : 'market-watch-button'
                            }
                            onClick={() =>
                              toggleWatchlist(
                                market,
                              )
                            }
                          >
                            <Star
                              size={16}
                              fill={
                                watched
                                  ? 'currentColor'
                                  : 'none'
                              }
                            />
                          </button>
                        </td>


                        <td>
                          <div className="market-name-cell">

                            <div className="market-avatar">
                              {
                                market
                                  .baseAsset
                                  .slice(0, 2)
                              }
                            </div>

                            <div>
                              <strong>
                                {market.displayName}
                              </strong>

                              <small>
                                {assetClassLabel(
                                  assetClass,
                                )}
                              </small>
                            </div>

                          </div>
                        </td>


                        <td className="market-code">
                          {market.symbol}
                        </td>


                        <td>
                          {market.baseAsset}
                        </td>


                        <td>
                          {active ? (
                            <span className="market-active-status">
                              <CheckCircle2 size={14} />
                              Active
                            </span>
                          ) : (
                            <span className="market-available-status">
                              Available
                            </span>
                          )}
                        </td>


                        <td className="market-action-column">
                          <button
                            type="button"
                            className="market-analyze-button"
                            disabled={active}
                            onClick={() =>
                              selectMarket(
                                market,
                              )
                            }
                          >
                            {active
                              ? 'Selected'
                              : 'Select'}
                          </button>
                        </td>

                      </tr>
                    )
                  },
                )}


                {visibleMarkets.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="empty-market-result"
                    >
                      No instruments match
                      the current criteria.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}


      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}


      {loadingDashboard &&
      !dashboard ? (
        <div className="loading-card">
          Loading {
            assetClassLabel(
              assetClass,
            ).toLowerCase()
          } analysis...
        </div>
      ) : dashboard && (
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
                Completed bars
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
                      fill:
                        'var(--muted)',
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    domain={[
                      'auto',
                      'auto',
                    ]}
                    width={75}
                    tick={{
                      fill:
                        'var(--muted)',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      stroke:
                        'var(--muted)',
                      strokeWidth: 1,
                      strokeDasharray:
                        '4 4',
                    }}
                    content={props => (
                      <PriceTooltip
                        active={
                          props.active
                        }
                        payload={
                          props.payload as readonly ChartTooltipPayload[]
                        }
                        symbol={symbol}
                        formatPrice={
                          formatPrice
                        }
                      />
                    )}
                  />

                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#6c8cff"
                    strokeWidth={2.3}
                    dot={false}
                    activeDot={false}
                    name="Price"
                  />

                  <Line
                    type="linear"
                    dataKey="meanPrice"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="7 5"
                    dot={false}
                    activeDot={false}
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
                      fill:
                        'var(--muted)',
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

                  <Tooltip
                    cursor={{
                      stroke:
                        'var(--muted)',
                      strokeWidth: 1,
                      strokeDasharray:
                        '4 4',
                    }}
                    content={props => (
                      <RsiTooltip
                        active={
                          props.active
                        }
                        payload={
                          props.payload as readonly ChartTooltipPayload[]
                        }
                        symbol={symbol}
                      />
                    )}
                  />

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
                    activeDot={false}
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


export default MarketsPage
