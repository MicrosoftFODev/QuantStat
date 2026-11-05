import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type {
  EquityAnalytics,
} from './simulationTypes'


interface WealthChartProps {
  random: EquityAnalytics
  dca: EquityAnalytics
  rsi: EquityAnalytics
  lumpSum: EquityAnalytics
}


interface WealthChartPoint {
  date: string
  chartDate: string
  random?: number
  dca?: number
  rsi?: number
  lumpSum?: number
}


function shortDate(
  value: string,
): string {
  return new Date(
    value,
  ).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    },
  )
}


function WealthChart({
  random,
  dca,
  rsi,
  lumpSum,
}: WealthChartProps) {
  const dates =
    new Set<string>()

  for (
    const analytics of [
      random,
      dca,
      rsi,
      lumpSum,
    ]
  ) {
    for (
      const point of
      analytics.equityCurve
    ) {
      dates.add(
        point.date,
      )
    }
  }

  const randomMap =
    new Map(
      random.equityCurve.map(
        point => [
          point.date,
          point.wealth,
        ],
      ),
    )

  const dcaMap =
    new Map(
      dca.equityCurve.map(
        point => [
          point.date,
          point.wealth,
        ],
      ),
    )

  const rsiMap =
    new Map(
      rsi.equityCurve.map(
        point => [
          point.date,
          point.wealth,
        ],
      ),
    )

  const lumpSumMap =
    new Map(
      lumpSum.equityCurve.map(
        point => [
          point.date,
          point.wealth,
        ],
      ),
    )

  const data:
    WealthChartPoint[] =
      [...dates]
        .sort(
          (
            left,
            right,
          ) =>
            new Date(left)
              .getTime() -
            new Date(right)
              .getTime(),
        )
        .map(
          date => ({
            date,
            chartDate:
              shortDate(
                date,
              ),
            random:
              randomMap.get(
                date,
              ),
            dca:
              dcaMap.get(
                date,
              ),
            rsi:
              rsiMap.get(
                date,
              ),
            lumpSum:
              lumpSumMap.get(
                date,
              ),
          }),
        )

  return (
    <section className="chart-card">
      <div className="card-heading">
        <div>
          <h2>
            Portfolio wealth
          </h2>

          <p>
            Historical marked-to-market wealth including uninvested cash
          </p>
        </div>
      </div>

      <div className="chart-container large-chart">
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 12,
              right: 22,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="var(--grid)"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="chartDate"
              minTickGap={45}
              tick={{
                fill:
                  'var(--muted)',
                fontSize: 10,
              }}
            />

            <YAxis
              domain={[
                'auto',
                'auto',
              ]}
              width={82}
              tick={{
                fill:
                  'var(--muted)',
                fontSize: 10,
              }}
              tickFormatter={
                value =>
                  `$${Number(
                    value,
                  ).toLocaleString(
                    'en-US',
                    {
                      maximumFractionDigits: 0,
                    },
                  )}`
              }
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
              formatter={
                value => [
                  new Intl.NumberFormat(
                    'en-US',
                    {
                      style:
                        'currency',
                      currency:
                        'USD',
                      maximumFractionDigits: 2,
                    },
                  ).format(
                    Number(
                      value,
                    ),
                  ),
                  'Wealth',
                ]
              }
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="random"
              name="Random"
              stroke="#6c8cff"
              strokeWidth={2.2}
              dot={false}
              activeDot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="dca"
              name="Regular DCA"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="rsi"
              name="RSI Strategy"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="lumpSum"
              name="Lump Sum / Buy & Hold"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}


export default WealthChart
