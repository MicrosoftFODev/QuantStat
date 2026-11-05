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
    simulation: 'Simulation',
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
    dashboard: 'ÃŽÂ ÃŽÂ¯ÃŽÂ½ÃŽÂ±ÃŽÂºÃŽÂ±Ãâ€š ÃŽÂµÃŽÂ»ÃŽÂ­ÃŽÂ³Ãâ€¡ÃŽÂ¿Ãâ€¦',
    markets: 'ÃŽâ€˜ÃŽÂ³ÃŽÂ¿ÃÂÃŽÂ­Ãâ€š',
    charts: 'ÃŽâ€œÃÂÃŽÂ±Ãâ€ ÃŽÂ®ÃŽÂ¼ÃŽÂ±Ãâ€žÃŽÂ±',
    statistics: 'ÃŽÂ£Ãâ€žÃŽÂ±Ãâ€žÃŽÂ¹ÃÆ’Ãâ€žÃŽÂ¹ÃŽÂºÃŽÂ¬',
    dictionary: 'ÃŽâ€ºÃŽÂµÃŽÂ¾ÃŽÂ¹ÃŽÂºÃÅ’',
    forecast: 'ÃŽÂ ÃÂÃÅ’ÃŽÂ²ÃŽÂ»ÃŽÂµÃË†ÃŽÂ·',
    settings: 'ÃŽÂ¡Ãâ€¦ÃŽÂ¸ÃŽÂ¼ÃŽÂ¯ÃÆ’ÃŽÂµÃŽÂ¹Ãâ€š',
    marketAnalytics: 'ÃŽâ€˜ÃŽÂ½ÃŽÂ¬ÃŽÂ»Ãâ€¦ÃÆ’ÃŽÂ· ÃŽÂ±ÃŽÂ³ÃŽÂ¿ÃÂÃÅ½ÃŽÂ½',
    developmentBuild: 'ÃŽË†ÃŽÂºÃŽÂ´ÃŽÂ¿ÃÆ’ÃŽÂ· ÃŽÂ±ÃŽÂ½ÃŽÂ¬Ãâ‚¬Ãâ€žÃâ€¦ÃŽÂ¾ÃŽÂ·Ãâ€š',
    apiStatus: 'QuantStat API',
    signOut: 'ÃŽâ€˜Ãâ‚¬ÃŽÂ¿ÃÆ’ÃÂÃŽÂ½ÃŽÂ´ÃŽÂµÃÆ’ÃŽÂ·',
    preferences: 'ÃŽÂ ÃÂÃŽÂ¿Ãâ€žÃŽÂ¹ÃŽÂ¼ÃŽÂ®ÃÆ’ÃŽÂµÃŽÂ¹Ãâ€š',
    preferencesDescription:
      'ÃŽÂ ÃÂÃŽÂ¿ÃÆ’ÃŽÂ±ÃÂÃŽÂ¼ÃÅ’ÃÆ’Ãâ€žÃŽÂµ Ãâ€žÃŽÂ¿ QuantStat ÃŽÂ³ÃŽÂ¹ÃŽÂ± Ãâ€žÃŽÂ¿ÃŽÂ½ ÃŽÂ»ÃŽÂ¿ÃŽÂ³ÃŽÂ±ÃÂÃŽÂ¹ÃŽÂ±ÃÆ’ÃŽÂ¼ÃÅ’ Microsoft ÃÆ’ÃŽÂ±Ãâ€š.',
    appearance: 'ÃŽâ€¢ÃŽÂ¼Ãâ€ ÃŽÂ¬ÃŽÂ½ÃŽÂ¹ÃÆ’ÃŽÂ·',
    theme: 'ÃŽËœÃŽÂ­ÃŽÂ¼ÃŽÂ±',
    dark: 'ÃŽÂ£ÃŽÂºÃŽÂ¿ÃÂÃÂÃŽÂ¿',
    light: 'ÃŽÂ¦Ãâ€°Ãâ€žÃŽÂµÃŽÂ¹ÃŽÂ½ÃÅ’',
    system: 'ÃŽÂ£ÃÂÃÆ’Ãâ€žÃŽÂ·ÃŽÂ¼ÃŽÂ±',
    language: 'ÃŽâ€œÃŽÂ»ÃÅ½ÃÆ’ÃÆ’ÃŽÂ±',
    english: 'ÃŽâ€˜ÃŽÂ³ÃŽÂ³ÃŽÂ»ÃŽÂ¹ÃŽÂºÃŽÂ¬',
    greek: 'ÃŽâ€¢ÃŽÂ»ÃŽÂ»ÃŽÂ·ÃŽÂ½ÃŽÂ¹ÃŽÂºÃŽÂ¬',
    account: 'ÃŽâ€ºÃŽÂ¿ÃŽÂ³ÃŽÂ±ÃÂÃŽÂ¹ÃŽÂ±ÃÆ’ÃŽÂ¼ÃÅ’Ãâ€š Microsoft',
    savedAutomatically:
      'ÃŽÅ¸ÃŽÂ¹ Ãâ‚¬ÃÂÃŽÂ¿Ãâ€žÃŽÂ¹ÃŽÂ¼ÃŽÂ®ÃÆ’ÃŽÂµÃŽÂ¹Ãâ€š ÃŽÂ±Ãâ‚¬ÃŽÂ¿ÃŽÂ¸ÃŽÂ·ÃŽÂºÃŽÂµÃÂÃŽÂ¿ÃŽÂ½Ãâ€žÃŽÂ±ÃŽÂ¹ ÃŽÂ±Ãâ€¦Ãâ€žÃÅ’ÃŽÂ¼ÃŽÂ±Ãâ€žÃŽÂ± ÃŽÂ³ÃŽÂ¹ÃŽÂ± ÃŽÂ±Ãâ€¦Ãâ€žÃÅ’ÃŽÂ½ Ãâ€žÃŽÂ¿ÃŽÂ½ ÃŽÂ»ÃŽÂ¿ÃŽÂ³ÃŽÂ±ÃÂÃŽÂ¹ÃŽÂ±ÃÆ’ÃŽÂ¼ÃÅ’ Microsoft ÃÆ’ÃŽÂµ ÃŽÂ±Ãâ€¦Ãâ€žÃÅ’ Ãâ€žÃŽÂ¿ Ãâ‚¬ÃÂÃÅ’ÃŽÂ³ÃÂÃŽÂ±ÃŽÂ¼ÃŽÂ¼ÃŽÂ± Ãâ‚¬ÃŽÂµÃÂÃŽÂ¹ÃŽÂ®ÃŽÂ³ÃŽÂ·ÃÆ’ÃŽÂ·Ãâ€š.',
    dashboardTitle: 'ÃŽÂ ÃŽÂ¯ÃŽÂ½ÃŽÂ±ÃŽÂºÃŽÂ±Ãâ€š ÃŽÂµÃŽÂ»ÃŽÂ­ÃŽÂ³Ãâ€¡ÃŽÂ¿Ãâ€¦',
    marketOverview:
      'ÃŽâ€¢Ãâ‚¬ÃŽÂ¹ÃÆ’ÃŽÂºÃÅ’Ãâ‚¬ÃŽÂ·ÃÆ’ÃŽÂ· ÃŽÂ±ÃŽÂ³ÃŽÂ¿ÃÂÃŽÂ¬Ãâ€š ÃŽÂºÃŽÂ±ÃŽÂ¹ Ãâ‚¬ÃŽÂ¿ÃÆ’ÃŽÂ¿Ãâ€žÃŽÂ¹ÃŽÂºÃŽÂ® ÃÆ’ÃÂÃŽÂ½ÃŽÂ¿ÃË†ÃŽÂ·',
    market: 'ÃŽâ€˜ÃŽÂ³ÃŽÂ¿ÃÂÃŽÂ¬',
    interval: 'ÃŽÂ§ÃÂÃŽÂ¿ÃŽÂ½ÃŽÂ¹ÃŽÂºÃÅ’ ÃŽÂ´ÃŽÂ¹ÃŽÂ¬ÃÆ’Ãâ€žÃŽÂ·ÃŽÂ¼ÃŽÂ±',
    period: 'ÃŽÂ ÃŽÂµÃÂÃŽÂ¯ÃŽÂ¿ÃŽÂ´ÃŽÂ¿Ãâ€š',
    latestPrice: 'ÃŽÂ¤ÃŽÂµÃŽÂ»ÃŽÂµÃâ€¦Ãâ€žÃŽÂ±ÃŽÂ¯ÃŽÂ± Ãâ€žÃŽÂ¹ÃŽÂ¼ÃŽÂ®',
    priceChange: 'ÃŽÅ“ÃŽÂµÃâ€žÃŽÂ±ÃŽÂ²ÃŽÂ¿ÃŽÂ»ÃŽÂ® Ãâ€žÃŽÂ¹ÃŽÂ¼ÃŽÂ®Ãâ€š',
    observations: 'ÃŽÂ ÃŽÂ±ÃÂÃŽÂ±Ãâ€žÃŽÂ·ÃÂÃŽÂ®ÃÆ’ÃŽÂµÃŽÂ¹Ãâ€š',
    volatility: 'ÃŽâ€¢Ãâ€žÃŽÂ·ÃÆ’ÃŽÂ¹ÃŽÂ¿Ãâ‚¬ÃŽÂ¿ÃŽÂ¹ÃŽÂ·ÃŽÂ¼ÃŽÂ­ÃŽÂ½ÃŽÂ· ÃŽÂ¼ÃŽÂµÃâ€žÃŽÂ±ÃŽÂ²ÃŽÂ»ÃŽÂ·Ãâ€žÃÅ’Ãâ€žÃŽÂ·Ãâ€žÃŽÂ±',
    price: 'ÃŽÂ¤ÃŽÂ¹ÃŽÂ¼ÃŽÂ®',
    mean: 'ÃŽÅ“ÃŽÂ­ÃÆ’ÃŽÂ¿Ãâ€š ÃÅ’ÃÂÃŽÂ¿Ãâ€š',
    loadingMarketData: 'ÃŽÂ¦ÃÅ’ÃÂÃâ€žÃâ€°ÃÆ’ÃŽÂ· ÃŽÂ´ÃŽÂµÃŽÂ´ÃŽÂ¿ÃŽÂ¼ÃŽÂ­ÃŽÂ½Ãâ€°ÃŽÂ½ ÃŽÂ±ÃŽÂ³ÃŽÂ¿ÃÂÃŽÂ¬Ãâ€š...',
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