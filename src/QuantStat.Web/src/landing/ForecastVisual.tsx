import {
  useEffect,
  useState,
} from 'react'


function ForecastVisual() {
  const [
    modelIndex,
    setModelIndex,
  ] =
    useState(0)

  useEffect(
    () => {
      const timer =
        window.setInterval(
          () => {
            setModelIndex(
              current =>
                (
                  current + 1
                ) % 2,
            )
          },
          5000,
        )

      return () =>
        window.clearInterval(
          timer,
        )
    },
    [],
  )

  const capm =
    modelIndex === 0

  return (
    <div className="forecast-model-visual">
      <div className="forecast-model-header">
        <div>
          <span>
            MODEL PREVIEW
          </span>

          <strong>
            {
              capm
                ? 'CAPM'
                : 'GARCH (1,1)'
            }
          </strong>
        </div>

        <div className="forecast-model-badge">
          COMING NEXT
        </div>
      </div>

      {
        capm
          ? (
            <div
              key="capm"
              className="capm-preview"
            >
              <div className="capm-y-label">
                EXPECTED RETURN
              </div>

              <svg
                viewBox="0 0 650 235"
                preserveAspectRatio="none"
                role="presentation"
              >
                <line
                  className="capm-axis-x"
                  x1="55"
                  y1="195"
                  x2="620"
                  y2="195"
                />

                <line
                  className="capm-axis-y"
                  x1="55"
                  y1="20"
                  x2="55"
                  y2="195"
                />

                <line
                  className="capm-sml"
                  x1="55"
                  y1="174"
                  x2="605"
                  y2="37"
                />

                <circle
                  className="capm-market-dot"
                  cx="335"
                  cy="104"
                  r="5"
                />

                <circle
                  className="capm-asset-dot"
                  cx="420"
                  cy="83"
                  r="6"
                />

                <line
                  className="capm-beta-guide"
                  x1="420"
                  y1="83"
                  x2="420"
                  y2="195"
                />
              </svg>

              <div className="capm-risk-free">
                Risk-free rate
              </div>

              <div className="capm-market-label">
                Market
              </div>

              <div className="capm-asset-label">
                Asset
              </div>

              <div className="capm-beta-label">
                beta = 1.18
              </div>

              <div className="capm-x-label">
                SYSTEMATIC RISK / BETA
              </div>
            </div>
          )
          : (
            <div
              key="garch"
              className="garch-preview"
            >
              <div className="garch-y-label">
                CONDITIONAL VOLATILITY
              </div>

              <svg
                viewBox="0 0 650 235"
                preserveAspectRatio="none"
                role="presentation"
              >
                <defs>
                  <linearGradient
                    id="garchGradient"
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
                      stopColor="#818cf8"
                    />
                  </linearGradient>

                  <linearGradient
                    id="garchArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#818cf8"
                      stopOpacity="0.22"
                    />

                    <stop
                      offset="100%"
                      stopColor="#818cf8"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  className="garch-area"
                  d="M20 190
                     L50 185
                     L80 181
                     L110 187
                     L140 172
                     L170 178
                     L200 163
                     L230 170
                     L260 122
                     L290 79
                     L320 117
                     L350 151
                     L380 164
                     L410 149
                     L440 111
                     L470 52
                     L500 83
                     L530 131
                     L560 151
                     L590 139
                     L620 160
                     L620 210
                     L20 210 Z"
                  fill="url(#garchArea)"
                />

                <path
                  className="garch-path"
                  d="M20 190
                     L50 185
                     L80 181
                     L110 187
                     L140 172
                     L170 178
                     L200 163
                     L230 170
                     L260 122
                     L290 79
                     L320 117
                     L350 151
                     L380 164
                     L410 149
                     L440 111
                     L470 52
                     L500 83
                     L530 131
                     L560 151
                     L590 139
                     L620 160"
                  fill="none"
                  stroke="url(#garchGradient)"
                  strokeWidth="3"
                />
              </svg>

              <div className="garch-low">
                LOWER VOLATILITY
              </div>

              <div className="garch-high">
                VOLATILITY CLUSTER
              </div>

              <div className="garch-x-label">
                TIME
              </div>
            </div>
          )
      }

      <div className="forecast-model-footer">
        <span
          className={
            capm
              ? 'active'
              : ''
          }
        >
          CAPM
        </span>

        <span
          className={
            !capm
              ? 'active'
              : ''
          }
        >
          GARCH
        </span>

        <small>
          Concept preview
        </small>
      </div>
    </div>
  )
}


export default ForecastVisual