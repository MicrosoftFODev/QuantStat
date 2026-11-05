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
    <main className="auth-page">
      <section className="auth-card auth-provider-card">
        <div className="auth-logo">
          QS
        </div>

        <h1>
          QuantStat
        </h1>

        <p className="auth-introduction">
          Sign in to continue to your quantitative market workspace.
        </p>

        <div className="auth-provider-actions">
          <button
            type="button"
            className="microsoft-sign-in-button"
            disabled={
              microsoftLoading
            }
            onClick={() =>
              void instance
                .loginRedirect(
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
          QuantStat requests only basic identity information for sign-in.
        </small>
      </section>
    </main>
  )
}


export default AuthGate
