import type {
  DashboardResult,
  MarketMetadata,
} from '../models/market'


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:5094'


export type AssetClass =
  | 'stock'
  | 'crypto'


export function currentAssetClass():
  AssetClass {
  return localStorage.getItem(
    'quantstat-asset-class',
  ) === 'crypto'
    ? 'crypto'
    : 'stock'
}


export function assetClassLabel(
  assetClass: AssetClass,
): string {
  return assetClass === 'crypto'
    ? 'Crypto'
    : 'Stocks'
}


export function defaultSymbolForAssetClass(
  assetClass: AssetClass,
): string {
  return assetClass === 'crypto'
    ? 'BTC/USD'
    : 'AAPL'
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
          Accept:
            'application/json',
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
      // Keep default message.
    }

    throw new Error(
      message,
    )
  }

  return response.json() as Promise<T>
}


export function getMarkets(
  signal?: AbortSignal,
  assetClass:
    AssetClass =
      currentAssetClass(),
): Promise<MarketMetadata> {
  const query =
    new URLSearchParams({
      assetClass,
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
  assetClass:
    AssetClass =
      currentAssetClass(),
): Promise<DashboardResult> {
  const query =
    new URLSearchParams({
      assetClass,
      symbol,
      interval:
        interval.toString(),
      periodDays:
        periodDays.toString(),
    })

  return request<DashboardResult>(
    `/api/dashboard?${query.toString()}`,
    signal,
  )
}
