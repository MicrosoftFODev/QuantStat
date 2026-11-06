const simulationPaths = [
  'M18 128 C90 126 126 105 195 99 C265 93 315 69 382 59 C452 49 510 32 585 22',
  'M18 128 C88 128 132 115 198 109 C267 103 320 85 389 78 C458 71 516 55 585 48',
  'M18 128 C88 126 135 119 201 115 C269 111 324 99 392 94 C461 89 520 80 585 73',
  'M18 128 C90 128 137 125 203 123 C272 121 326 114 395 112 C465 110 520 102 585 99',
  'M18 128 C90 130 139 137 206 135 C275 133 330 141 399 139 C468 137 522 146 585 143',
  'M18 128 C91 131 140 148 208 151 C277 154 333 169 401 173 C470 177 526 194 585 200',
  'M18 128 C91 129 138 116 205 117 C274 118 328 103 397 107 C466 111 521 92 585 90',
  'M18 128 C89 127 136 135 203 130 C271 125 327 143 394 134 C463 125 519 145 585 131',
  'M18 128 C90 127 136 111 202 106 C270 101 324 82 391 70 C459 58 515 39 585 31',
  'M18 128 C89 130 137 143 203 147 C271 151 326 159 394 165 C462 171 518 181 585 187',
  'M18 128 C89 128 137 122 203 119 C271 116 326 106 394 101 C462 96 520 87 585 82',
  'M18 128 C89 129 137 133 203 136 C271 139 325 129 394 132 C463 135 519 126 585 129',
]


function MonteCarloVisual() {
  return (
    <div className="monte-carlo-visual">
      <div className="monte-carlo-header">
        <div>
          <span>
            MONTE CARLO EXPERIMENT
          </span>

          <strong>
            Strategy outcome paths
          </strong>
        </div>

        <div className="monte-carlo-status">
          <span>
            RUNS
          </span>

          <strong>
            1,000
          </strong>
        </div>
      </div>

      <div className="monte-carlo-chart">
        <div className="monte-carlo-axis-label monte-carlo-high">
          95TH PERCENTILE
        </div>

        <div className="monte-carlo-axis-label monte-carlo-median-label">
          MEDIAN
        </div>

        <div className="monte-carlo-axis-label monte-carlo-low">
          5TH PERCENTILE
        </div>

        <svg
          viewBox="0 0 620 230"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="monteCarloBand"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
                stopOpacity="0.03"
              />

              <stop
                offset="100%"
                stopColor="#818cf8"
                stopOpacity="0.20"
              />
            </linearGradient>

            <linearGradient
              id="monteCarloMedian"
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
            className="monte-carlo-band"
            d="M18 128
               C95 118 141 91 205 77
               C276 61 328 40 397 29
               C466 18 521 8 585 4
               L585 205
               C522 197 468 185 399 177
               C330 169 275 151 206 145
               C139 139 91 131 18 128 Z"
            fill="url(#monteCarloBand)"
          />

          {
            simulationPaths.map(
              (
                path,
                index,
              ) => (
                <path
                  key={path}
                  className="monte-carlo-path"
                  style={{
                    animationDelay:
                      `${index * 45}ms`,
                  }}
                  d={path}
                />
              ),
            )
          }

          <path
            className="monte-carlo-median"
            d="M18 128
               C90 128 137 122 203 119
               C271 116 326 106 394 101
               C462 96 520 87 585 82"
            fill="none"
            stroke="url(#monteCarloMedian)"
            strokeWidth="3"
          />

          <circle
            className="monte-carlo-origin"
            cx="18"
            cy="128"
            r="5"
          />

          <circle
            className="monte-carlo-median-dot"
            cx="585"
            cy="82"
            r="5"
          />
        </svg>

        <div className="monte-carlo-origin-label">
          SAME STARTING CAPITAL
        </div>
      </div>

      <div className="monte-carlo-metrics">
        <div>
          <span>
            RUNS
          </span>

          <strong>
            1,000
          </strong>

          <small>
            Historical windows
          </small>
        </div>

        <div>
          <span>
            INTERVAL
          </span>

          <strong>
            95% CI
          </strong>

          <small>
            Wilson score
          </small>
        </div>

        <div>
          <span>
            RANDOMNESS
          </span>

          <strong>
            Seeded
          </strong>

          <small>
            Reproducible
          </small>
        </div>

        <div>
          <span>
            COMPARISON
          </span>

          <strong>
            Equal budget
          </strong>

          <small>
            Same environment
          </small>
        </div>
      </div>

      <div className="monte-carlo-note">
        Illustrative simulation paths.
        QuantStat evaluates strategies across
        consistently sampled historical environments.
      </div>
    </div>
  )
}


export default MonteCarloVisual