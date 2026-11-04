import {
  usePreferences,
} from '../../preferences/PreferencesContext'

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Database,
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
  useNavigate,
} from 'react-router-dom'

import {
  currentProvider,
  defaultSymbolForProvider,
  getMarkets,
  providerLabel,
} from '../../api/quantStatApi'

import type {
  MarketProvider,
} from '../../api/quantStatApi'

import type {
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
  | 'quoteAsset'
  | 'provider'


type SortDirection =
  | 'ascending'
  | 'descending'


interface WatchlistItem {
  provider: MarketProvider
  symbol: string
}


const WATCHLIST_KEY =
  'quantstat-market-watchlist'


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
          item.provider ===
            'kraken' ||
          item.provider ===
            'coinbase'
        ) &&
        typeof item.symbol ===
          'string',
    )
  }
  catch {
    return []
  }
}


function watchlistId(
  provider: MarketProvider,
  symbol: string,
): string {
  return `${provider}:${symbol}`
}


function MarketsPage() {
  const navigate =
    useNavigate()

  const {
    preferences,
  } =
    usePreferences()

  const [
    provider,
    setProvider,
  ] =
    useState<MarketProvider>(
      () =>
        currentProvider(),
    )

  const [
    metadata,
    setMetadata,
  ] =
    useState<MarketMetadata | null>(
      null,
    )

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    selectedQuote,
    setSelectedQuote,
  ] =
    useState<string>(
      preferences.currency,
    )

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
    loading,
    setLoading,
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


  const selectedSymbol =
    localStorage.getItem(
      'quantstat-symbol',
    ) ??
    defaultSymbolForProvider(
      provider,
    )


  useEffect(() => {
    localStorage.setItem(
      WATCHLIST_KEY,
      JSON.stringify(
        watchlist,
      ),
    )
  }, [
    watchlist,
  ])


  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    getMarkets(
      controller.signal,
      provider,
    )
      .then(result => {
        setMetadata(result)

        const preferredQuoteExists =
          result.quoteCurrencies
            .includes(
              preferences.currency,
            )

        setSelectedQuote(
          preferredQuoteExists
            ? preferences.currency
            : 'all',
        )
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
          !controller.signal
            .aborted
        ) {
          setLoading(false)
        }
      })

    return () =>
      controller.abort()
  }, [
    provider,
    refreshKey,
    preferences.currency,
  ])


  const watchlistIds =
    useMemo(
      () =>
        new Set(
          watchlist.map(
            item =>
              watchlistId(
                item.provider,
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

      const markets =
        metadata?.markets ?? []

      const filtered =
        markets.filter(
          market => {
            const matchesQuote =
              selectedQuote ===
                'all' ||
              market.quoteAsset ===
                selectedQuote

            const matchesSearch =
              normalizedSearch
                .length === 0 ||
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
                ) ||
              market.quoteAsset
                .toUpperCase()
                .includes(
                  normalizedSearch,
                )

            const matchesView =
              view === 'all' ||
              watchlistIds.has(
                watchlistId(
                  provider,
                  market.symbol,
                ),
              )

            return (
              matchesQuote &&
              matchesSearch &&
              matchesView
            )
          },
        )

      return [...filtered].sort(
        (left, right) => {
          const leftValue =
            left[sortKey] ??
            ''

          const rightValue =
            right[sortKey] ??
            ''

          const comparison =
            String(leftValue)
              .localeCompare(
                String(rightValue),
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
      metadata,
      provider,
      search,
      selectedQuote,
      sortDirection,
      sortKey,
      view,
      watchlistIds,
    ])


  const uniqueBaseAssets =
    useMemo(
      () =>
        new Set(
          metadata?.markets.map(
            market =>
              market.baseAsset,
          ) ?? [],
        ).size,
      [metadata],
    )


  const providerWatchlistCount =
    useMemo(
      () =>
        watchlist.filter(
          item =>
            item.provider ===
            provider,
        ).length,
      [
        provider,
        watchlist,
      ],
    )


  const activeMarket =
    metadata?.markets.find(
      market =>
        market.symbol ===
        selectedSymbol,
    )


  function changeProvider(
    nextProvider:
      MarketProvider,
  ): void {
    if (
      nextProvider ===
      provider
    ) {
      return
    }

    const nextSymbol =
      defaultSymbolForProvider(
        nextProvider,
      )

    setProvider(
      nextProvider,
    )

    setMetadata(null)
    setSearch('')
    setView('all')
    setLoading(true)
    setError(null)

    localStorage.setItem(
      'quantstat-provider',
      nextProvider,
    )

    localStorage.setItem(
      'quantstat-symbol',
      nextSymbol,
    )

    localStorage.setItem(
      'quantstat-interval',
      '1440',
    )

    window.dispatchEvent(
      new CustomEvent(
        'quantstat-market-selection-changed',
        {
          detail: {
            provider:
              nextProvider,

            symbol:
              nextSymbol,
          },
        },
      ),
    )
  }


  function toggleWatchlist(
    market: MarketInstrument,
  ): void {
    const id =
      watchlistId(
        provider,
        market.symbol,
      )

    setWatchlist(
      current =>
        current.some(
          item =>
            watchlistId(
              item.provider,
              item.symbol,
            ) === id,
        )
          ? current.filter(
              item =>
                watchlistId(
                  item.provider,
                  item.symbol,
                ) !== id,
            )
          : [
              ...current,
              {
                provider,
                symbol:
                  market.symbol,
              },
            ],
    )
  }


  function analyzeMarket(
    market: MarketInstrument,
  ): void {
    localStorage.setItem(
      'quantstat-provider',
      provider,
    )

    localStorage.setItem(
      'quantstat-symbol',
      market.symbol,
    )

    const validInterval =
      metadata?.intervals.some(
        item =>
          item.minutes ===
            Number(
              localStorage.getItem(
                'quantstat-interval',
              ) ?? 1440,
            ),
      )

    if (!validInterval) {
      const defaultInterval =
        metadata?.intervals.find(
          item =>
            item.isDefault,
        )
        ??
        metadata?.intervals[0]

      localStorage.setItem(
        'quantstat-interval',
        (
          defaultInterval
            ?.minutes ??
          1440
        ).toString(),
      )
    }

    window.dispatchEvent(
      new CustomEvent(
        'quantstat-market-selection-changed',
        {
          detail: {
            provider,

            symbol:
              market.symbol,
          },
        },
      ),
    )

    navigate(
      '/dashboard',
    )
  }


  function changeSort(
    nextKey: SortKey,
  ): void {
    if (
      nextKey === sortKey
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
    key: SortKey,
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


  function marketIsActive(
    market: MarketInstrument,
  ): boolean {
    return (
      currentProvider() ===
        provider &&
      market.symbol ===
        selectedSymbol
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
            Discover, organize, and analyze
            available financial instruments.
          </p>
        </div>


        <button
          className="market-refresh-button"
          type="button"
          disabled={loading}
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
              loading
                ? 'spinning'
                : undefined
            }
          />

          Refresh
        </button>

      </section>


      <section className="market-summary-grid">

        <article className="market-summary-card">
          <span>
            Provider
          </span>

          <strong>
            {providerLabel(provider)}
          </strong>

          <small>
            Active market-data source
          </small>
        </article>


        <article className="market-summary-card">
          <span>
            Markets
          </span>

          <strong>
            {metadata?.markets.length ?? '—'}
          </strong>

          <small>
            Available instruments
          </small>
        </article>


        <article className="market-summary-card">
          <span>
            Base assets
          </span>

          <strong>
            {
              metadata
                ? uniqueBaseAssets
                : '—'
            }
          </strong>

          <small>
            Distinct analyzed assets
          </small>
        </article>


        <article className="market-summary-card active-market-card">
          <span>
            Watchlist
          </span>

          <strong>
            {providerWatchlistCount}
          </strong>

          <small>
            Saved for {providerLabel(provider)}
          </small>
        </article>

      </section>


      <section className="market-v2-toolbar">

        <label className="market-v2-field">
          <span>
            Provider
          </span>

          <select
            value={provider}
            onChange={event =>
              changeProvider(
                event.target.value as MarketProvider
              )
            }
          >
            <option value="kraken">
              Kraken
            </option>

            <option value="coinbase">
              Coinbase
            </option>
          </select>
        </label>


        <label className="market-v2-field">
          <span>
            Quote currency
          </span>

          <select
            value={selectedQuote}
            onChange={event =>
              setSelectedQuote(
                event.target.value,
              )
            }
          >
            <option value="all">
              All quotes
            </option>

            {metadata
              ?.quoteCurrencies
              .map(
                quote => (
                  <option
                    key={quote}
                    value={quote}
                  >
                    {quote}
                  </option>
                ),
              )}
          </select>
        </label>


        <label className="market-v2-search">
          <span>
            Search markets
          </span>

          <div>
            <Search size={17} />

            <input
              type="search"
              value={search}
              placeholder="Symbol, asset, or pair..."
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

      </section>


      <section className="market-v2-tabs">

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
          All markets

          <span>
            {metadata?.markets.length ?? 0}
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
            setView('watchlist')
          }
        >
          <Star size={14} />

          Watchlist

          <span>
            {providerWatchlistCount}
          </span>
        </button>

      </section>


      {error && (
        <section className="market-v2-error">

          <div>
            <strong>
              {providerLabel(provider)}
              {' '}
              is unavailable
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                current =>
                  current + 1,
              )
            }
          >
            Retry
          </button>

        </section>
      )}


      {loading && !metadata ? (
        <div className="loading-card">
          Loading {
            providerLabel(provider)
          } markets...
        </div>
      ) : (
        <section className="markets-table-card">

          <div className="markets-table-header">

            <div>
              <h2>
                Available instruments
              </h2>

              <p>
                Showing {
                  visibleMarkets.length
                } of {
                  metadata?.markets.length ?? 0
                } markets
              </p>
            </div>


            <div className="provider-badge">
              <Database size={13} />

              {providerLabel(provider)}
            </div>

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
                      Market
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
                      Base
                      {sortIcon(
                        'baseAsset',
                      )}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        changeSort(
                          'quoteAsset',
                        )
                      }
                    >
                      Quote
                      {sortIcon(
                        'quoteAsset',
                      )}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        changeSort(
                          'provider',
                        )
                      }
                    >
                      Provider
                      {sortIcon(
                        'provider',
                      )}
                    </button>
                  </th>

                  <th>
                    Status
                  </th>

                  <th className="market-action-column">
                    Action
                  </th>
                </tr>
              </thead>


              <tbody>

                {visibleMarkets.map(
                  market => {
                    const active =
                      marketIsActive(
                        market,
                      )

                    const watched =
                      watchlistIds.has(
                        watchlistId(
                          provider,
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
                            title={
                              watched
                                ? 'Remove from watchlist'
                                : 'Add to watchlist'
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

                              {active && (
                                <small>
                                  Dashboard selection
                                </small>
                              )}
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
                          <span className="quote-pill">
                            {market.quoteAsset}
                          </span>
                        </td>


                        <td>
                          {market.provider}
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
                            onClick={() =>
                              analyzeMarket(
                                market,
                              )
                            }
                          >
                            Analyze
                            <ArrowRight size={14} />
                          </button>
                        </td>

                      </tr>
                    )
                  },
                )}


                {visibleMarkets.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="empty-market-result"
                    >
                      <strong>
                        {
                          view === 'watchlist'
                            ? 'Your watchlist is empty.'
                            : search
                              ? `No markets match "${search}".`
                              : `No ${selectedQuote === 'all' ? '' : `${selectedQuote} `}markets are available.`
                        }
                      </strong>

                      <small>
                        {
                          view === 'watchlist'
                            ? 'Star an instrument to save it here.'
                            : 'Try clearing the search or changing the quote currency.'
                        }
                      </small>
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>


          <footer className="markets-footer">

            <span>
              Select Analyze to open the
              instrument in Dashboard.
            </span>

            <strong>
              Active:
              {' '}
              {
                activeMarket
                  ?.displayName ??
                selectedSymbol
              }
            </strong>

          </footer>

        </section>
      )}

    </>
  )
}


export default MarketsPage
