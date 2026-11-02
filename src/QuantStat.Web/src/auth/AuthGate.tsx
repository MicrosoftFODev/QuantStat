import {
    InteractionStatus,
} from '@azure/msal-browser'

import {
    useIsAuthenticated,
    useMsal,
} from '@azure/msal-react'

import {
    useEffect,
} from 'react'

import {
    loginRequest,
} from './msalConfig'

import type {
    PropsWithChildren,
} from 'react'


function AuthGate({
    children,
}: PropsWithChildren) {
    const isAuthenticated =
        useIsAuthenticated()

    const {
        instance,
        inProgress,
    } =
        useMsal()


    useEffect(() => {
        if (
            !isAuthenticated &&
            inProgress ===
            InteractionStatus.None
        ) {
            void instance.loginRedirect(
                loginRequest,
            )
        }
    }, [
        isAuthenticated,
        inProgress,
        instance,
    ])


    if (isAuthenticated) {
        return (
            <>
            { children }
            </>
        )
    }


    return (
        <main className= "auth-page" >

        <section className="auth-card" >

            <div className="auth-logo" >
                QS
                </div>

                <h1>
    QuantStat
        </h1>

        <p>
    Signing in with your Microsoft account...
    </p>

        </section>

        </main>
  )
}


export default AuthGate