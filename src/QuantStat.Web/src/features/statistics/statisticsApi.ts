import {
  currentProvider,
} from '../../api/quantStatApi'

import type {
  MarketProvider,
} from '../../api/quantStatApi'

import type {
  StatisticsResponse,
} from './statisticsModels'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:5094'

export async function getStatistics(
  symbol: string,
  interval: number,
  periodDays: number,
  signal?: AbortSignal,
  provider: MarketProvider =
    currentProvider(),
): Promise<StatisticsResponse> {
  const query =
    new URLSearchParams({
      provider,
      symbol,
      interval: interval.toString(),
      periodDays: periodDays.toString(),
    })

  const response =
    await fetch(
      `${API_BASE_URL}/api/statistics?${query.toString()}`,
      {
        signal,
        headers: {
          Accept: 'application/json',
        },
      },
    )

  if (!response.ok) {
    let message =
      `Statistics request failed (${response.status}).`

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

  return response.json()
}
