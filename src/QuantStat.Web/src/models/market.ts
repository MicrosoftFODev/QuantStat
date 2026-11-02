export interface MarketInstrument {
  symbol: string
  baseAsset: string
  quoteAsset: string
  displayName: string
  provider: string
}

export interface MarketInterval {
  name: string
  minutes: number
  isDefault: boolean
}

export interface MarketPeriod {
  name: string
  days: number
  isDefault: boolean
}

export interface MarketMetadata {
  markets: MarketInstrument[]
  intervals: MarketInterval[]
  periods: MarketPeriod[]
  quoteCurrencies: string[]
}

export interface DashboardPoint {
  date: string
  price: number
  meanPrice: number
  wilderRsi: number | null
  cutlerRsi: number | null
  exponentialRsi: number | null
  stochasticRsi: number | null
  connorsRsi: number | null
}

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

export interface DashboardResult {
  symbol: string
  intervalMinutes: number
  periodDays: number
  latestPrice: number
  previousPrice: number
  priceChange: number
  priceChangePercent: number
  observationCount: number
  meanPrice: number
  annualizedVolatility: number
  statistics: StatisticsResult
  points: DashboardPoint[]
}
