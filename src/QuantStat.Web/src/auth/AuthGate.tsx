import {
  InteractionStatus,
} from '@azure/msal-browser'

import {
  useIsAuthenticated,
  useMsal,
} from '@azure/msal-react'

import type {
  PropsWithChildren,
} from 'react'

import {
  useQuantStatAuth,
} from './AuthContext'

import GoogleSignInButton
  from './GoogleSignInButton'

import {
  loginRequest,
} from './msalConfig'


function AuthGate({
  children,
}: PropsWithChildren) {
  const microsoftAuthenticated =
    useIsAuthenticated()

  const {
    googleUser,
  } =
    useQuantStatAuth()

  const {
    instance,
    inProgress,
  } =
    useMsal()

  if (
    microsoftAuthenticated ||
    googleUser
  ) {
    return (
      <>
        {children}
      </>
    )
  }

  const microsoftLoading =
    inProgress !==
    InteractionStatus.None

  return (
    <main className="quantstat-landing">
      <div
        className="landing-orb landing-orb-one"
        aria-hidden="true"
      />

      <div
        className="landing-orb landing-orb-two"
        aria-hidden="true"
      />

      <div
        className="landing-grid"
        aria-hidden="true"
      />

      <header className="landing-header">
        <div className="landing-brand">
          <div className="landing-brand-mark">
            QS
          </div>

          <div>
            <strong>
              QuantStat
            </strong>
            <span>
              Quantitative Research Platform
            </span>
          </div>
        </div>

        <div className="landing-header-status">
          <span />
          Research environment
        </div>
      </header>

      <section className="landing-content">
        <div className="landing-hero">
          <div className="landing-eyebrow">
            QUANTITATIVE MARKET INTELLIGENCE
          </div>

          <h1>
            Understand markets
            <br />
            beyond the
            {' '}
            <span>
              price.
            </span>
          </h1>

          <p className="landing-lead">
            Explore financial markets through
            statistical analysis, quantitative
            diagnostics and reproducible strategy
            simulation.
          </p>

          <div className="landing-capabilities">
            <article>
              <span className="capability-number">
                01
              </span>

              <strong>
                Explore
              </strong>

              <p>
                Stocks and crypto with interactive
                market analytics.
              </p>
            </article>

            <article>
              <span className="capability-number">
                02
              </span>

              <strong>
                Understand
              </strong>

              <p>
                Statistics, distributions and
                quantitative diagnostics.
              </p>
            </article>

            <article>
              <span className="capability-number">
                03
              </span>

              <strong>
                Experiment
              </strong>

              <p>
                Historical strategies and
                reproducible Monte Carlo analysis.
              </p>
            </article>
          </div>

          <div
            className="landing-market-visual"
            aria-hidden="true"
          >
            <div className="market-visual-top">
              <span>
                QUANTSTAT / RESEARCH
              </span>

              <span className="market-live">
                LIVE ANALYTICS
              </span>
            </div>

            <svg
              viewBox="0 0 900 220"
              preserveAspectRatio="none"
              role="presentation"
            >
              <defs>
                <linearGradient
                  id="quantstatLine"
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
                    offset="55%"
                    stopColor="#2dd4bf"
                  />
                  <stop
                    offset="100%"
                    stopColor="#818cf8"
                  />
                </linearGradient>

                <linearGradient
                  id="quantstatArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#38bdf8"
                    stopOpacity="0.24"
                  />
                  <stop
                    offset="100%"
                    stopColor="#38bdf8"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              <path
                className="market-area"
                d="M0 178 C55 168 70 142 125 149 C180 156 190 104 245 116 C300 128 323 72 380 91 C438 110 451 67 505 75 C560 84 579 39 635 56 C690 72 716 38 760 45 C811 53 846 21 900 28 L900 220 L0 220 Z"
                fill="url(#quantstatArea)"
              />

              <path
                className="market-line"
                d="M0 178 C55 168 70 142 125 149 C180 156 190 104 245 116 C300 128 323 72 380 91 C438 110 451 67 505 75 C560 84 579 39 635 56 C690 72 716 38 760 45 C811 53 846 21 900 28"
                fill="none"
                stroke="url(#quantstatLine)"
                strokeWidth="3"
              />
            </svg>

            <div className="market-metrics">
              <span>
                STATISTICS
              </span>
              <span>
                RISK
              </span>
              <span>
                SIMULATION
              </span>
              <span>
                MONTE CARLO
              </span>
            </div>
          </div>
        </div>

        <aside className="landing-auth-panel">
          <div className="auth-panel-accent">
            <span />
            SECURE ACCESS
          </div>

          <h2>
            Enter the research workspace
          </h2>

          <p>
            Sign in to access your QuantStat
            quantitative market environment.
          </p>

          <div className="auth-provider-actions">
            <button
              type="button"
              className="microsoft-sign-in-button"
              disabled={
                microsoftLoading
              }
              onClick={() =>
                void instance.loginRedirect(
                  loginRequest,
                )
              }
            >
              <span
                className="microsoft-mark"
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
                <i />
              </span>

              <span>
                {
                  microsoftLoading
                    ? 'Opening Microsoft...'
                    : 'Continue with Microsoft'
                }
              </span>
            </button>

            <div className="auth-divider">
              <span>
                or
              </span>
            </div>

            <GoogleSignInButton />
          </div>

          <small className="auth-privacy-note">
            QuantStat requests only basic identity
            information for sign-in.
          </small>

          <div className="landing-auth-footer">
            <span>
              Research
            </span>
            <span>
              Statistics
            </span>
            <span>
              Finance
            </span>
          </div>
        </aside>
      </section>

      <footer className="landing-footer">
        <span>
          QUANTSTAT
        </span>

        <p>
          Transparent quantitative research for
          financial-market uncertainty.
        </p>
      </footer>
    </main>
  )
}


export default AuthGate