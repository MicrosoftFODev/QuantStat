const simulationPaths = [
  'M20 130 C95 127 145 104 215 96 C291 87 348 59 425 51 C500 43 555 26 620 20',
  'M20 130 C94 128 146 113 217 108 C290 103 350 81 426 75 C502 69 558 50 620 46',
  'M20 130 C94 128 147 119 219 116 C292 113 351 99 428 95 C504 91 560 76 620 72',
  'M20 130 C96 129 149 126 220 124 C294 122 354 114 430 112 C506 110 564 101 620 98',
  'M20 130 C95 131 150 137 222 136 C296 135 356 142 432 141 C508 140 565 148 620 151',
  'M20 130 C95 132 151 149 223 153 C298 157 358 171 434 177 C510 183 567 199 620 207',
  'M20 130 C95 129 149 116 221 118 C295 120 355 101 431 107 C507 113 565 91 620 88',
  'M20 130 C94 129 148 136 220 132 C294 128 353 145 429 136 C505 127 563 145 620 132',
  'M20 130 C95 128 147 111 219 105 C292 99 351 79 427 67 C503 55 560 38 620 31',
  'M20 130 C94 131 148 144 220 149 C294 154 354 164 430 169 C506 174 563 187 620 194',
  'M20 130 C95 129 149 123 221 120 C295 117 355 106 431 101 C507 96 565 85 620 81',
  'M20 130 C94 130 149 134 220 137 C295 140 355 129 431 133 C507 137 564 126 620 129',
]


function MonteCarloVisual() {
  return (
    <div className="monte-carlo-visual">
      <div className="monte-carlo-header">
        <div>
          <span>
            MONTE CARLO ANALYSIS
          </span>

          <strong>
            Outcome distribution across historical windows
          </strong>
        </div>

        <div className="monte-carlo-run-count">
          <strong>
            1,000
          </strong>

          <span>
            RUNS
          </span>
        </div>
      </div>

      <div className="monte-carlo-chart">
        <svg
          viewBox="0 0 650 230"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="mcEnvelope"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
                stopOpacity="0"
              />

              <stop
                offset="100%"
                stopColor="#818cf8"
                stopOpacity="0.19"
              />
            </linearGradient>

            <linearGradient
              id="mcMedian"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#2dd4bf"
              />

              <stop
                offset="100%"
                stopColor="#38bdf8"
              />
            </linearGradient>
          </defs>

          <path
            className="mc-envelope"
            d="M20 130
               C100 112 153 80 220 67
               C298 52 357 31 432 22
               C509 13 565 7 620 5
               L620 211
               C565 205 509 193 434 181
               C359 169 298 154 223 148
               C151 142 95 133 20 130 Z"
            fill="url(#mcEnvelope)"
          />

          {
            simulationPaths.map(
              (
                path,
                index,
              ) => (
                <path
                  key={path}
                  className="mc-path"
                  d={path}
                  style={{
                    animationDelay:
                      `${index * 35}ms`,
                  }}
                />
              ),
            )
          }

          <path
            className="mc-median"
            d="M20 130
               C95 129 149 123 221 120
               C295 117 355 106 431 101
               C507 96 565 85 620 81"
            fill="none"
            stroke="url(#mcMedian)"
            strokeWidth="3"
          />

          <circle
            className="mc-origin"
            cx="20"
            cy="130"
            r="5"
          />

          <circle
            className="mc-endpoint"
            cx="620"
            cy="81"
            r="5"
          />
        </svg>

        <div className="mc-start-label">
          SAME STARTING CAPITAL
        </div>

        <div className="mc-percentile mc-percentile-high">
          95TH
        </div>

        <div className="mc-percentile mc-percentile-median">
          MEDIAN
        </div>

        <div className="mc-percentile mc-percentile-low">
          5TH
        </div>
      </div>

      <div className="monte-carlo-summary">
        <div>
          <span>
            INTERVAL
          </span>

          <strong>
            95% Wilson CI
          </strong>
        </div>

        <div>
          <span>
            RANDOMNESS
          </span>

          <strong>
            Seeded
          </strong>
        </div>

        <div>
          <span>
            COMPARISON
          </span>

          <strong>
            Equal starting budget
          </strong>
        </div>
      </div>

      <div className="monte-carlo-note">
        Illustrative paths. QuantStat compares strategies
        under consistently sampled historical environments.
      </div>
    </div>
  )
}


export default MonteCarloVisual