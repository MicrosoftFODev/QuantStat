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


export type SimulationStrategyId =
  | 'random'
  | 'dca'
  | 'rsi'
  | 'lumpSum'


export interface MonteCarloParameters {
  runCount: number
  masterSeed: number
  amountPerPurchase: number
  requestedPurchases: number

  rsiType:
    | 'wilder'
    | 'cutler'
    | 'exponential'

  rsiPeriod: number
  rsiThreshold: number
}


export interface MonteCarloStrategyOutcome {
  strategyId: SimulationStrategyId
  strategyName: string
  finalWealth: number
  returnPercent: number
  maxDrawdownPercent: number
}


export interface MonteCarloRun {
  runNumber: number
  windowSeed: number
  randomBuySeed: number
  windowStartIndex: number
  windowEndIndex: number
  windowStartDate: string
  windowEndDate: string
  outcomes: MonteCarloStrategyOutcome[]
  winnerIds: SimulationStrategyId[]
  winningMargin: number
}


export interface MonteCarloDistributionSummary {
  mean: number
  median: number
  standardDeviation: number
  minimum: number
  percentile05: number
  percentile25: number
  percentile75: number
  percentile95: number
  maximum: number
}


export interface MonteCarloStrategySummary {
  strategyId: SimulationStrategyId
  strategyName: string
  wins: number
  ties: number
  winRatePercent: number
  tieRatePercent: number
  wilsonLowerPercent: number
  wilsonUpperPercent: number
  lossProbabilityPercent: number
  finalWealth:
    MonteCarloDistributionSummary
  returns:
    MonteCarloDistributionSummary
  maxDrawdowns:
    MonteCarloDistributionSummary
}


export interface MonteCarloResult {
  parameters: MonteCarloParameters
  windowSize: number
  availableWindowCount: number
  runs: MonteCarloRun[]
  strategySummaries:
    MonteCarloStrategySummary[]
  winningMargins:
    MonteCarloDistributionSummary
  representativeRunNumber: number
  representativeRandom:
    SimulationResult
  representativeDca:
    SimulationResult
  representativeRsi:
    SimulationResult
  representativeLumpSum:
    SimulationResult
}