import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import type {
  PropsWithChildren,
} from 'react'

import type {
  QuantStatUser,
} from './authTypes'


interface AuthContextValue {
  googleUser:
    QuantStatUser | null

  setGoogleUser: (
    user: QuantStatUser | null,
  ) => void

  signOutGoogle:
    () => void
}


const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined)


export function AuthProvider({
  children,
}: PropsWithChildren) {
  /*
   * Google authentication deliberately exists only
   * in React memory. Reloading or reopening QuantStat
   * therefore requires a new explicit sign-in.
   */
  const [
    googleUser,
    setGoogleUserState,
  ] =
    useState<
      QuantStatUser | null
    >(null)


  const setGoogleUser =
    useCallback(
      (
        user:
          QuantStatUser | null,
      ): void => {
        setGoogleUserState(
          user,
        )
      },
      [],
    )


  const signOutGoogle =
    useCallback(
      (): void => {
        setGoogleUserState(
          null,
        )

        window.google
          ?.accounts.id
          .disableAutoSelect?.()
      },
      [],
    )


  const value =
    useMemo(
      () => ({
        googleUser,
        setGoogleUser,
        signOutGoogle,
      }),
      [
        googleUser,
        setGoogleUser,
        signOutGoogle,
      ],
    )


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}


export function useQuantStatAuth():
  AuthContextValue {
  const context =
    useContext(
      AuthContext,
    )

  if (!context) {
    throw new Error(
      'useQuantStatAuth must be used inside AuthProvider.',
    )
  }

  return context
}