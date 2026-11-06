import type {
  DashboardResult,
} from '../../models/market'

import type {
  MonteCarloDistributionSummary,
  MonteCarloParameters,
  MonteCarloResult,
  MonteCarloRun,
  MonteCarloStrategyOutcome,
  MonteCarloStrategySummary,
  SimulationResult,
  SimulationStrategyId,
} from './simulationTypes'

import {
  buildEquityAnalytics,
  rsiTypeLabel,
  runDcaSimulation,
  runLumpSumSimulation,
  runRandomSimulation,
  runRsiSimulation,
} from './simulationEngine'


const minimumRunCount = 1
const maximumRunCount = 10_000
const winnerTolerance = 0.000001


interface CompletedRun {
  summary: MonteCarloRun
  random: SimulationResult
  dca: SimulationResult
  rsi: SimulationResult
  lumpSum: SimulationResult
}


function normalizeSeed(
  seed: number,
): number {
  if (!Number.isFinite(seed)) {
    return 1
  }

  const normalized =
    Math.trunc(seed) >>> 0

  return normalized === 0
    ? 1
    : normalized
}


function mixSeed(
  masterSeed: number,
  runIndex: number,
  stream: number,
): number {
  let value =
    normalizeSeed(
      masterSeed,
    )

  value ^=
    Math.imul(
      runIndex + 1,
      0x9e3779b1,
    )

  value ^=
    Math.imul(
      stream + 1,
      0x85ebca6b,
    )

  value ^=
    value >>> 16

  value =
    Math.imul(
      value,
      0x7feb352d,
    )

  value ^=
    value >>> 15

  value =
    Math.imul(
      value,
      0x846ca68b,
    )

  value ^=
    value >>> 16

  return (
    value >>> 0
  ) || 1
}


function seedToUnit(
  seed: number,
): number {
  return (
    normalizeSeed(seed) /
    4_294_967_296
  )
}


function mean(
  values: number[],
): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce(
    (
      total,
      value,
    ) =>
      total + value,
    0,
  ) /
    values.length
}


function quantile(
  sortedValues: number[],
  probability: number,
): number {
  if (sortedValues.length === 0) {
    return 0
  }

  if (sortedValues.length === 1) {
    return sortedValues[0]
  }

  const probabilityValue =
    Math.min(
      1,
      Math.max(
        0,
        probability,
      ),
    )

  const position =
    (
      sortedValues.length -
      1
    ) *
    probabilityValue

  const lower =
    Math.floor(position)

  const upper =
    Math.ceil(position)

  if (lower === upper) {
    return sortedValues[lower]
  }

  const weight =
    position - lower

  return (
    sortedValues[lower] *
      (
        1 - weight
      ) +
    sortedValues[upper] *
      weight
  )
}


function summarize(
  values: number[],
): MonteCarloDistributionSummary {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      minimum: 0,
      percentile05: 0,
      percentile25: 0,
      percentile75: 0,
      percentile95: 0,
      maximum: 0,
    }
  }

  const sorted =
    [...values].sort(
      (
        left,
        right,
      ) =>
        left - right,
    )

  const average =
    mean(sorted)

  const variance =
    sorted.length <= 1
      ? 0
      : sorted.reduce(
          (
            total,
            value,
          ) =>
            total +
            (
              value -
              average
            ) ** 2,
          0,
        ) /
        (
          sorted.length -
          1
        )

  return {
    mean:
      average,

    median:
      quantile(
        sorted,
        0.5,
      ),

    standardDeviation:
      Math.sqrt(
        variance,
      ),

    minimum:
      sorted[0],

    percentile05:
      quantile(
        sorted,
        0.05,
      ),

    percentile25:
      quantile(
        sorted,
        0.25,
      ),

    percentile75:
      quantile(
        sorted,
        0.75,
      ),

    percentile95:
      quantile(
        sorted,
        0.95,
      ),

    maximum:
      sorted[
        sorted.length - 1
      ],
  }
}


function wilsonInterval(
  successes: number,
  total: number,
): {
  lowerPercent: number
  upperPercent: number
} {
  if (total <= 0) {
    return {
      lowerPercent: 0,
      upperPercent: 0,
    }
  }

  const z =
    1.959963984540054

  const estimate =
    successes /
    total

  const denominator =
    1 +
    z * z /
      total

  const center =
    (
      estimate +
      z * z /
        (
          2 *
          total
        )
    ) /
    denominator

  const margin =
    z *
    Math.sqrt(
      (
        estimate *
        (
          1 -
          estimate
        ) /
        total
      ) +
      (
        z *
        z /
        (
          4 *
          total *
          total
        )
      ),
    ) /
    denominator

  return {
    lowerPercent:
      Math.max(
        0,
        center - margin,
      ) *
      100,

    upperPercent:
      Math.min(
        1,
        center + margin,
      ) *
      100,
  }
}


function determineWindowSize(
  availableCount: number,
  requestedPurchases: number,
  rsiPeriod: number,
): number {
  const minimumRequired =
    Math.max(
      30,
      requestedPurchases * 2,
      rsiPeriod * 3,
    )

  const target =
    Math.max(
      minimumRequired,
      Math.floor(
        availableCount *
        0.6,
      ),
    )

  return Math.min(
    availableCount,
    target,
  )
}


function createWindowDashboard(
  dashboard: DashboardResult,
  startIndex: number,
  windowSize: number,
): DashboardResult {
  return {
    ...dashboard,

    points:
      dashboard.points.slice(
        startIndex,
        startIndex +
          windowSize,
      ),
  }
}


function createOutcome(
  dashboard: DashboardResult,
  strategyId:
    SimulationStrategyId,
  strategyName: string,
  result: SimulationResult,
): MonteCarloStrategyOutcome {
  const analytics =
    buildEquityAnalytics(
      dashboard,
      result.trades,
      result.startingBudget,
    )

  return {
    strategyId,
    strategyName,

    finalWealth:
      result.finalWealth,

    returnPercent:
      result.returnPercent,

    maxDrawdownPercent:
      analytics
        .maxDrawdownPercent,
  }
}


function determineWinners(
  outcomes:
    MonteCarloStrategyOutcome[],
): {
  winnerIds:
    SimulationStrategyId[]
  winningMargin: number
} {
  const ordered =
    [...outcomes].sort(
      (
        left,
        right,
      ) =>
        right.finalWealth -
        left.finalWealth,
    )

  const bestWealth =
    ordered[0]
      .finalWealth

  const winnerIds =
    ordered
      .filter(
        outcome =>
          Math.abs(
            outcome.finalWealth -
            bestWealth,
          ) <=
          winnerTolerance,
      )
      .map(
        outcome =>
          outcome.strategyId,
      )

  const nextDistinct =
    ordered.find(
      outcome =>
        bestWealth -
          outcome.finalWealth >
        winnerTolerance,
    )

  return {
    winnerIds,

    winningMargin:
      nextDistinct
        ? bestWealth -
          nextDistinct
            .finalWealth
        : 0,
  }
}


function buildStrategySummary(
  strategyId:
    SimulationStrategyId,
  strategyName: string,
  runs: MonteCarloRun[],
): MonteCarloStrategySummary {
  const outcomes =
    runs.map(
      run => {
        const outcome =
          run.outcomes.find(
            candidate =>
              candidate
                .strategyId ===
              strategyId,
          )

        if (!outcome) {
          throw new Error(
            `Missing ${strategyName} outcome.`,
          )
        }

        return {
          run,
          outcome,
        }
      },
    )

  const wins =
    outcomes.filter(
      item =>
        item.run
          .winnerIds.length ===
          1 &&
        item.run
          .winnerIds[0] ===
          strategyId,
    ).length

  const ties =
    outcomes.filter(
      item =>
        item.run
          .winnerIds.length >
          1 &&
        item.run
          .winnerIds.includes(
            strategyId,
          ),
    ).length

  const interval =
    wilsonInterval(
      wins,
      runs.length,
    )

  const finalWealth =
    outcomes.map(
      item =>
        item.outcome
          .finalWealth,
    )

  const returns =
    outcomes.map(
      item =>
        item.outcome
          .returnPercent,
    )

  const maxDrawdowns =
    outcomes.map(
      item =>
        item.outcome
          .maxDrawdownPercent,
    )

  const losses =
    returns.filter(
      value =>
        value < 0,
    ).length

  return {
    strategyId,
    strategyName,
    wins,
    ties,

    winRatePercent:
      runs.length === 0
        ? 0
        : wins /
          runs.length *
          100,

    tieRatePercent:
      runs.length === 0
        ? 0
        : ties /
          runs.length *
          100,

    wilsonLowerPercent:
      interval
        .lowerPercent,

    wilsonUpperPercent:
      interval
        .upperPercent,

    lossProbabilityPercent:
      runs.length === 0
        ? 0
        : losses /
          runs.length *
          100,

    finalWealth:
      summarize(
        finalWealth,
      ),

    returns:
      summarize(
        returns,
      ),

    maxDrawdowns:
      summarize(
        maxDrawdowns,
      ),
  }
}


function selectRepresentativeRun(
  completedRuns:
    CompletedRun[],
): CompletedRun {
  const sortedReturns =
    completedRuns
      .map(
        run =>
          run.random
            .returnPercent,
      )
      .sort(
        (
          left,
          right,
        ) =>
          left - right,
      )

  const medianReturn =
    quantile(
      sortedReturns,
      0.5,
    )

  return [...completedRuns]
    .sort(
      (
        left,
        right,
      ) => {
        const leftDistance =
          Math.abs(
            left.random
              .returnPercent -
            medianReturn,
          )

        const rightDistance =
          Math.abs(
            right.random
              .returnPercent -
            medianReturn,
          )

        if (
          leftDistance !==
          rightDistance
        ) {
          return (
            leftDistance -
            rightDistance
          )
        }

        return (
          left.summary
            .runNumber -
          right.summary
            .runNumber
        )
      },
    )[0]
}


export function runMonteCarloSimulation(
  dashboard: DashboardResult,
  parameters:
    MonteCarloParameters,
): MonteCarloResult {
  if (
    !Number.isInteger(
      parameters.runCount,
    ) ||
    parameters.runCount <
      minimumRunCount ||
    parameters.runCount >
      maximumRunCount
  ) {
    throw new Error(
      `Monte Carlo runs must be between ${minimumRunCount} and ${maximumRunCount}.`,
    )
  }

  const availablePoints =
    dashboard.points.filter(
      point =>
        Number.isFinite(
          point.price,
        ) &&
        point.price > 0,
    )

  if (
    availablePoints.length <
    2
  ) {
    throw new Error(
      'At least two valid candles are required for Monte Carlo simulation.',
    )
  }

  const normalizedDashboard:
    DashboardResult = {
      ...dashboard,

      points:
        availablePoints,
    }

  const windowSize =
    determineWindowSize(
      availablePoints.length,
      parameters
        .requestedPurchases,
      parameters.rsiPeriod,
    )

  const availableWindowCount =
    Math.max(
      1,
      availablePoints.length -
        windowSize +
        1,
    )

  const rsiName =
    `${rsiTypeLabel(
      parameters.rsiType,
    )} < ${parameters.rsiThreshold}`

  const strategyNames:
    Record<
      SimulationStrategyId,
      string
    > = {
      random:
        'Random timing',

      dca:
        'Regular DCA',

      rsi:
        rsiName,

      lumpSum:
        'Lump Sum / Buy & Hold',
    }

  const completedRuns:
    CompletedRun[] = []

  for (
    let runIndex = 0;
    runIndex <
      parameters.runCount;
    runIndex++
  ) {
    const windowSeed =
      mixSeed(
        parameters.masterSeed,
        runIndex,
        0,
      )

    const randomBuySeed =
      mixSeed(
        parameters.masterSeed,
        runIndex,
        1,
      )

    const windowStartIndex =
      availableWindowCount === 1
        ? 0
        : Math.min(
            availableWindowCount -
              1,

            Math.floor(
              seedToUnit(
                windowSeed,
              ) *
                availableWindowCount,
            ),
          )

    const runDashboard =
      createWindowDashboard(
        normalizedDashboard,
        windowStartIndex,
        windowSize,
      )

    const random =
      runRandomSimulation(
        runDashboard,
        parameters
          .amountPerPurchase,
        parameters
          .requestedPurchases,
        randomBuySeed,
      )

    const dca =
      runDcaSimulation(
        runDashboard,
        parameters
          .amountPerPurchase,
        parameters
          .requestedPurchases,
      )

    const rsi =
      runRsiSimulation(
        runDashboard,
        parameters
          .amountPerPurchase,
        parameters
          .requestedPurchases,
        parameters.rsiType,
        parameters.rsiThreshold,
      )

    const lumpSum =
      runLumpSumSimulation(
        runDashboard,
        parameters
          .amountPerPurchase,
        parameters
          .requestedPurchases,
      )

    const outcomes:
      MonteCarloStrategyOutcome[] = [
        createOutcome(
          runDashboard,
          'random',
          strategyNames.random,
          random,
        ),

        createOutcome(
          runDashboard,
          'dca',
          strategyNames.dca,
          dca,
        ),

        createOutcome(
          runDashboard,
          'rsi',
          strategyNames.rsi,
          rsi,
        ),

        createOutcome(
          runDashboard,
          'lumpSum',
          strategyNames
            .lumpSum,
          lumpSum,
        ),
      ]

    const winner =
      determineWinners(
        outcomes,
      )

    const firstPoint =
      runDashboard.points[0]

    const lastPoint =
      runDashboard.points[
        runDashboard
          .points.length -
        1
      ]

    completedRuns.push({
      summary: {
        runNumber:
          runIndex + 1,

        windowSeed,
        randomBuySeed,

        windowStartIndex,

        windowEndIndex:
          windowStartIndex +
          windowSize -
          1,

        windowStartDate:
          firstPoint.date,

        windowEndDate:
          lastPoint.date,

        outcomes,

        winnerIds:
          winner.winnerIds,

        winningMargin:
          winner
            .winningMargin,
      },

      random,
      dca,
      rsi,
      lumpSum,
    })
  }

  const runs =
    completedRuns.map(
      run =>
        run.summary,
    )

  const strategyOrder:
    SimulationStrategyId[] = [
      'random',
      'dca',
      'rsi',
      'lumpSum',
    ]

  const strategySummaries =
    strategyOrder.map(
      strategyId =>
        buildStrategySummary(
          strategyId,
          strategyNames[
            strategyId
          ],
          runs,
        ),
    )

  const representative =
    selectRepresentativeRun(
      completedRuns,
    )

  return {
    parameters: {
      ...parameters,

      masterSeed:
        normalizeSeed(
          parameters
            .masterSeed,
        ),
    },

    windowSize,
    availableWindowCount,
    runs,
    strategySummaries,

    winningMargins:
      summarize(
        runs.map(
          run =>
            run.winningMargin,
        ),
      ),

    representativeRunNumber:
      representative
        .summary
        .runNumber,

    representativeRandom:
      representative.random,

    representativeDca:
      representative.dca,

    representativeRsi:
      representative.rsi,

    representativeLumpSum:
      representative.lumpSum,
  }
}