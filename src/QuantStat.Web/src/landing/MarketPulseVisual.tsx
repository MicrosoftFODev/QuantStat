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

    pricePath:
      'M0 238 L35 231 L67 239 L96 220 L128 225 L158 203 L193 211 L226 181 L260 190 L294 163 L329 171 L361 188 L394 168 L426 174 L459 149 L491 158 L523 135 L558 143 L590 119 L621 127 L655 103 L688 112 L719 91 L752 98 L786 82 L817 94 L850 73 L883 81 L916 61 L948 69 L1000 55',

    areaPath:
      'M0 238 L35 231 L67 239 L96 220 L128 225 L158 203 L193 211 L226 181 L260 190 L294 163 L329 171 L361 188 L394 168 L426 174 L459 149 L491 158 L523 135 L558 143 L590 119 L621 127 L655 103 L688 112 L719 91 L752 98 L786 82 L817 94 L850 73 L883 81 L916 61 L948 69 L1000 55 L1000 310 L0 310 Z',

    priceEndY: 68,

    rsiPath:
      'M0 159 C38 176 61 183 99 165 C137 147 154 103 193 116 C232 129 249 74 288 86 C327 98 346 147 385 135 C424 123 439 167 479 151 C519 135 537 91 577 104 C617 117 636 69 676 78 C716 87 735 122 775 110 C815 98 837 137 877 119 C917 101 942 72 1000 84',

    rsiEndY: 84,
  },
  {
    symbol: 'BTC/USD',
    market: 'Crypto',
    price: '102,846',
    change: '+2.31%',
    rsi: '58.4',

    pricePath:
      'M0 202 L31 171 L63 188 L96 151 L129 176 L161 133 L194 149 L225 112 L258 164 L291 137 L323 189 L356 146 L389 104 L422 127 L455 92 L487 151 L520 119 L553 72 L585 101 L618 61 L651 116 L684 91 L717 142 L750 109 L783 78 L816 98 L849 67 L882 121 L915 96 L948 132 L1000 105',

    areaPath:
      'M0 202 L31 171 L63 188 L96 151 L129 176 L161 133 L194 149 L225 112 L258 164 L291 137 L323 189 L356 146 L389 104 L422 127 L455 92 L487 151 L520 119 L553 72 L585 101 L618 61 L651 116 L684 91 L717 142 L750 109 L783 78 L816 98 L849 67 L882 121 L915 96 L948 132 L1000 105 L1000 310 L0 310 Z',

    priceEndY: 105,

    rsiPath:
      'M0 134 C36 79 65 190 103 158 C141 126 160 58 200 91 C240 124 258 184 298 147 C338 110 354 197 395 166 C436 135 454 70 495 92 C536 114 552 176 594 142 C636 108 654 49 696 72 C738 95 758 166 800 139 C842 112 864 188 905 149 C946 110 969 94 1000 116',

    rsiEndY: 116,
  },
  {
    symbol: 'NVDA',
    market: 'Stock',
    price: '198.63',
    change: '+1.16%',
    rsi: '61.2',

    pricePath:
      'M0 261 L34 252 L68 257 L101 239 L135 244 L168 219 L201 226 L235 207 L268 214 L301 181 L335 190 L368 171 L401 178 L435 146 L468 158 L501 131 L535 139 L568 113 L601 124 L635 96 L668 108 L701 82 L735 94 L768 71 L801 83 L835 58 L868 74 L902 49 L935 61 L968 42 L1000 51',

    areaPath:
      'M0 261 L34 252 L68 257 L101 239 L135 244 L168 219 L201 226 L235 207 L268 214 L301 181 L335 190 L368 171 L401 178 L435 146 L468 158 L501 131 L535 139 L568 113 L601 124 L635 96 L668 108 L701 82 L735 94 L768 71 L801 83 L835 58 L868 74 L902 49 L935 61 L968 42 L1000 51 L1000 310 L0 310 Z',

    priceEndY: 51,

    rsiPath:
      'M0 175 C39 181 59 147 98 158 C137 169 155 120 195 132 C235 144 254 94 294 108 C334 122 352 157 392 145 C432 133 450 84 491 98 C532 112 551 67 592 79 C633 91 652 126 693 113 C734 100 753 60 794 72 C835 84 856 125 897 108 C938 91 961 70 1000 81',

    rsiEndY: 81,
  },
  {
    symbol: 'MSFT',
    market: 'Stock',
    price: '487.23',
    change: '+0.72%',
    rsi: '56.7',

    pricePath:
      'M0 218 C42 206 68 224 110 210 C152 196 173 171 215 181 C257 191 278 148 320 160 C362 172 383 138 425 149 C467 160 488 124 530 137 C572 150 593 111 635 123 C677 135 698 96 740 110 C782 124 804 88 846 101 C888 114 925 75 1000 86',

    areaPath:
      'M0 218 C42 206 68 224 110 210 C152 196 173 171 215 181 C257 191 278 148 320 160 C362 172 383 138 425 149 C467 160 488 124 530 137 C572 150 593 111 635 123 C677 135 698 96 740 110 C782 124 804 88 846 101 C888 114 925 75 1000 86 L1000 310 L0 310 Z',

    priceEndY: 86,

    rsiPath:
      'M0 134 C36 79 65 190 103 158 C141 126 160 58 200 91 C240 124 258 184 298 147 C338 110 354 197 395 166 C436 135 454 70 495 92 C536 114 552 176 594 142 C636 108 654 49 696 72 C738 95 758 166 800 139 C842 112 864 188 905 149 C946 110 969 94 1000 116',

    rsiEndY: 116,
  },
  {
    symbol: 'ETH/USD',
    market: 'Crypto',
    price: '3,486.20',
    change: '+3.08%',
    rsi: '64.1',

    pricePath:
      'M0 242 C37 205 70 253 108 220 C146 187 164 145 204 166 C244 187 263 112 304 138 C345 164 361 207 403 175 C445 143 462 88 504 114 C546 140 565 72 607 101 C649 130 668 178 710 143 C752 108 771 59 814 87 C857 115 879 148 922 111 C955 83 975 56 1000 63',

    areaPath:
      'M0 242 C37 205 70 253 108 220 C146 187 164 145 204 166 C244 187 263 112 304 138 C345 164 361 207 403 175 C445 143 462 88 504 114 C546 140 565 72 607 101 C649 130 668 178 710 143 C752 108 771 59 814 87 C857 115 879 148 922 111 C955 83 975 56 1000 63 L1000 310 L0 310 Z',

    priceEndY: 63,

    rsiPath:
      'M0 159 C38 176 61 183 99 165 C137 147 154 103 193 116 C232 129 249 74 288 86 C327 98 346 147 385 135 C424 123 439 167 479 151 C519 135 537 91 577 104 C617 117 636 69 676 78 C716 87 735 122 775 110 C815 98 837 137 877 119 C917 101 942 72 1000 84',

    rsiEndY: 84,
  },
  {
    symbol: 'TSLA',
    market: 'Stock',
    price: '438.17',
    change: '-1.37%',
    rsi: '47.9',

    pricePath:
      'M0 111 C39 82 67 154 107 131 C147 108 165 189 206 162 C247 135 267 79 308 105 C349 131 367 197 409 169 C451 141 468 218 511 184 C554 150 573 91 616 119 C659 147 679 205 722 170 C765 135 785 92 828 121 C871 150 893 194 936 165 C964 146 981 172 1000 158',

    areaPath:
      'M0 111 C39 82 67 154 107 131 C147 108 165 189 206 162 C247 135 267 79 308 105 C349 131 367 197 409 169 C451 141 468 218 511 184 C554 150 573 91 616 119 C659 147 679 205 722 170 C765 135 785 92 828 121 C871 150 893 194 936 165 C964 146 981 172 1000 158 L1000 310 L0 310 Z',

    priceEndY: 158,

    rsiPath:
      'M0 134 C36 79 65 190 103 158 C141 126 160 58 200 91 C240 124 258 184 298 147 C338 110 354 197 395 166 C436 135 454 70 495 92 C536 114 552 176 594 142 C636 108 654 49 696 72 C738 95 758 166 800 139 C842 112 864 188 905 149 C946 110 969 94 1000 116',

    rsiEndY: 116,
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
          4000,
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
          key={`${market.symbol}-price`}
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
            d={market.areaPath}
            fill="url(#pulseAreaGradient)"
          />

          <path
            className="pulse-price-glow"
            d={market.pricePath}
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.24"
            strokeWidth="9"
            filter="url(#pulseGlow)"
          />

          <path
            className="pulse-price-line"
            d={market.pricePath}
            fill="none"
            stroke="url(#pulsePriceGradient)"
            strokeWidth="3"
          />

          <circle
            className="pulse-endpoint-ring"
            cx="997"
            cy={market.priceEndY}
            r="12"
          />

          <circle
            className="pulse-endpoint"
            cx="997"
            cy={market.priceEndY}
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

      <div className="pulse-rsi-panel">
        <div className="pulse-rsi-header">
          <div>
            <span>
              MOMENTUM / RSI
            </span>

            <strong>
              Wilder 14
            </strong>
          </div>

          <div className="pulse-rsi-reading">
            <span>
              CURRENT
            </span>

            <strong>
              {market.rsi}
            </strong>
          </div>
        </div>

        <div className="pulse-rsi-chart">
          <div className="pulse-rsi-level pulse-rsi-70">
            <span>70</span>
            <small>OVERBOUGHT</small>
            <i />
          </div>

          <div className="pulse-rsi-level pulse-rsi-50">
            <span>50</span>
            <small>NEUTRAL</small>
            <i />
          </div>

          <div className="pulse-rsi-level pulse-rsi-30">
            <span>30</span>
            <small>OVERSOLD</small>
            <i />
          </div>

          <svg
            key={`${market.symbol}-rsi`}
            viewBox="0 0 1000 230"
            preserveAspectRatio="none"
            role="presentation"
          >
            <defs>
              <linearGradient
                id="pulseRsiGradient"
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
            </defs>

            <path
              className="pulse-rsi-glow"
              d={market.rsiPath}
            />

            <path
              className="pulse-rsi-path"
              d={market.rsiPath}
              fill="none"
              stroke="url(#pulseRsiGradient)"
              strokeWidth="3"
            />

            <circle
              className="pulse-rsi-ring"
              cx="995"
              cy={market.rsiEndY}
              r="12"
            />

            <circle
              className="pulse-rsi-dot"
              cx="995"
              cy={market.rsiEndY}
              r="5"
            />
          </svg>

          <div
            className="pulse-rsi-crosshair"
            aria-hidden="true"
          />
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
