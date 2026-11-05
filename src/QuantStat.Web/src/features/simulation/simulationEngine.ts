import type {
  DashboardResult,
} from '../../models/market'

import type {
  EquityAnalytics,
  EquityPoint,
  SimulationResult,
  SimulationTrade,
} from './simulationTypes'

export function buildEquityAnalytics(
  dashboard: DashboardResult,
  trades: SimulationTrade[],
  startingBudget: number,
): EquityAnalytics {
  const validPoints =
    dashboard.points.filter(
      point =>
        Number.isFinite(
          point.price,
        ) &&
        point.price > 0,
    )

  if (
    validPoints.length === 0 ||
    startingBudget <= 0
  ) {
    return {
      equityCurve: [],
      maxDrawdownPercent: 0,
      capitalUtilizationPercent: 0,
    }
  }

  const tradesByIndex =
    new Map<
      number,
      SimulationTrade[]
    >()

  for (
    const trade of trades
  ) {
    const existing =
      tradesByIndex.get(
        trade.index,
      ) ?? []

    existing.push(trade)

    tradesByIndex.set(
      trade.index,
      existing,
    )
  }

  let accumulatedQuantity = 0
  let investedCapital = 0
  let peakWealth =
    startingBudget

  const equityCurve:
    EquityPoint[] = []

  for (
    let index = 0;
    index <
      validPoints.length;
    index++
  ) {
    const point =
      validPoints[index]

    const executedTrades =
      tradesByIndex.get(
        index,
      ) ?? []

    for (
      const trade of
      executedTrades
    ) {
      accumulatedQuantity +=
        trade.quantity

      investedCapital +=
        trade.amount
    }

    const cash =
      Math.max(
        0,
        startingBudget -
          investedCapital,
      )

    const holdingsValue =
      accumulatedQuantity *
      point.price

    const wealth =
      cash +
      holdingsValue

    peakWealth =
      Math.max(
        peakWealth,
        wealth,
      )

    const drawdownPercent =
      peakWealth <= 0
        ? 0
        : (
            wealth -
            peakWealth
          ) /
          peakWealth *
          100

    equityCurve.push({
      date:
        point.date,
      price:
        point.price,
      accumulatedQuantity,
      investedCapital,
      cash,
      holdingsValue,
      wealth,
      drawdownPercent,
    })
  }

  const maxDrawdownPercent =
    equityCurve.reduce(
      (
        lowest,
        point,
      ) =>
        Math.min(
          lowest,
          point.drawdownPercent,
        ),
      0,
    )

  const capitalUtilizationPercent =
    startingBudget <= 0
      ? 0
      : Math.min(
          100,
          investedCapital /
            startingBudget *
            100,
        )

  return {
    equityCurve,
    maxDrawdownPercent,
    capitalUtilizationPercent,
  }
}

export function createSeed(): number {
  return Math.floor(
    Math.random() *
      2_147_483_647,
  )
}


function createRandom(
  seed: number,
): () => number {
  let state =
    seed >>> 0


  return () => {
    state +=
      0x6d2b79f5

    let value =
      state

    value =
      Math.imul(
        value ^
          value >>> 15,
        value | 1,
      )

    value ^=
      value +
      Math.imul(
        value ^
          value >>> 7,
        value | 61,
      )

    return (
      (
        value ^
        value >>> 14
      ) >>> 0
    ) /
      4_294_967_296
  }
}


function sampleIndexes(
  availableCount: number,
  requestedCount: number,
  seed: number,
): number[] {
  const indexes =
    Array.from(
      {
        length:
          availableCount,
      },
      (_, index) =>
        index,
    )

  const random =
    createRandom(seed)

  for (
    let i =
      indexes.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        random() *
          (i + 1),
      )

    const current =
      indexes[i]

    indexes[i] =
      indexes[j]

    indexes[j] =
      current
  }

  return indexes
    .slice(
      0,
      Math.min(
        requestedCount,
        availableCount,
      ),
    )
    .sort(
      (left, right) =>
        left - right,
    )
}


export function runRandomSimulation(
  dashboard: DashboardResult,
  amountPerPurchase: number,
  requestedPurchases: number,
  seed: number,
): SimulationResult {
  const eligiblePoints =
    dashboard.points.filter(
      point =>
        Number.isFinite(
          point.price,
        ) &&
        point.price > 0,
    )

  if (
    eligiblePoints.length === 0
  ) {
    throw new Error(
      'No valid completed market candles are available for simulation.',
    )
  }

  const selectedIndexes =
    sampleIndexes(
      eligiblePoints.length,
      requestedPurchases,
      seed,
    )

  const trades =
    selectedIndexes.map(
      index => {
        const point =
          eligiblePoints[index]

        return {
          index,
          date:
            point.date,
          price:
            point.price,
          amount:
            amountPerPurchase,
          quantity:
            amountPerPurchase /
            point.price,
        }
      },
    )

  const executedPurchases =
    trades.length

  const startingBudget =
    amountPerPurchase *
    requestedPurchases

  const investedCapital =
    amountPerPurchase *
    executedPurchases

  const unusedCash =
    startingBudget -
    investedCapital

  const totalQuantity =
    trades.reduce(
      (
        total,
        trade,
      ) =>
        total +
        trade.quantity,
      0,
    )

  const finalPrice =
    eligiblePoints[
      eligiblePoints.length - 1
    ].price

  const holdingsValue =
    totalQuantity *
    finalPrice

  const finalWealth =
    holdingsValue +
    unusedCash

  const pnl =
    finalWealth -
    startingBudget

  const returnPercent =
    startingBudget === 0
      ? 0
      : pnl /
        startingBudget *
        100

  const averageEntryPrice =
    totalQuantity === 0
      ? 0
      : investedCapital /
        totalQuantity

  return {
    seed,
    requestedPurchases,
    executedPurchases,
    amountPerPurchase,
    startingBudget,
    investedCapital,
    unusedCash,
    totalQuantity,
    averageEntryPrice,
    finalPrice,
    holdingsValue,
    finalWealth,
    pnl,
    returnPercent,
    trades,
  }
}



export function runDcaSimulation(
  dashboard: DashboardResult,
  amountPerPurchase: number,
  requestedPurchases: number,
): SimulationResult {
  const eligiblePoints =
    dashboard.points.filter(
      point =>
        Number.isFinite(
          point.price,
        ) &&
        point.price > 0,
    )

  if (
    eligiblePoints.length === 0
  ) {
    throw new Error(
      'No valid completed market candles are available for DCA.',
    )
  }

  const executedPurchases =
    Math.min(
      requestedPurchases,
      eligiblePoints.length,
    )

  const selectedIndexes:
    number[] = []

  if (
    executedPurchases === 1
  ) {
    selectedIndexes.push(0)
  }
  else {
    const lastIndex =
      eligiblePoints.length - 1

    for (
      let position = 0;
      position <
        executedPurchases;
      position++
    ) {
      const index =
        Math.round(
          position *
          lastIndex /
          (
            executedPurchases -
            1
          ),
        )

      selectedIndexes.push(
        index,
      )
    }
  }

  const trades =
    selectedIndexes.map(
      index => {
        const point =
          eligiblePoints[index]

        return {
          index,
          date:
            point.date,
          price:
            point.price,
          amount:
            amountPerPurchase,
          quantity:
            amountPerPurchase /
            point.price,
        }
      },
    )

  const startingBudget =
    amountPerPurchase *
    requestedPurchases

  const investedCapital =
    amountPerPurchase *
    executedPurchases

  const unusedCash =
    startingBudget -
    investedCapital

  const totalQuantity =
    trades.reduce(
      (
        total,
        trade,
      ) =>
        total +
        trade.quantity,
      0,
    )

  const finalPrice =
    eligiblePoints[
      eligiblePoints.length - 1
    ].price

  const holdingsValue =
    totalQuantity *
    finalPrice

  const finalWealth =
    holdingsValue +
    unusedCash

  const pnl =
    finalWealth -
    startingBudget

  const returnPercent =
    startingBudget === 0
      ? 0
      : pnl /
        startingBudget *
        100

  const averageEntryPrice =
    totalQuantity === 0
      ? 0
      : investedCapital /
        totalQuantity

  return {
    seed: 0,
    requestedPurchases,
    executedPurchases,
    amountPerPurchase,
    startingBudget,
    investedCapital,
    unusedCash,
    totalQuantity,
    averageEntryPrice,
    finalPrice,
    holdingsValue,
    finalWealth,
    pnl,
    returnPercent,
    trades,
  }
}



export type SimulationRsiType =
  | 'wilder'
  | 'cutler'
  | 'exponential'


function rsiValue(
  point: DashboardResult['points'][number],
  rsiType: SimulationRsiType,
): number | null {
  switch (rsiType) {
    case 'cutler':
      return point.cutlerRsi

    case 'exponential':
      return point.exponentialRsi

    case 'wilder':
    default:
      return point.wilderRsi
  }
}


export function rsiTypeLabel(
  rsiType: SimulationRsiType,
): string {
  switch (rsiType) {
    case 'cutler':
      return 'Cutler RSI'

    case 'exponential':
      return 'Exponential RSI'

    case 'wilder':
    default:
      return 'Wilder RSI'
  }
}


export function runRsiSimulation(
  dashboard: DashboardResult,
  amountPerPurchase: number,
  requestedPurchases: number,
  rsiType: SimulationRsiType,
  rsiThreshold: number,
): SimulationResult {
  const points =
    dashboard.points

  if (points.length < 2) {
    throw new Error(
      'At least two completed candles are required for the RSI strategy.',
    )
  }

  const trades:
    SimulationTrade[] = []

  for (
    let signalIndex = 0;
    signalIndex <
      points.length - 1;
    signalIndex++
  ) {
    if (
      trades.length >=
      requestedPurchases
    ) {
      break
    }

    const signalPoint =
      points[signalIndex]

    const signalRsi =
      rsiValue(
        signalPoint,
        rsiType,
      )

    if (
      signalRsi === null ||
      !Number.isFinite(
        signalRsi,
      ) ||
      signalRsi >=
        rsiThreshold
    ) {
      continue
    }

    const executionIndex =
      signalIndex + 1

    const executionPoint =
      points[executionIndex]

    if (
      !Number.isFinite(
        executionPoint.price,
      ) ||
      executionPoint.price <= 0
    ) {
      continue
    }

    trades.push({
      index:
        executionIndex,
      signalDate:
        signalPoint.date,
      date:
        executionPoint.date,
      signalValue:
        signalRsi,
      price:
        executionPoint.price,
      amount:
        amountPerPurchase,
      quantity:
        amountPerPurchase /
        executionPoint.price,
    })
  }

  const startingBudget =
    amountPerPurchase *
    requestedPurchases

  const executedPurchases =
    trades.length

  const investedCapital =
    amountPerPurchase *
    executedPurchases

  const unusedCash =
    startingBudget -
    investedCapital

  const totalQuantity =
    trades.reduce(
      (
        total,
        trade,
      ) =>
        total +
        trade.quantity,
      0,
    )

  const finalPoint =
    [...points]
      .reverse()
      .find(
        point =>
          Number.isFinite(
            point.price,
          ) &&
          point.price > 0,
      )

  if (!finalPoint) {
    throw new Error(
      'No valid final market price is available for the RSI strategy.',
    )
  }

  const finalPrice =
    finalPoint.price

  const holdingsValue =
    totalQuantity *
    finalPrice

  const finalWealth =
    holdingsValue +
    unusedCash

  const pnl =
    finalWealth -
    startingBudget

  const returnPercent =
    startingBudget === 0
      ? 0
      : pnl /
        startingBudget *
        100

  const averageEntryPrice =
    totalQuantity === 0
      ? 0
      : investedCapital /
        totalQuantity

  return {
    seed: 0,
    requestedPurchases,
    executedPurchases,
    amountPerPurchase,
    startingBudget,
    investedCapital,
    unusedCash,
    totalQuantity,
    averageEntryPrice,
    finalPrice,
    holdingsValue,
    finalWealth,
    pnl,
    returnPercent,
    trades,
  }
}

export function runLumpSumSimulation(
  dashboard: DashboardResult,
  amountPerPurchase: number,
  requestedPurchases: number,
): SimulationResult {
  const eligiblePoints =
    dashboard.points.filter(
      point =>
        Number.isFinite(
          point.price,
        ) &&
        point.price > 0,
    )

  if (
    eligiblePoints.length === 0
  ) {
    throw new Error(
      'No valid completed market candles are available for the lump-sum benchmark.',
    )
  }

  const startingBudget =
    amountPerPurchase *
    requestedPurchases

  const entryPoint =
    eligiblePoints[0]

  const finalPoint =
    eligiblePoints[
      eligiblePoints.length - 1
    ]

  const totalQuantity =
    startingBudget /
    entryPoint.price

  const holdingsValue =
    totalQuantity *
    finalPoint.price

  const finalWealth =
    holdingsValue

  const pnl =
    finalWealth -
    startingBudget

  const returnPercent =
    startingBudget === 0
      ? 0
      : pnl /
        startingBudget *
        100

  const trades:
    SimulationTrade[] = [
      {
        index: 0,
        date:
          entryPoint.date,
        price:
          entryPoint.price,
        amount:
          startingBudget,
        quantity:
          totalQuantity,
      },
    ]

  return {
    seed: 0,
    requestedPurchases: 1,
    executedPurchases: 1,
    amountPerPurchase:
      startingBudget,
    startingBudget,
    investedCapital:
      startingBudget,
    unusedCash: 0,
    totalQuantity,
    averageEntryPrice:
      entryPoint.price,
    finalPrice:
      finalPoint.price,
    holdingsValue,
    finalWealth,
    pnl,
    returnPercent,
    trades,
  }
}
