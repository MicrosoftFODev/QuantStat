import type {
  DashboardResult,
  MarketMetadata,
} from '../models/market'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:5094'

async function request<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(
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
      const body = await response.json()

      if (body.error) {
        message = body.error
      }
    } catch {
      // Keep the default status message.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function getMarkets(
  signal?: AbortSignal,
): Promise<MarketMetadata> {
  return request<MarketMetadata>(
    '/api/markets',
    signal,
  )
}

export function getDashboard(
  symbol: string,
  interval: number,
  periodDays: number,
  signal?: AbortSignal,
): Promise<DashboardResult> {
  const query = new URLSearchParams({
    symbol,
    interval: interval.toString(),
    periodDays: periodDays.toString(),
  })

  return request<DashboardResult>(
    `/api/dashboard?${query.toString()}`,
    signal,
  )
}
