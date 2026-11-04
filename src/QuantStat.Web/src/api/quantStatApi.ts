import type {
  DashboardResult,
  MarketMetadata,
} from '../models/market'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:5094'

export type MarketProvider =
  | 'kraken'
  | 'coinbase'

export function currentProvider(): MarketProvider {
  return localStorage.getItem(
    'quantstat-provider',
  ) === 'coinbase'
    ? 'coinbase'
    : 'kraken'
}

export function providerLabel(
  provider: MarketProvider,
): string {
  return provider === 'coinbase'
    ? 'Coinbase'
    : 'Kraken'
}

export function defaultSymbolForProvider(
  provider: MarketProvider,
): string {
  return provider === 'coinbase'
    ? 'ETH-USD'
    : 'ETHUSD'
}

async function request<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        signal,
        headers: {
          Accept: 'application/json',
        },
      },
    )

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}.`

    try {
      const body =
        await response.json()

      message =
        body.error ??
        body.detail ??
        body.title ??
        message
    }
    catch {
      // Keep default.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function getMarkets(
  signal?: AbortSignal,
  provider: MarketProvider =
    currentProvider(),
): Promise<MarketMetadata> {
  const query =
    new URLSearchParams({
      provider,
    })

  return request<MarketMetadata>(
    `/api/markets?${query.toString()}`,
    signal,
  )
}

export function getDashboard(
  symbol: string,
  interval: number,
  periodDays: number,
  signal?: AbortSignal,
  provider: MarketProvider =
    currentProvider(),
): Promise<DashboardResult> {
  const query =
    new URLSearchParams({
      provider,
      symbol,
      interval: interval.toString(),
      periodDays: periodDays.toString(),
    })

  return request<DashboardResult>(
    `/api/dashboard?${query.toString()}`,
    signal,
  )
}
