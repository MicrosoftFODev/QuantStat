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

export interface UserPreferences {
  theme: AppTheme
}


interface PreferencesContextValue {
    preferences: UserPreferences
    effectiveTheme: 'dark' | 'light'
    setTheme: (theme: AppTheme) => void
    translate: (key: TranslationKey) => string
}


const defaultPreferences:
  UserPreferences = {
    theme: 'dark',
  }


const translations = {
  en: {
    dashboard: 'Dashboard',
    markets: 'Markets',
    charts: 'Charts',
    statistics: 'Statistics',
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
    dashboard: 'Î Î¯Î½Î±ÎºÎ±Ï‚ ÎµÎ»Î­Î³Ï‡Î¿Ï…',
    markets: 'Î‘Î³Î¿ÏÎ­Ï‚',
    charts: 'Î“ÏÎ±Ï†Î®Î¼Î±Ï„Î±',
    statistics: 'Î£Ï„Î±Ï„Î¹ÏƒÏ„Î¹ÎºÎ¬',
    dictionary: 'Î›ÎµÎ¾Î¹ÎºÏŒ',
    forecast: 'Î ÏÏŒÎ²Î»ÎµÏˆÎ·',
    settings: 'Î¡Ï…Î¸Î¼Î¯ÏƒÎµÎ¹Ï‚',
    marketAnalytics: 'Î‘Î½Î¬Î»Ï…ÏƒÎ· Î±Î³Î¿ÏÏŽÎ½',
    developmentBuild: 'ÎˆÎºÎ´Î¿ÏƒÎ· Î±Î½Î¬Ï€Ï„Ï…Î¾Î·Ï‚',
    apiStatus: 'QuantStat API',
    signOut: 'Î‘Ï€Î¿ÏƒÏÎ½Î´ÎµÏƒÎ·',
    preferences: 'Î ÏÎ¿Ï„Î¹Î¼Î®ÏƒÎµÎ¹Ï‚',
    preferencesDescription:
      'Î ÏÎ¿ÏƒÎ±ÏÎ¼ÏŒÏƒÏ„Îµ Ï„Î¿ QuantStat Î³Î¹Î± Ï„Î¿Î½ Î»Î¿Î³Î±ÏÎ¹Î±ÏƒÎ¼ÏŒ Microsoft ÏƒÎ±Ï‚.',
    appearance: 'Î•Î¼Ï†Î¬Î½Î¹ÏƒÎ·',
    theme: 'Î˜Î­Î¼Î±',
    dark: 'Î£ÎºÎ¿ÏÏÎ¿',
    light: 'Î¦Ï‰Ï„ÎµÎ¹Î½ÏŒ',
    system: 'Î£ÏÏƒÏ„Î·Î¼Î±',
    language: 'Î“Î»ÏŽÏƒÏƒÎ±',
    english: 'Î‘Î³Î³Î»Î¹ÎºÎ¬',
    greek: 'Î•Î»Î»Î·Î½Î¹ÎºÎ¬',
    account: 'Î›Î¿Î³Î±ÏÎ¹Î±ÏƒÎ¼ÏŒÏ‚ Microsoft',
    savedAutomatically:
      'ÎŸÎ¹ Ï€ÏÎ¿Ï„Î¹Î¼Î®ÏƒÎµÎ¹Ï‚ Î±Ï€Î¿Î¸Î·ÎºÎµÏÎ¿Î½Ï„Î±Î¹ Î±Ï…Ï„ÏŒÎ¼Î±Ï„Î± Î³Î¹Î± Î±Ï…Ï„ÏŒÎ½ Ï„Î¿Î½ Î»Î¿Î³Î±ÏÎ¹Î±ÏƒÎ¼ÏŒ Microsoft ÏƒÎµ Î±Ï…Ï„ÏŒ Ï„Î¿ Ï€ÏÏŒÎ³ÏÎ±Î¼Î¼Î± Ï€ÎµÏÎ¹Î®Î³Î·ÏƒÎ·Ï‚.',
    dashboardTitle: 'Î Î¯Î½Î±ÎºÎ±Ï‚ ÎµÎ»Î­Î³Ï‡Î¿Ï…',
    marketOverview:
      'Î•Ï€Î¹ÏƒÎºÏŒÏ€Î·ÏƒÎ· Î±Î³Î¿ÏÎ¬Ï‚ ÎºÎ±Î¹ Ï€Î¿ÏƒÎ¿Ï„Î¹ÎºÎ® ÏƒÏÎ½Î¿ÏˆÎ·',
    market: 'Î‘Î³Î¿ÏÎ¬',
    interval: 'Î§ÏÎ¿Î½Î¹ÎºÏŒ Î´Î¹Î¬ÏƒÏ„Î·Î¼Î±',
    period: 'Î ÎµÏÎ¯Î¿Î´Î¿Ï‚',
    latestPrice: 'Î¤ÎµÎ»ÎµÏ…Ï„Î±Î¯Î± Ï„Î¹Î¼Î®',
    priceChange: 'ÎœÎµÏ„Î±Î²Î¿Î»Î® Ï„Î¹Î¼Î®Ï‚',
    observations: 'Î Î±ÏÎ±Ï„Î·ÏÎ®ÏƒÎµÎ¹Ï‚',
    volatility: 'Î•Ï„Î·ÏƒÎ¹Î¿Ï€Î¿Î¹Î·Î¼Î­Î½Î· Î¼ÎµÏ„Î±Î²Î»Î·Ï„ÏŒÏ„Î·Ï„Î±',
    price: 'Î¤Î¹Î¼Î®',
    mean: 'ÎœÎ­ÏƒÎ¿Ï‚ ÏŒÏÎ¿Ï‚',
    loadingMarketData: 'Î¦ÏŒÏÏ„Ï‰ÏƒÎ· Î´ÎµÎ´Î¿Î¼Î­Î½Ï‰Î½ Î±Î³Î¿ÏÎ¬Ï‚...',
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