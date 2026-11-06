import type {
  MonteCarloResult,
  MonteCarloStrategySummary,
} from './simulationTypes'


interface MonteCarloWinRatesProps {
  result: MonteCarloResult
}


function percent(
  value: number,
): string {
  return `${value.toFixed(1)}%`
}


function strategyAccent(
  strategyId:
    MonteCarloStrategySummary['strategyId'],
): string {
  switch (strategyId) {
    case 'random':
      return 'from-sky-500 to-cyan-400'

    case 'dca':
      return 'from-violet-500 to-fuchsia-400'

    case 'rsi':
      return 'from-emerald-500 to-teal-400'

    case 'lumpSum':
      return 'from-amber-500 to-orange-400'
  }
}


function MonteCarloWinRates({
  result,
}: MonteCarloWinRatesProps) {
  const runCount =
    result.runs.length

  const tieRuns =
    result.runs.filter(
      run =>
        run.winnerIds.length > 1,
    ).length

  const tieRate =
    runCount === 0
      ? 0
      : tieRuns /
        runCount *
        100

  const ordered =
    [...result.strategySummaries]
      .sort(
        (
          left,
          right,
        ) =>
          right.winRatePercent -
          left.winRatePercent,
      )

  const mostFrequentWinner =
    ordered[0] ?? null

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/35 shadow-xl shadow-black/10">
      <div className="border-b border-slate-700/60 bg-slate-900/40 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
              Monte Carlo analysis
            </span>

            <h2 className="mt-1 text-xl font-semibold text-slate-100">
              Strategy win rates
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              Each strategy is evaluated across the same randomly selected
              historical window within each run. Bars show outright wins.
              Tied runs are reported separately.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3">
              <span className="block text-xs uppercase tracking-wide text-slate-500">
                Runs
              </span>

              <strong className="mt-1 block text-lg text-slate-100">
                {runCount.toLocaleString()}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3">
              <span className="block text-xs uppercase tracking-wide text-slate-500">
                Window
              </span>

              <strong className="mt-1 block text-lg text-slate-100">
                {result.windowSize.toLocaleString()}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3">
              <span className="block text-xs uppercase tracking-wide text-slate-500">
                Tie rate
              </span>

              <strong className="mt-1 block text-lg text-slate-100">
                {percent(tieRate)}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3">
              <span className="block text-xs uppercase tracking-wide text-slate-500">
                Frequent winner
              </span>

              <strong className="mt-1 block max-w-40 truncate text-sm text-slate-100">
                {
                  mostFrequentWinner
                    ?.strategyName ??
                  '-'
                }
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {
          ordered.map(
            summary => {
              const barWidth =
                Math.min(
                  100,
                  Math.max(
                    0,
                    summary
                      .winRatePercent,
                  ),
                )

              return (
                <article
                  key={
                    summary.strategyId
                  }
                  className="rounded-xl border border-slate-700/50 bg-slate-900/35 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-100">
                        {
                          summary
                            .strategyName
                        }
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          summary.wins
                            .toLocaleString()
                        }
                        {' outright wins'}
                        {
                          summary.ties > 0
                            ? ` · ${summary.ties.toLocaleString()} tied-run appearances`
                            : ''
                        }
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <strong className="text-xl text-slate-100">
                        {
                          percent(
                            summary
                              .winRatePercent,
                          )
                        }
                      </strong>

                      <span className="ml-2 text-xs text-slate-500">
                        95% CI {
                          percent(
                            summary
                              .wilsonLowerPercent,
                          )
                        }
                        {' – '}
                        {
                          percent(
                            summary
                              .wilsonUpperPercent,
                          )
                        }
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800"
                    role="progressbar"
                    aria-label={`${summary.strategyName} win rate`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      Number(
                        summary
                          .winRatePercent
                          .toFixed(1),
                      )
                    }
                  >
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${strategyAccent(summary.strategyId)} transition-all`}
                      style={{
                        width:
                          `${barWidth}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="block text-slate-500">
                        Median return
                      </span>

                      <strong className="text-slate-200">
                        {
                          percent(
                            summary
                              .returns
                              .median,
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span className="block text-slate-500">
                        Mean return
                      </span>

                      <strong className="text-slate-200">
                        {
                          percent(
                            summary
                              .returns
                              .mean,
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span className="block text-slate-500">
                        Loss probability
                      </span>

                      <strong className="text-slate-200">
                        {
                          percent(
                            summary
                              .lossProbabilityPercent,
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span className="block text-slate-500">
                        Median drawdown
                      </span>

                      <strong className="text-slate-200">
                        {
                          percent(
                            summary
                              .maxDrawdowns
                              .median,
                          )
                        }
                      </strong>
                    </div>
                  </div>
                </article>
              )
            },
          )
        }

        {
          tieRuns > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-400">
              <strong className="text-slate-200">
                Ties:
              </strong>
              {' '}
              {
                tieRuns
                  .toLocaleString()
              }
              {' of '}
              {
                runCount
                  .toLocaleString()
              }
              {' runs ('}
              {percent(tieRate)}
              {').'}
            </div>
          )
        }
      </div>
    </section>
  )
}


export default MonteCarloWinRates