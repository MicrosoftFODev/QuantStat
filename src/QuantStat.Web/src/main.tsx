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
import { AuthProvider } from './auth/AuthContext'

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
    msalInstance.setActiveAccount(
      redirectResult.account,
    )
  }
  else {
    const accounts =
      msalInstance.getAllAccounts()

    if (
      accounts.length > 0 &&
      !msalInstance.getActiveAccount()
    ) {
      msalInstance.setActiveAccount(
        accounts[0],
      )
    }
  }

    createRoot(
        document.getElementById('root')!,
    ).render(
        <StrictMode>
        <MsalProvider instance={ msalInstance } >
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
