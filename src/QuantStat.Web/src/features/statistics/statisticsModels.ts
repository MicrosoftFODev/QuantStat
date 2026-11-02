export interface StatisticsResult {
  observationCount: number
  meanPrice: number
  minimumPrice: number
  maximumPrice: number

  meanLogReturn: number
  returnVariance: number
  returnStandardDeviation: number
  annualizedVolatility: number

  quantile05: number
  quantile10: number
  quantile90: number
  quantile95: number

  skewness: number
  excessKurtosis: number
}

export interface StatisticsResponse {
  provider: string
  symbol: string
  intervalMinutes: number
  periodDays: number
  result: StatisticsResult
}