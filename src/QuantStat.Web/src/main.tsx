import {
  StrictMode,
} from 'react'

import {
  createRoot,
} from 'react-dom/client'

import {
  BrowserRouter,
} from 'react-router-dom'

import {
  MsalProvider,
} from '@azure/msal-react'

import App from './App.tsx'
import AuthGate from './auth/AuthGate'

import {
  AuthProvider,
} from './auth/AuthContext'

import {
  msalInstance,
} from './auth/msalConfig'

import {
  PreferencesProvider,
} from './preferences/PreferencesContext'

import './index.css'


async function startApplication():
  Promise<void> {
  await msalInstance.initialize()

  const redirectResult =
    await msalInstance
      .handleRedirectPromise()

  if (redirectResult?.account) {
    /*
     * A redirect result exists only after the user
     * explicitly selected Microsoft sign-in.
     */
    msalInstance.setActiveAccount(
      redirectResult.account,
    )
  }
  else {
    /*
     * A normal opening or refresh must never restore
     * a cached Microsoft session automatically.
     *
     * Calling logoutRedirect with navigation disabled
     * clears the local MSAL cache without sending the
     * browser to Microsoft's sign-out page.
     */
    if (
      msalInstance
        .getAllAccounts()
        .length > 0
    ) {
      await msalInstance.clearCache()
    }

    msalInstance.setActiveAccount(
      null,
    )
  }

  createRoot(
    document.getElementById(
      'root',
    )!,
  ).render(
    <StrictMode>
      <MsalProvider
        instance={msalInstance}
      >
        <AuthProvider>
          <AuthGate>
            <PreferencesProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </PreferencesProvider>
          </AuthGate>
        </AuthProvider>
      </MsalProvider>
    </StrictMode>,
  )
}


void startApplication()
