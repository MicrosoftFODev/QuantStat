function RsiVisual() {
  return (
    <div
      className="rsi-visual"
      aria-label="Demonstration RSI oscillator"
    >
      <div className="rsi-visual-header">
        <div>
          <span>RSI OSCILLATOR</span>
          <strong>Wilder / 14</strong>
        </div>

        <div className="rsi-current-value">
          <span>CURRENT</span>
          <strong>61.2</strong>
        </div>
      </div>

      <div className="rsi-plot">
        <div className="rsi-zone rsi-zone-70">
          <span>70</span>
          <small>OVERBOUGHT</small>
        </div>

        <div className="rsi-zone rsi-zone-50">
          <span>50</span>
          <small>NEUTRAL</small>
        </div>

        <div className="rsi-zone rsi-zone-30">
          <span>30</span>
          <small>OVERSOLD</small>
        </div>

        <svg
          viewBox="0 0 900 240"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="rsiLineGradient"
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
                offset="50%"
                stopColor="#38bdf8"
              />
              <stop
                offset="100%"
                stopColor="#818cf8"
              />
            </linearGradient>

            <filter
              id="rsiGlow"
              x="-20%"
              y="-30%"
              width="140%"
              height="160%"
            >
              <feGaussianBlur
                stdDeviation="4"
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            className="rsi-path-glow"
            d="M0 165
               C35 164 58 188 91 177
               C124 166 137 117 171 125
               C205 133 216 87 250 76
               C283 65 299 111 334 119
               C368 127 384 179 419 172
               C453 165 469 135 504 140
               C538 145 552 94 587 89
               C622 84 638 48 673 57
               C708 66 718 112 753 105
               C788 98 804 138 839 126
               C862 118 879 85 900 92"
          />

          <path
            className="rsi-path"
            d="M0 165
               C35 164 58 188 91 177
               C124 166 137 117 171 125
               C205 133 216 87 250 76
               C283 65 299 111 334 119
               C368 127 384 179 419 172
               C453 165 469 135 504 140
               C538 145 552 94 587 89
               C622 84 638 48 673 57
               C708 66 718 112 753 105
               C788 98 804 138 839 126
               C862 118 879 85 900 92"
          />

          <circle
            className="rsi-current-ring"
            cx="898"
            cy="92"
            r="12"
          />

          <circle
            className="rsi-current-dot"
            cx="898"
            cy="92"
            r="5"
          />
        </svg>

        <div
          className="rsi-scan"
          aria-hidden="true"
        />
      </div>

      <div className="rsi-visual-footer">
        <span>
          Wilder
        </span>

        <span>
          Cutler
        </span>

        <span>
          Exponential
        </span>

        <small>
          Demonstration visualization
        </small>
      </div>
    </div>
  )
}


export default RsiVisual