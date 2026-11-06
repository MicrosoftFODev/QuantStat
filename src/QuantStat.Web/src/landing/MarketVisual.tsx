function MarketVisual() {
  return (
    <div className="market-card-visual">
      <div className="market-card-header">
        <div>
          <span>DEMO MARKET</span>
          <strong>AAPL</strong>
        </div>

        <div className="market-card-price">
          <strong>$271.42</strong>
          <span>+1.84%</span>
        </div>
      </div>

      <div className="market-card-chart">
        <div className="market-card-price-level">
          271.42
        </div>

        <svg
          viewBox="0 0 900 230"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="marketCardLine"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
              />
              <stop
                offset="52%"
                stopColor="#2dd4bf"
              />
              <stop
                offset="100%"
                stopColor="#818cf8"
              />
            </linearGradient>

            <linearGradient
              id="marketCardArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
                stopOpacity="0.20"
              />
              <stop
                offset="100%"
                stopColor="#38bdf8"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <path
            className="market-card-area"
            d="M0 175
               C35 164 59 191 93 180
               C128 169 146 120 181 132
               C216 144 230 82 265 94
               C299 106 316 149 351 139
               C386 129 399 173 435 162
               C470 151 489 99 524 108
               C559 117 570 65 606 74
               C642 83 658 118 693 106
               C728 94 744 138 779 119
               C814 100 835 54 900 67
               L900 230
               L0 230 Z"
            fill="url(#marketCardArea)"
          />

          <path
            className="market-card-line-glow"
            d="M0 175
               C35 164 59 191 93 180
               C128 169 146 120 181 132
               C216 144 230 82 265 94
               C299 106 316 149 351 139
               C386 129 399 173 435 162
               C470 151 489 99 524 108
               C559 117 570 65 606 74
               C642 83 658 118 693 106
               C728 94 744 138 779 119
               C814 100 835 54 900 67"
          />

          <path
            className="market-card-line-path"
            d="M0 175
               C35 164 59 191 93 180
               C128 169 146 120 181 132
               C216 144 230 82 265 94
               C299 106 316 149 351 139
               C386 129 399 173 435 162
               C470 151 489 99 524 108
               C559 117 570 65 606 74
               C642 83 658 118 693 106
               C728 94 744 138 779 119
               C814 100 835 54 900 67"
            fill="none"
            stroke="url(#marketCardLine)"
            strokeWidth="3"
          />

          <circle
            className="market-card-current-ring"
            cx="895"
            cy="67"
            r="12"
          />

          <circle
            className="market-card-current"
            cx="895"
            cy="67"
            r="5"
          />
        </svg>

        <div className="market-card-crosshair" />

        <div
          className="market-card-volume"
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="market-card-footer">
        <span>
          <small>INTERVAL</small>
          1 Day
        </span>

        <span>
          <small>PERIOD</small>
          5 Years
        </span>

        <span>
          <small>DATA</small>
          Market observations
        </span>

        <em>
          Demonstration visualization
        </em>
      </div>
    </div>
  )
}


export default MarketVisual