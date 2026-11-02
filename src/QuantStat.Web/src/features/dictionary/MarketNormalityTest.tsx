import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getDashboard,
} from '../../api/quantStatApi'

import type {
  DashboardResult,
} from '../../models/market'


interface HistogramBin {
  id: number
  label: string
  midpoint: number
  observed: number
  normalExpected: number
}


interface NormalityResult {
  count: number
  mean: number
  standardDeviation: number
  skewness: number
  excessKurtosis: number
  jarqueBera: number
  pValue: number
}


function arithmeticMean(
  values: number[],
): number {
  return values.reduce(
    (sum, value) =>
      sum + value,
    0,
  ) / values.length
}


function sampleStandardDeviation(
  values: number[],
  average: number,
): number {
  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        (
          value -
          average
        ) **
        2,
      0,
    ) /
    (
      values.length -
      1
    )

  return Math.sqrt(variance)
}


function normalDensity(
  value: number,
  average: number,
  standardDeviation: number,
): number {
  const z =
    (
      value -
      average
    ) /
    standardDeviation

  return (
    Math.exp(
      -0.5 *
      z *
      z,
    ) /
    (
      standardDeviation *
      Math.sqrt(
        2 *
        Math.PI,
      )
    )
  )
}


function calculateLogReturns(
  dashboard: DashboardResult,
): number[] {
  const prices =
    dashboard.points.map(
      point =>
        point.price,
    )

  const returns: number[] =
    []

  for (
    let index = 1;
    index < prices.length;
    index++
  ) {
    const previous =
      prices[index - 1]

    const current =
      prices[index]

    if (
      previous > 0 &&
      current > 0
    ) {
      returns.push(
        Math.log(
          current /
          previous,
        ),
      )
    }
  }

  return returns
}


function calculateNormality(
  values: number[],
): NormalityResult | null {
  if (values.length < 4) {
    return null
  }

  const count =
    values.length

  const average =
    arithmeticMean(values)

  const deviations =
    values.map(
      value =>
        value -
        average,
    )

  const secondMoment =
    deviations.reduce(
      (sum, value) =>
        sum +
        value ** 2,
      0,
    ) /
    count

  if (secondMoment <= 0) {
    return null
  }

  const thirdMoment =
    deviations.reduce(
      (sum, value) =>
        sum +
        value ** 3,
      0,
    ) /
    count

  const fourthMoment =
    deviations.reduce(
      (sum, value) =>
        sum +
        value ** 4,
      0,
    ) /
    count

  const skewness =
    thirdMoment /
    (
      secondMoment **
      1.5
    )

  const excessKurtosis =
    fourthMoment /
    (
      secondMoment **
      2
    ) -
    3

  const jarqueBera =
    count /
    6 *
    (
      skewness ** 2 +
      excessKurtosis ** 2 /
      4
    )

  /*
   * Under the asymptotic chi-square reference
   * distribution with 2 degrees of freedom,
   * the upper-tail probability is exp(-JB / 2).
   */
  const pValue =
    Math.exp(
      -jarqueBera /
      2,
    )

  return {
    count,
    mean:
      average,

    standardDeviation:
      sampleStandardDeviation(
        values,
        average,
      ),

    skewness,
    excessKurtosis,
    jarqueBera,
    pValue,
  }
}


function createHistogram(
  values: number[],
  result: NormalityResult,
): HistogramBin[] {
  const minimum =
    Math.min(...values)

  const maximum =
    Math.max(...values)

  if (minimum === maximum) {
    return []
  }

  const binCount =
    Math.max(
      10,
      Math.min(
        30,
        Math.ceil(
          Math.sqrt(
            values.length,
          ),
        ) *
        2,
      ),
    )

  const width =
    (
      maximum -
      minimum
    ) /
    binCount

  const counts =
    Array.from(
      {
        length:
          binCount,
      },
      () => 0,
    )

  for (const value of values) {
    let index =
      Math.floor(
        (
          value -
          minimum
        ) /
        width,
      )

    if (index < 0) {
      index = 0
    }

    if (index >= binCount) {
      index =
        binCount -
        1
    }

    counts[index]++
  }

  return counts.map(
    (
      observed,
      index,
    ) => {
      const midpoint =
        minimum +
        (
          index +
          0.5
        ) *
        width

      const normalExpected =
        normalDensity(
          midpoint,
          result.mean,
          result.standardDeviation,
        ) *
        width *
        values.length

      return {
        id:
          index,

        midpoint,

        label:
          `${(
            midpoint *
            100
          ).toFixed(2)}%`,

        observed,

        normalExpected,
      }
    },
  )
}


function displaySymbol(
  symbol: string,
): string {
  const quotes = [
    'USDT',
    'USDC',
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'CHF',
    'BTC',
    'ETH',
  ]

  const quote =
    quotes.find(
      candidate =>
        symbol.endsWith(
          candidate,
        ) &&
        symbol.length >
          candidate.length,
    )

  if (!quote) {
    return symbol
  }

  return `${
    symbol.slice(
      0,
      -quote.length,
    )
  }/${quote}`
}


function intervalLabel(
  minutes: number,
): string {
  const labels:
    Record<number, string> = {
      1: '1 Minute',
      5: '5 Minutes',
      15: '15 Minutes',
      30: '30 Minutes',
      60: '1 Hour',
      240: '4 Hours',
      1440: '1 Day',
      10080: '1 Week',
      21600: '15 Days',
    }

  return labels[minutes] ??
    `${minutes} Minutes`
}


function periodLabel(
  days: number,
): string {
  const labels:
    Record<number, string> = {
      30: '30 Days',
      90: '90 Days',
      180: '180 Days',
      365: '1 Year',
      720: 'Maximum',
    }

  return labels[days] ??
    `${days} Days`
}


function MarketNormalityTest() {
  const [dashboard, setDashboard] =
    useState<DashboardResult | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(
      null,
    )

  const [alphaText, setAlphaText] =
    useState('0.05')


  const symbol =
    localStorage.getItem(
      'quantstat-symbol',
    ) ??
    'ETHUSD'

  const interval =
    Number(
      localStorage.getItem(
        'quantstat-interval',
      ) ??
      1440,
    )

  const periodDays =
    Number(
      localStorage.getItem(
        'quantstat-period-days',
      ) ??
      365,
    )

  const alpha =
    Number(alphaText)


  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    getDashboard(
      symbol,
      interval,
      periodDays,
      controller.signal,
    )
      .then(setDashboard)
      .catch(
        (
          reason: unknown,
        ) => {
          if (
            reason instanceof
              DOMException &&
            reason.name ===
              'AbortError'
          ) {
            return
          }

          setError(
            reason instanceof Error
              ? reason.message
              : 'Market returns could not be loaded.',
          )
        },
      )
      .finally(() => {
        if (
          !controller
            .signal
            .aborted
        ) {
          setLoading(false)
        }
      })

    return () =>
      controller.abort()
  }, [
    symbol,
    interval,
    periodDays,
  ])


  const returns =
    useMemo(
      () =>
        dashboard
          ? calculateLogReturns(
              dashboard,
            )
          : [],
      [dashboard],
    )


  const result =
    useMemo(
      () =>
        calculateNormality(
          returns,
        ),
      [returns],
    )


  const histogram =
    useMemo(
      () =>
        result
          ? createHistogram(
              returns,
              result,
            )
          : [],
      [
        returns,
        result,
      ],
    )


  const rejectsNormality =
    result
      ? result.pValue <=
        alpha
      : false


  return (
    <article className="hypothesis-test-card normality-test-card">

      <div className="test-card-heading">

        <div>
          <span>
            Automatic market diagnostic
          </span>

          <h3>
            Market-return normality test
          </h3>

          <p>
            QuantStat automatically examines the
            log returns from the market, interval,
            and period selected on Dashboard.
            No manual sample entry is required.
          </p>
        </div>

      </div>


      <div className="normality-selection-grid">

        <div>
          <span>
            Market
          </span>

          <strong>
            {displaySymbol(
              symbol,
            )}
          </strong>
        </div>


        <div>
          <span>
            Interval
          </span>

          <strong>
            {intervalLabel(
              interval,
            )}
          </strong>
        </div>


        <div>
          <span>
            Period
          </span>

          <strong>
            {periodLabel(
              periodDays,
            )}
          </strong>
        </div>


        <label>
          Significance level

          <select
            value={alphaText}
            onChange={event =>
              setAlphaText(
                event.target.value,
              )
            }
          >
            <option value="0.10">
              0.10
            </option>

            <option value="0.05">
              0.05
            </option>

            <option value="0.01">
              0.01
            </option>
          </select>
        </label>

      </div>


      <div className="test-hypotheses">

        <div>
          <span>
            Null hypothesis
          </span>

          <strong>
            H0: market log returns follow a normal distribution
          </strong>
        </div>


        <div>
          <span>
            Alternative hypothesis
          </span>

          <strong>
            H1: market log returns do not follow a normal distribution
          </strong>
        </div>

      </div>


      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}


      {loading && (
        <div className="normality-loading">
          Loading selected market returns...
        </div>
      )}


      {!loading &&
       !error &&
       histogram.length > 0 && (
        <div className="normality-chart">

          <ResponsiveContainer>

            <ComposedChart
              data={histogram}
              margin={{
                top: 18,
                right: 20,
                bottom: 4,
                left: 4,
              }}
            >

              <CartesianGrid
                stroke="var(--grid)"
                strokeDasharray="3 3"
                vertical={false}
              />


              <XAxis
                dataKey="id"
                tickFormatter={value => {
                  const bin =
                    histogram[
                      Number(value)
                    ]

                  return (
                    bin?.label ??
                    ''
                  )
                }}
                minTickGap={30}
                tick={{
                  fill:
                    'var(--muted)',
                  fontSize: 9,
                }}
              />


              <YAxis
                allowDecimals={false}
                tick={{
                  fill:
                    'var(--muted)',
                  fontSize: 9,
                }}
              />


              <Tooltip
                contentStyle={{
                  background:
                    'var(--tooltip)',
                  border:
                    '1px solid var(--border)',
                  borderRadius: 12,
                  color:
                    'var(--text)',
                }}
                labelFormatter={value => {
                  const bin =
                    histogram[
                      Number(value)
                    ]

                  return (
                    `Log return: ${
                      bin?.label ??
                      ''
                    }`
                  )
                }}
              />


              <Bar
                dataKey="observed"
                fill="#6c8cff"
                fillOpacity={0.62}
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                name="Observed frequency"
              />


              <Line
                type="monotone"
                dataKey="normalExpected"
                stroke="#f59e0b"
                strokeWidth={2.4}
                dot={false}
                name="Fitted normal curve"
              />

            </ComposedChart>

          </ResponsiveContainer>

        </div>
      )}


      {result && (
        <>

          <div className="test-result-grid normality-results">

            <div>
              <span>
                Return observations
              </span>

              <strong>
                {result.count}
              </strong>
            </div>


            <div>
              <span>
                Mean log return
              </span>

              <strong>
                {
                  result.mean
                    .toFixed(8)
                }
              </strong>
            </div>


            <div>
              <span>
                Standard deviation
              </span>

              <strong>
                {
                  result
                    .standardDeviation
                    .toFixed(8)
                }
              </strong>
            </div>


            <div>
              <span>
                Skewness
              </span>

              <strong>
                {
                  result
                    .skewness
                    .toFixed(6)
                }
              </strong>
            </div>


            <div>
              <span>
                Excess kurtosis
              </span>

              <strong>
                {
                  result
                    .excessKurtosis
                    .toFixed(6)
                }
              </strong>
            </div>


            <div>
              <span>
                Jarque-Bera statistic
              </span>

              <strong>
                {
                  result
                    .jarqueBera
                    .toFixed(6)
                }
              </strong>
            </div>


            <div>
              <span>
                p-value
              </span>

              <strong>
                {
                  result
                    .pValue
                    .toFixed(6)
                }
              </strong>
            </div>


            <div>
              <span>
                Significance level
              </span>

              <strong>
                {alpha.toFixed(2)}
              </strong>
            </div>

          </div>


          <div
            className={
              rejectsNormality
                ? 'test-decision reject'
                : 'test-decision retain'
            }
          >

            <span>
              Statistical decision
            </span>

            <strong>
              {
                rejectsNormality
                  ? 'Reject the normality hypothesis'
                  : 'Do not reject the normality hypothesis'
              }
            </strong>

            <small>
              {
                rejectsNormality
                  ? 'The return sample provides evidence against normality at the selected significance level.'
                  : 'The test did not find sufficient evidence against normality at the selected significance level.'
              }
            </small>

          </div>

        </>
      )}


      <div className="test-explanation">

        <strong>
          How to interpret this analysis
        </strong>

        <p>
          The bars show the observed distribution
          of market log returns. The orange line is
          a normal curve fitted using the sample
          mean and standard deviation. Skewness
          measures asymmetry. Excess kurtosis
          compares tail weight with a normal
          distribution. A rejected test indicates
          evidence against normality, but a test
          that is not rejected does not prove that
          returns are normal.
        </p>

      </div>

    </article>
  )
}


export default MarketNormalityTest