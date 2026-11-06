import {
  useEffect,
  useState,
} from 'react'


const demoMarkets = [
  {
    symbol: 'AAPL',
    market: 'Stock',
    price: '271.42',
    change: '+1.84%',
    rsi: '63.8',
    volatility: '18.7%',
  },
  {
    symbol: 'BTC/USD',
    market: 'Crypto',
    price: '102,846',
    change: '+2.31%',
    rsi: '58.4',
    volatility: '42.1%',
  },
  {
    symbol: 'NVDA',
    market: 'Stock',
    price: '198.63',
    change: '+1.16%',
    rsi: '61.2',
    volatility: '37.4%',
  },
]


function MarketPulseVisual() {
  const [
    marketIndex,
    setMarketIndex,
  ] =
    useState(0)

  useEffect(
    () => {
      const timer =
        window.setInterval(
          () => {
            setMarketIndex(
              current =>
                (
                  current + 1
                ) %
                demoMarkets.length,
            )
          },
          3200,
        )

      return () =>
        window.clearInterval(
          timer,
        )
    },
    [],
  )

  const market =
    demoMarkets[
      marketIndex
    ]

  return (
    <section
      className="pulse-terminal"
      aria-label="QuantStat demonstration market visualization"
    >
      <div className="pulse-topbar">
        <div>
          <span className="pulse-status-dot" />

          <span>
            DEMONSTRATION VISUAL
          </span>
        </div>

        <span>
          QUANTSTAT ANALYTICS
        </span>
      </div>

      <div className="pulse-market-header">
        <div>
          <span className="pulse-market-type">
            {market.market}
          </span>

          <strong>
            {market.symbol}
          </strong>
        </div>

        <div className="pulse-price-block">
          <strong>
            {market.price}
          </strong>

          <span>
            {market.change}
          </span>
        </div>
      </div>

      <div className="pulse-chart">
        <div
          className="pulse-crosshair"
          aria-hidden="true"
        />

        <svg
          viewBox="0 0 1000 310"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="pulsePriceGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#0ea5e9"
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
              id="pulseAreaGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#2dd4bf"
                stopOpacity="0.23"
              />

              <stop
                offset="100%"
                stopColor="#2dd4bf"
                stopOpacity="0"
              />
            </linearGradient>

            <filter
              id="pulseGlow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur
                stdDeviation="5"
                result="blur"
              />

              <feMerge>
                <feMergeNode
                  in="blur"
                />
                <feMergeNode
                  in="SourceGraphic"
                />
              </feMerge>
            </filter>
          </defs>

          <path
            className="pulse-area"
            d="M0 248 C55 242 72 218 120 224 C172 230 191 179 241 192 C290 205 318 159 366 170 C416 182 437 126 486 143 C532 159 563 103 608 119 C655 136 686 88 728 101 C775 115 808 65 849 80 C895 96 927 44 1000 55 L1000 310 L0 310 Z"
            fill="url(#pulseAreaGradient)"
          />

          <path
            className="pulse-price-glow"
            d="M0 248 C55 242 72 218 120 224 C172 230 191 179 241 192 C290 205 318 159 366 170 C416 182 437 126 486 143 C532 159 563 103 608 119 C655 136 686 88 728 101 C775 115 808 65 849 80 C895 96 927 44 1000 55"
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.24"
            strokeWidth="9"
            filter="url(#pulseGlow)"
          />

          <path
            className="pulse-price-line"
            d="M0 248 C55 242 72 218 120 224 C172 230 191 179 241 192 C290 205 318 159 366 170 C416 182 437 126 486 143 C532 159 563 103 608 119 C655 136 686 88 728 101 C775 115 808 65 849 80 C895 96 927 44 1000 55"
            fill="none"
            stroke="url(#pulsePriceGradient)"
            strokeWidth="3"
          />

          <circle
            className="pulse-endpoint-ring"
            cx="997"
            cy="55"
            r="12"
          />

          <circle
            className="pulse-endpoint"
            cx="997"
            cy="55"
            r="5"
          />
        </svg>

        <div
          className="pulse-volume"
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
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="pulse-statistics">
        <div>
          <span>
            RSI
          </span>

          <strong>
            {market.rsi}
          </strong>

          <small>
            Momentum
          </small>
        </div>

        <div>
          <span>
            VOLATILITY
          </span>

          <strong>
            {market.volatility}
          </strong>

          <small>
            Risk
          </small>
        </div>

        <div>
          <span>
            ANALYSIS
          </span>

          <strong>
            Monte Carlo
          </strong>

          <small>
            1,000 runs
          </small>
        </div>

        <div>
          <span>
            MODEL
          </span>

          <strong>
            Statistical
          </strong>

          <small>
            Reproducible
          </small>
        </div>
      </div>

      <div className="pulse-disclaimer">
        Illustrative interface animation.
        Values are demonstration data,
        not live market quotes.
      </div>
    </section>
  )
}


export default MarketPulseVisual