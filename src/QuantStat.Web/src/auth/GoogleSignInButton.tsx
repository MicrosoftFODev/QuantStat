import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useQuantStatAuth,
} from './AuthContext'

import type {
  QuantStatUser,
} from './authTypes'


const googleClientId =
  import.meta.env
    .VITE_GOOGLE_CLIENT_ID as
      | string
      | undefined


const apiBaseUrl =
  (
    import.meta.env
      .VITE_API_BASE_URL ??
    'http://localhost:5094'
  ).replace(
    /\/$/,
    '',
  )


function loadGoogleIdentity():
  Promise<void> {
  if (
    window.google
      ?.accounts.id
  ) {
    return Promise.resolve()
  }

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const existingScript =
        document.querySelector<
          HTMLScriptElement
        >(
          'script[data-quantstat-google-identity]',
        )

      if (existingScript) {
        existingScript.addEventListener(
          'load',
          () => resolve(),
          {
            once: true,
          },
        )

        existingScript.addEventListener(
          'error',
          () =>
            reject(
              new Error(
                'Google Identity Services failed to load.',
              ),
            ),
          {
            once: true,
          },
        )

        return
      }

      const script =
        document.createElement(
          'script',
        )

      script.src =
        'https://accounts.google.com/gsi/client'

      script.async = true
      script.defer = true

      script.dataset
        .quantstatGoogleIdentity =
          'true'

      script.onload =
        () => resolve()

      script.onerror =
        () =>
          reject(
            new Error(
              'Google Identity Services failed to load.',
            ),
          )

      document.head.appendChild(
        script,
      )
    },
  )
}


function GoogleSignInButton() {
  const buttonRef =
    useRef<HTMLDivElement>(
      null,
    )

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const [
    validating,
    setValidating,
  ] =
    useState(false)

  const {
    setGoogleUser,
  } =
    useQuantStatAuth()


  useEffect(() => {
    let active = true

    const initialize =
      async (): Promise<void> => {
        if (!googleClientId) {
          setError(
            'Google Client ID is not configured.',
          )

          return
        }

        try {
          await loadGoogleIdentity()

          if (
            !active ||
            !buttonRef.current ||
            !window.google
          ) {
            return
          }

          window.google
            .accounts.id
            .initialize({
              client_id:
                googleClientId,

              auto_select:
                false,

              cancel_on_tap_outside:
                true,

              callback:
                response => {
                  const authenticate =
                    async (): Promise<void> => {
                      setError(null)
                      setValidating(true)

                      try {
                        const apiResponse =
                          await fetch(
                            `${apiBaseUrl}/api/auth/google`,
                            {
                              method:
                                'POST',

                              headers: {
                                'Content-Type':
                                  'application/json',
                              },

                              body:
                                JSON.stringify({
                                  credential:
                                    response
                                      .credential,
                                }),
                            },
                          )

                        if (
                          !apiResponse.ok
                        ) {
                          throw new Error(
                            'Google credential validation failed.',
                          )
                        }

                        const user =
                          await apiResponse
                            .json() as
                              QuantStatUser

                        if (
                          user.provider !==
                            'google' ||
                          !user.id
                        ) {
                          throw new Error(
                            'The API returned an invalid Google user.',
                          )
                        }

                        setGoogleUser(
                          user,
                        )
                      }
                      catch (
                        reason: unknown
                      ) {
                        setError(
                          reason instanceof
                            Error
                            ? reason.message
                            : 'Google sign-in failed.',
                        )
                      }
                      finally {
                        setValidating(
                          false,
                        )
                      }
                    }

                  void authenticate()
                },
            })

          buttonRef.current
            .replaceChildren()

          window.google
            .accounts.id
            .renderButton(
              buttonRef.current,
              {
                type:
                  'standard',

                theme:
                  'outline',

                size:
                  'large',

                text:
                  'continue_with',

                shape:
                  'rectangular',

                logo_alignment:
                  'left',

                width:
                  260,
              },
            )
        }
        catch (
          reason: unknown
        ) {
          if (active) {
            setError(
              reason instanceof
                Error
                ? reason.message
                : 'Google Identity Services failed to initialize.',
            )
          }
        }
      }

    void initialize()

    return () => {
      active = false
    }
  }, [
    setGoogleUser,
  ])


  return (
    <div className="google-auth-control">
      <div
        ref={buttonRef}
        className="google-sign-in-button"
      />

      {validating && (
        <span className="google-auth-status">
          Verifying Google account...
        </span>
      )}

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}
    </div>
  )
}


export default GoogleSignInButton
