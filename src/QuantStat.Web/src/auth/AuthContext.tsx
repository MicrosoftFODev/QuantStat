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


const googleUserStorageKey =
  'quantstat-google-user'


function readStoredGoogleUser():
  QuantStatUser | null {
  const storedValue =
    localStorage.getItem(
      googleUserStorageKey,
    )

  if (!storedValue) {
    return null
  }

  try {
    const user =
      JSON.parse(
        storedValue,
      ) as QuantStatUser

    if (
      user.provider !== 'google' ||
      !user.id
    ) {
      localStorage.removeItem(
        googleUserStorageKey,
      )

      return null
    }

    return user
  }
  catch {
    localStorage.removeItem(
      googleUserStorageKey,
    )

    return null
  }
}


const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined)


export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [
    googleUser,
    setGoogleUserState,
  ] =
    useState<
      QuantStatUser | null
    >(
      readStoredGoogleUser,
    )


  const setGoogleUser =
    useCallback(
      (
        user:
          QuantStatUser | null,
      ): void => {
        setGoogleUserState(
          user,
        )

        if (user) {
          localStorage.setItem(
            googleUserStorageKey,
            JSON.stringify(
              user,
            ),
          )
        }
        else {
          localStorage.removeItem(
            googleUserStorageKey,
          )
        }
      },
      [],
    )


  const signOutGoogle =
    useCallback(
      (): void => {
        setGoogleUser(
          null,
        )

        window.google
          ?.accounts.id
          .disableAutoSelect?.()
      },
      [
        setGoogleUser,
      ],
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
