export type AssetClass =
  | 'stock'
  | 'crypto'


export interface SimulationSelection {
  assetClass: AssetClass
  symbol: string
  interval: number
  periodDays: number
}


export interface SimulationTrade {
  index: number
  date: string
  price: number
  amount: number
  quantity: number
  signalDate?: string
  signalValue?: number
}


export interface EquityPoint {
  date: string
  price: number
  accumulatedQuantity: number
  investedCapital: number
  cash: number
  holdingsValue: number
  wealth: number
  drawdownPercent: number
}


export interface EquityAnalytics {
  equityCurve: EquityPoint[]
  maxDrawdownPercent: number
  capitalUtilizationPercent: number
}


export interface SimulationResult {
  seed: number
  requestedPurchases: number
  executedPurchases: number
  amountPerPurchase: number
  startingBudget: number
  investedCapital: number
  unusedCash: number
  totalQuantity: number
  averageEntryPrice: number
  finalPrice: number
  holdingsValue: number
  finalWealth: number
  pnl: number
  returnPercent: number
  trades: SimulationTrade[]
}
