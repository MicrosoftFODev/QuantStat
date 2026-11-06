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

import MarketPulseVisual
  from '../landing/MarketPulseVisual'

import FeatureShowcase
  from '../landing/FeatureShowcase'

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

          <MarketPulseVisual />
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

      <FeatureShowcase />

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
