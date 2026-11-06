import {
  useEffect,
  useState,
} from 'react'


interface DistributionDemo {
  name: string
  type: string
  parameters: string
  bars: number[]
  mean: string
  meanPosition: number
  axisMinimum: string
  axisMiddle: string
  axisMaximum: string
  statisticLabel: string
  statisticValue: string
}


const distributions:
  DistributionDemo[] = [
    {
      name: 'Normal',
      type: 'Continuous',
      parameters:
        'mu = 0, sigma = 1',
      bars: [
        6,
        10,
        17,
        29,
        45,
        65,
        83,
        96,
        100,
        96,
        83,
        65,
        45,
        29,
        17,
        10,
        6,
      ],
      mean: '0.00',
      meanPosition: 50,
      axisMinimum: '-3',
      axisMiddle: '0',
      axisMaximum: '3',
      statisticLabel:
        'Std. deviation',
      statisticValue: '1.00',
    },
    {
      name: 'Binomial',
      type: 'Discrete',
      parameters:
        'n = 16, p = 0.50',
      bars: [
        1,
        2,
        5,
        11,
        22,
        39,
        61,
        83,
        100,
        83,
        61,
        39,
        22,
        11,
        5,
        2,
        1,
      ],
      mean: '8.00',
      meanPosition: 50,
      axisMinimum: '0',
      axisMiddle: '8',
      axisMaximum: '16',
      statisticLabel:
        'Variance',
      statisticValue: '4.00',
    },
    {
      name: 'Poisson',
      type: 'Discrete',
      parameters:
        'lambda = 4',
      bars: [
        12,
        47,
        78,
        100,
        96,
        76,
        51,
        29,
        15,
        7,
        3,
        1,
        0,
        0,
        0,
        0,
        0,
      ],
      mean: '4.00',
      meanPosition: 33.33,
      axisMinimum: '0',
      axisMiddle: '6',
      axisMaximum: '12',
      statisticLabel:
        'Variance',
      statisticValue: '4.00',
    },
    {
      name: 'Gamma',
      type: 'Continuous',
      parameters:
        'shape alpha = 3, scale theta = 2',
      bars: [
        0,
        9,
        31,
        58,
        82,
        97,
        100,
        93,
        80,
        65,
        50,
        37,
        27,
        19,
        13,
        9,
        6,
      ],
      mean: '6.00',
      meanPosition: 33.33,
      axisMinimum: '0',
      axisMiddle: '9',
      axisMaximum: '18',
      statisticLabel:
        'Skewness',
      statisticValue: '1.15',
    },
    {
      name: 'Pareto Type I',
      type: 'Continuous',
      parameters:
        'xm = 1, alpha = 3',
      bars: [
        100,
        73,
        53,
        39,
        29,
        22,
        17,
        13,
        10,
        8,
        6,
        5,
        4,
        3,
        2,
        2,
        1,
      ],
      mean: '1.50',
      meanPosition: 12.5,
      axisMinimum: '1',
      axisMiddle: '3',
      axisMaximum: '5',
      statisticLabel:
        'Tail',
      statisticValue: 'Heavy',
    },
    {
      name: 'Uniform',
      type: 'Continuous',
      parameters:
        'a = 0, b = 1',
      bars: [
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
        72,
      ],
      mean: '0.50',
      meanPosition: 50,
      axisMinimum: '0',
      axisMiddle: '0.5',
      axisMaximum: '1',
      statisticLabel:
        'Variance',
      statisticValue: '0.0833',
    },
  ]


function StatisticsVisual() {
  const [
    distributionIndex,
    setDistributionIndex,
  ] =
    useState(0)

  useEffect(
    () => {
      const timer =
        window.setInterval(
          () => {
            setDistributionIndex(
              current =>
                (
                  current + 1
                ) %
                distributions.length,
            )
          },
          4000,
        )

      return () =>
        window.clearInterval(
          timer,
        )
    },
    [],
  )

  const distribution =
    distributions[
      distributionIndex
    ]

  return (
    <div className="statistics-visual">
      <div className="statistics-visual-header">
        <div>
          <span>
            DISTRIBUTION
          </span>

          <strong>
            {distribution.name}
          </strong>
        </div>

        <div className="statistics-distribution-type">
          <span>
            TYPE
          </span>

          <strong>
            {distribution.type}
          </strong>
        </div>
      </div>

      <div
        key={distribution.name}
        className="statistics-distribution"
      >
        <div className="statistics-y-label">
          DENSITY / PROBABILITY
        </div>

        <div className="statistics-bars">
          {
            distribution.bars.map(
              (
                height,
                index,
              ) => (
                <i
                  key={
                    `${distribution.name}-${index}`
                  }
                  style={{
                    height:
                      `${height}%`,
                  }}
                />
              ),
            )
          }

          <div
            className="statistics-mean-marker"
            style={{
              left:
                `${distribution.meanPosition}%`,
            }}
          >
            <span>
              MEAN {distribution.mean}
            </span>
          </div>
        </div>

        <div className="statistics-axis">
          <span>
            {distribution.axisMinimum}
          </span>

          <span>
            {distribution.axisMiddle}
          </span>

          <span>
            {distribution.axisMaximum}
          </span>
        </div>
      </div>

      <div className="statistics-visual-footer">
        <div>
          <span>
            PARAMETERS
          </span>

          <strong>
            {distribution.parameters}
          </strong>
        </div>

        <div>
          <span>
            MEAN
          </span>

          <strong>
            {distribution.mean}
          </strong>
        </div>

        <div>
          <span>
            {
              distribution
                .statisticLabel
            }
          </span>

          <strong>
            {
              distribution
                .statisticValue
            }
          </strong>
        </div>

        <small>
          Demonstration distribution
        </small>
      </div>

      <div
        className="statistics-pagination"
        aria-label="Distribution rotation"
      >
        {
          distributions.map(
            (
              item,
              index,
            ) => (
              <span
                key={item.name}
                className={
                  index ===
                  distributionIndex
                    ? 'active'
                    : ''
                }
                title={item.name}
              />
            ),
          )
        }
      </div>
    </div>
  )
}


export default StatisticsVisual