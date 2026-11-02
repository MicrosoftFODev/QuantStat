import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
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
  midpoint: number
  label: string
  frequency: number
}


function calculateReturns(
  dashboard: DashboardResult,
): number[] {
  const prices =
    dashboard.points.map(
      point => point.price,
    )

  const returns: number[] = []

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
          current / previous,
        ),
      )
    }
  }

  return returns
}


function arithmeticMean(
  values: number[],
): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce(
    (sum, value) =>
      sum + value,
    0,
  ) / values.length
}


function quantile(
  values: number[],
  probability: number,
): number {
  if (values.length === 0) {
    return 0
  }

  const sorted =
    [...values].sort(
      (left, right) =>
        left - right,
    )

  const position =
    probability *
    (sorted.length - 1)

  const lower =
    Math.floor(position)

  const upper =
    Math.ceil(position)

  if (lower === upper) {
    return sorted[lower]
  }

  const fraction =
    position - lower

  return (
    sorted[lower] +
    fraction *
    (
      sorted[upper] -
      sorted[lower]
    )
  )
}


function createHistogram(
  values: number[],
): HistogramBin[] {
  if (values.length === 0) {
    return []
  }

  const minimum =
    Math.min(...values)

  const maximum =
    Math.max(...values)

  if (minimum === maximum) {
    return [
      {
        id: 0,
        midpoint: minimum,
        label:
          `${(
            minimum * 100
          ).toFixed(2)}%`,
        frequency:
          values.length,
      },
    ]
  }

  const calculatedBins =
    Math.ceil(
      Math.sqrt(
        values.length,
      ),
    ) * 2

  const binCount =
    Math.max(
      10,
      Math.min(
        30,
        calculatedBins,
      ),
    )

  const width =
    (maximum - minimum) /
    binCount

  const frequency =
    Array.from(
      {
        length: binCount,
      },
      () => 0,
    )

  for (const value of values) {
    let index =
      Math.floor(
        (value - minimum) /
        width,
      )

    if (index >= binCount) {
      index =
        binCount - 1
    }

    if (index < 0) {
      index = 0
    }

    frequency[index]++
  }

  return frequency.map(
    (count, index) => {
      const lower =
        minimum +
        index * width

      const midpoint =
        lower +
        width / 2

      return {
        id: index,
        midpoint,
        label:
          `${(
            midpoint * 100
          ).toFixed(2)}%`,
        frequency: count,
      }
    },
  )
}


function ReturnDistributionChart() {
  const [dashboard, setDashboard] =
    useState<DashboardResult | null>(
      null,
    )

  const [error, setError] =
    useState<string | null>(
      null,
    )


  const symbol =
    localStorage.getItem(
      'quantstat-symbol',
    ) ?? 'ETHUSD'

  const interval =
    Number(
      localStorage.getItem(
        'quantstat-interval',
      ) ?? 1440,
    )

  const periodDays =
    Number(
      localStorage.getItem(
        'quantstat-period-days',
      ) ?? 365,
    )


  useEffect(() => {
    const controller =
      new AbortController()

    getDashboard(
      symbol,
      interval,
      periodDays,
      controller.signal,
    )
      .then(setDashboard)
      .catch((reason: unknown) => {
        if (
          reason instanceof DOMException &&
          reason.name === 'AbortError'
        ) {
          return
        }

        setError(
          reason instanceof Error
            ? reason.message
            : 'Distribution data could not be loaded.',
        )
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
          ? calculateReturns(
              dashboard,
            )
          : [],
      [dashboard],
    )


  const histogram =
    useMemo(
      () =>
        createHistogram(
          returns,
        ),
      [returns],
    )


  const mean =
    useMemo(
      () =>
        arithmeticMean(
          returns,
        ),
      [returns],
    )


  const q05 =
    useMemo(
      () =>
        quantile(
          returns,
          0.05,
        ),
      [returns],
    )


  const q95 =
    useMemo(
      () =>
        quantile(
          returns,
          0.95,
        ),
      [returns],
    )


  function nearestBinId(
    target: number,
  ): number | undefined {
    if (histogram.length === 0) {
      return undefined
    }

    return histogram.reduce(
      (nearest, current) =>
        Math.abs(
          current.midpoint -
          target,
        ) <
        Math.abs(
          nearest.midpoint -
          target,
        )
          ? current
          : nearest,
    ).id
  }


  const meanBin =
    nearestBinId(mean)

  const q05Bin =
    nearestBinId(q05)

  const q95Bin =
    nearestBinId(q95)


  if (error) {
    return (
      <div className="error-banner">
        {error}
      </div>
    )
  }


  return (
    <article className="distribution-card">

      <div className="statistics-card-header">

        <h2>
          Return distribution
        </h2>

        <p>
          Empirical distribution of
          continuously compounded returns
        </p>

      </div>


      {histogram.length === 0 ? (
        <div className="distribution-loading">
          Loading distribution...
        </div>
      ) : (
        <>

          <div className="distribution-chart">

            <ResponsiveContainer>

              <BarChart
                data={histogram}
                margin={{
                  top: 24,
                  right: 22,
                  left: 4,
                  bottom: 5,
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

                    return bin?.label ?? ''
                  }}
                  minTickGap={35}
                  tick={{
                    fill:
                      'var(--muted)',
                    fontSize: 10,
                  }}
                />


                <YAxis
                  allowDecimals={false}
                  width={45}
                  tick={{
                    fill:
                      'var(--muted)',
                    fontSize: 10,
                  }}
                />


                <Tooltip
                  cursor={{
                    fill:
                      'rgba(108, 140, 255, 0.08)',
                  }}
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
                        bin?.label ?? ''
                      }`
                    )
                  }}
                  formatter={value => [
                    Number(value),
                    'Frequency',
                  ]}
                />


                {q05Bin !== undefined && (
                  <ReferenceLine
                    x={q05Bin}
                    stroke="#fb7185"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    label={{
                      value: '5%',
                      fill: '#fb7185',
                      fontSize: 10,
                    }}
                  />
                )}


                {meanBin !== undefined && (
                  <ReferenceLine
                    x={meanBin}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    label={{
                      value: 'Mean',
                      fill: '#f59e0b',
                      fontSize: 10,
                    }}
                  />
                )}


                {q95Bin !== undefined && (
                  <ReferenceLine
                    x={q95Bin}
                    stroke="#34d399"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    label={{
                      value: '95%',
                      fill: '#34d399',
                      fontSize: 10,
                    }}
                  />
                )}


                <Bar
                  dataKey="frequency"
                  fill="#6c8cff"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                  name="Frequency"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>


          <div className="distribution-summary">

            <div>
              <span>
                5% quantile
              </span>

              <strong className="distribution-negative">
                {(q05 * 100).toFixed(4)}%
              </strong>
            </div>


            <div>
              <span>
                Mean return
              </span>

              <strong className="distribution-average">
                {(mean * 100).toFixed(4)}%
              </strong>
            </div>


            <div>
              <span>
                95% quantile
              </span>

              <strong className="distribution-positive">
                {(q95 * 100).toFixed(4)}%
              </strong>
            </div>

          </div>

        </>
      )}

    </article>
  )
}


export default ReturnDistributionChart