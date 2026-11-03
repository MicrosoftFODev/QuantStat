import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useAccount,
  useMsal,
} from '@azure/msal-react'

import type {
  PropsWithChildren,
} from 'react'


export type AppTheme =
  | 'dark'
  | 'light'
  | 'system'

export type QuoteCurrency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'USDT'
  | 'USDC'
  | 'BTC'
  | 'ETH'


export interface UserPreferences {
  theme: AppTheme
  currency: QuoteCurrency
}


interface PreferencesContextValue {
    preferences: UserPreferences
    effectiveTheme: 'dark' | 'light'
    setTheme: (theme: AppTheme) => void
    setCurrency: (currency: QuoteCurrency) => void
    translate: (key: TranslationKey) => string
}


const defaultPreferences:
  UserPreferences = {
    theme: 'dark',
    currency: 'USD',
  }


const translations = {
  en: {
    dashboard: 'Dashboard',
    markets: 'Markets',
    charts: 'Charts',
    statistics: 'Statistics',
    import: 'Import',
    dictionary: 'Dictionary',
    forecast: 'Forecast',
    settings: 'Settings',
    marketAnalytics: 'Market analytics',
    developmentBuild: 'Development build',
    apiStatus: 'QuantStat API',
    signOut: 'Sign out',
    preferences: 'Preferences',
    preferencesDescription:
      'Personalize QuantStat for your Microsoft account.',
    appearance: 'Appearance',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    language: 'Language',
    english: 'English',
    greek: 'Greek',
    currency: 'Preferred quote currency',
    currencyHelp:
      'Dashboard and Markets will show instruments quoted in this currency.',
    account: 'Microsoft account',
    savedAutomatically:
      'Preferences are saved automatically for this Microsoft account on this browser.',
    dashboardTitle: 'Dashboard',
    marketOverview:
      'Market overview and quantitative summary',
    market: 'Market',
    interval: 'Interval',
    period: 'Period',
    latestPrice: 'Latest price',
    priceChange: 'Price change',
    observations: 'Observations',
    volatility: 'Annualized volatility',
    price: 'Price',
    mean: 'Mean',
    loadingMarketData: 'Loading market data...',
  },

  el: {
    dashboard: 'Πίνακας ελέγχου',
    markets: 'Αγορές',
    charts: 'Γραφήματα',
    statistics: 'Στατιστικά',
    import: 'Εισαγωγή',
    dictionary: 'Λεξικό',
    forecast: 'Πρόβλεψη',
    settings: 'Ρυθμίσεις',
    marketAnalytics: 'Ανάλυση αγορών',
    developmentBuild: 'Έκδοση ανάπτυξης',
    apiStatus: 'QuantStat API',
    signOut: 'Αποσύνδεση',
    preferences: 'Προτιμήσεις',
    preferencesDescription:
      'Προσαρμόστε το QuantStat για τον λογαριασμό Microsoft σας.',
    appearance: 'Εμφάνιση',
    theme: 'Θέμα',
    dark: 'Σκούρο',
    light: 'Φωτεινό',
    system: 'Σύστημα',
    language: 'Γλώσσα',
    english: 'Αγγλικά',
    greek: 'Ελληνικά',
    currency: 'Προτιμώμενο νόμισμα αναφοράς',
    currencyHelp:
      'Ο Πίνακας ελέγχου και οι Αγορές θα εμφανίζουν ζεύγη με αυτό το νόμισμα.',
    account: 'Λογαριασμός Microsoft',
    savedAutomatically:
      'Οι προτιμήσεις αποθηκεύονται αυτόματα για αυτόν τον λογαριασμό Microsoft σε αυτό το πρόγραμμα περιήγησης.',
    dashboardTitle: 'Πίνακας ελέγχου',
    marketOverview:
      'Επισκόπηση αγοράς και ποσοτική σύνοψη',
    market: 'Αγορά',
    interval: 'Χρονικό διάστημα',
    period: 'Περίοδος',
    latestPrice: 'Τελευταία τιμή',
    priceChange: 'Μεταβολή τιμής',
    observations: 'Παρατηρήσεις',
    volatility: 'Ετησιοποιημένη μεταβλητότητα',
    price: 'Τιμή',
    mean: 'Μέσος όρος',
    loadingMarketData: 'Φόρτωση δεδομένων αγοράς...',
  },
} as const


type TranslationKey =
  keyof typeof translations.en


const PreferencesContext =
  createContext<PreferencesContextValue | null>(
    null,
  )


function storageKey(
  accountId: string,
): string {
  return `quantstat-preferences:${accountId}`
}


function loadPreferences(
  accountId: string,
): UserPreferences {
  try {
    const stored =
      localStorage.getItem(
        storageKey(accountId),
      )

    if (!stored) {
      return defaultPreferences
    }

    const parsed =
      JSON.parse(
        stored,
      ) as Partial<UserPreferences>

    return {
      theme:
        parsed.theme === 'light' ||
        parsed.theme === 'system'
          ? parsed.theme
          : 'dark',

      currency:
        parsed.currency === 'EUR' ||
        parsed.currency === 'GBP' ||
        parsed.currency === 'USDT' ||
        parsed.currency === 'USDC' ||
        parsed.currency === 'BTC' ||
        parsed.currency === 'ETH'
          ? parsed.currency
          : 'USD',
    }
  }
  catch {
    return defaultPreferences
  }
}


export function PreferencesProvider({
  children,
}: PropsWithChildren) {
  const {
    accounts,
  } =
    useMsal()

  const account =
    useAccount(
      accounts[0] ?? null,
    )

  const accountId =
    account?.homeAccountId ??
    'anonymous'

  const [
    preferences,
    setPreferences,
  ] =
    useState<UserPreferences>(
      () =>
        loadPreferences(
          accountId,
        ),
    )

  const [
    effectiveTheme,
    setEffectiveTheme,
  ] =
    useState<'dark' | 'light'>(
      'dark',
    )


  useEffect(() => {
    setPreferences(
      loadPreferences(
        accountId,
      ),
    )
  }, [
    accountId,
  ])


  useEffect(() => {
    localStorage.setItem(
      storageKey(accountId),
      JSON.stringify(
        preferences,
      ),
    )

    localStorage.setItem(
      'quantstat-currency',
      preferences.currency,
    )

    window.dispatchEvent(
      new CustomEvent(
        'quantstat-preferences-changed',
        {
          detail:
            preferences,
        },
      ),
    )
  }, [
    accountId,
    preferences,
  ])


  useEffect(() => {
    const media =
      window.matchMedia(
        '(prefers-color-scheme: light)',
      )

    const applyTheme =
      (): void => {
        const nextTheme =
          preferences.theme === 'system'
            ? (
                media.matches
                  ? 'light'
                  : 'dark'
              )
            : preferences.theme

        setEffectiveTheme(
          nextTheme,
        )

        document
          .documentElement
          .dataset
          .theme =
            nextTheme
      }

    applyTheme()

    media.addEventListener(
      'change',
      applyTheme,
    )

    return () =>
      media.removeEventListener(
        'change',
        applyTheme,
      )
  }, [preferences.theme])


  const value =
    useMemo<PreferencesContextValue>(
      () => ({
        preferences,
        effectiveTheme,

        setTheme:
          theme =>
            setPreferences(
              current => ({
                ...current,
                theme,
              }),
            ),

          setCurrency:
              currency => {
                  setPreferences(
                      current => ({
                          ...current,
                          currency,
                      }),
                  )

                  localStorage.removeItem(
                      'quantstat-symbol',
                  )

                  window.dispatchEvent(
                      new CustomEvent(
                          'quantstat-market-selection-invalidated',
                          {
                              detail: {
                                  currency,
                              },
                          },
                      ),
                  )
              },

        translate:
          key =>
            translations.en[key],
      }),
      [
        preferences,
        effectiveTheme,
      ],
    )


  return (
    <PreferencesContext.Provider
      value={value}
    >
      {children}
    </PreferencesContext.Provider>
  )
}


export function usePreferences():
  PreferencesContextValue {
  const context =
    useContext(
      PreferencesContext,
    )

  if (!context) {
    throw new Error(
      'usePreferences must be used inside PreferencesProvider.',
    )
  }

  return context
}