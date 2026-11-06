function ForecastVisual() {
  return (
    <div className="forecast-visual">
      <div className="forecast-visual-header">
        <div>
          <span>
            FORECAST RESEARCH
          </span>

          <strong>
            Historical observations to uncertainty
          </strong>
        </div>

        <div className="forecast-next-badge">
          COMING NEXT
        </div>
      </div>

      <div className="forecast-chart">
        <svg
          viewBox="0 0 700 260"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="forecastHistoryGradient"
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

            <linearGradient
              id="forecastIntervalGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#818cf8"
                stopOpacity="0.04"
              />

              <stop
                offset="100%"
                stopColor="#818cf8"
                stopOpacity="0.24"
              />
            </linearGradient>
          </defs>

          <path
            className="forecast-history-path"
            d="M15 185
               L45 176
               L76 181
               L107 157
               L138 165
               L169 139
               L200 148
               L231 112
               L262 127
               L293 101
               L324 115
               L350 92"
            fill="none"
            stroke="url(#forecastHistoryGradient)"
            strokeWidth="3"
          />

          <path
            className="forecast-interval-band"
            d="M350 92
               C405 63 454 45 505 32
               C559 18 611 10 685 5
               L685 194
               C612 184 558 172 505 157
               C453 142 404 123 350 92 Z"
            fill="url(#forecastIntervalGradient)"
          />

          <path
            className="forecast-upper-bound"
            d="M350 92
               C405 63 454 45 505 32
               C559 18 611 10 685 5"
          />

          <path
            className="forecast-lower-bound"
            d="M350 92
               C404 123 453 142 505 157
               C558 172 612 184 685 194"
          />

          <path
            className="forecast-center-path"
            d="M350 92
               C404 91 454 92 505 96
               C557 100 610 104 685 111"
          />

          <line
            className="forecast-origin-line"
            x1="350"
            y1="18"
            x2="350"
            y2="224"
          />

          <circle
            className="forecast-origin-dot"
            cx="350"
            cy="92"
            r="5"
          />
        </svg>

        <div className="forecast-origin-label">
          FORECAST ORIGIN
        </div>

        <div className="forecast-bound-label forecast-upper-label">
          UPPER
        </div>

        <div className="forecast-bound-label forecast-central-label">
          CENTRAL FORECAST
        </div>

        <div className="forecast-bound-label forecast-lower-label">
          LOWER
        </div>

        <div className="forecast-horizon">
          <span>
            HISTORY
          </span>

          <span>
            +1
          </span>

          <span>
            +5
          </span>

          <span>
            +10
          </span>
        </div>
      </div>

      <div className="forecast-summary">
        <div>
          <span>
            INPUT
          </span>

          <strong>
            Historical observations
          </strong>
        </div>

        <div>
          <span>
            OUTPUT
          </span>

          <strong>
            Forecast distribution
          </strong>
        </div>

        <div>
          <span>
            FOCUS
          </span>

          <strong>
            Uncertainty & diagnostics
          </strong>
        </div>
      </div>

      <div className="forecast-note">
        Concept preview. Forecasting models and validation
        will form the final major QuantStat research module.
      </div>
    </div>
  )
}


export default ForecastVisual