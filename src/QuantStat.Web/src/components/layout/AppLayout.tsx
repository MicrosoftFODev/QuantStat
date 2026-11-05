import {
  Activity,
  BarChart3,
  BookOpen,
  ChartNoAxesCombined,
  Database,
  Dices,
  FlaskConical,
  LogOut,
  Moon,
  Settings,
  Sun,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
} from 'react-router-dom'

import {
  useAccount,
  useMsal,
} from '@azure/msal-react'

import {
  usePreferences,
} from '../../preferences/PreferencesContext'


const navigation = [
  {
    label: 'markets',
    path: '/markets',
    icon: BarChart3,
  },
  {
    label: 'charts',
    path: '/charts',
    icon: ChartNoAxesCombined,
  },
  {
    label: 'statistics',
    path: '/statistics',
    icon: FlaskConical,
  },
  {
    label: 'dictionary',
    path: '/dictionary',
    icon: BookOpen,
  },
  {
    label: 'forecast',
    path: '/forecast',
    icon: Activity,
  },
  {
    label: 'simulation',
    path: '/simulation',
    icon: Dices,
  },
  {
    label: 'simulation',
    path: '/simulation',
    icon: Dices,
  },
  {
    label: 'settings',
    path: '/settings',
    icon: Settings,
  },
] as const


function AppLayout() {
  const {
    instance,
    accounts,
  } =
    useMsal()

  const account =
    useAccount(
      accounts[0] ?? null,
    )

  const {
    effectiveTheme,
    setTheme,
    translate,
  } =
    usePreferences()


  const toggleTheme =
    (): void => {
      setTheme(
        effectiveTheme === 'dark'
          ? 'light'
          : 'dark',
      )
    }


  const signOut =
    async (): Promise<void> => {
      await instance.logoutRedirect({
        account:
          account ?? undefined,

        postLogoutRedirectUri:
          window.location.origin,
      })
    }


  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Database size={21} />
          </div>

          <div>

            <strong>
              QuantStat
            </strong>

            <span>
              {translate(
                'marketAnalytics',
              )}
            </span>

          </div>

        </div>


        <nav>

          {navigation.map(
            ({
              label,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                className={
                  ({ isActive }) =>
                    isActive
                      ? 'nav-item active'
                      : 'nav-item'
                }
              >
                <Icon size={18} />

                <span>
                  {translate(
                    label,
                  )}
                </span>
              </NavLink>
            ),
          )}

        </nav>


        <div className="sidebar-account">

          <div className="sidebar-account-avatar">
            {(
              account?.name ??
              account?.username ??
              'M'
            )
              .slice(
                0,
                1,
              )
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {account?.name ??
                'Microsoft account'}
            </strong>

            <span>
              {account?.username}
            </span>
          </div>

        </div>


        <div className="sidebar-footer">

          <span>
            QuantStat Web
          </span>

          <small>
            {translate(
              'developmentBuild',
            )}
          </small>

        </div>

      </aside>


      <main className="main-area">

        <div className="app-toolbar">

          <div className="app-toolbar-status">

            <span className="status-dot" />

            {translate(
              'apiStatus',
            )}

          </div>


          <div className="toolbar-actions">



            <button
              className="theme-button"
              type="button"
              title="Toggle theme"
              onClick={
                toggleTheme
              }
            >
              {effectiveTheme === 'dark'
                ? <Sun size={18} />
                : <Moon size={18} />}
            </button>

            <button
              className="theme-button logout-button"
              type="button"
              title={translate(
                'signOut',
              )}
              onClick={() =>
                void signOut()
              }
            >
              <LogOut size={18} />
            </button>

          </div>

        </div>


        <Outlet />

      </main>

    </div>
  )
}


export default AppLayout