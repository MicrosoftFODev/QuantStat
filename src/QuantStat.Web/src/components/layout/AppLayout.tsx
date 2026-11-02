import {
  Activity,
  BarChart3,
  BookOpen,
  ChartNoAxesCombined,
  Database,
  FlaskConical,
  Gauge,
  Moon,
  Settings,
  Sun,
  Upload,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
} from 'react-router-dom'

import {
  useEffect,
  useState,
} from 'react'


type Theme =
  'dark' |
  'light'


const navigation = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: Gauge,
  },
  {
    label: 'Markets',
    path: '/markets',
    icon: BarChart3,
  },
  {
    label: 'Charts',
    path: '/charts',
    icon: ChartNoAxesCombined,
  },
  {
    label: 'Statistics',
    path: '/statistics',
    icon: FlaskConical,
  },
  {
    label: 'Import',
    path: '/import',
    icon: Upload,
  },
  {
    label: 'Dictionary',
    path: '/dictionary',
    icon: BookOpen,
  },
  {
    label: 'Forecast',
    path: '/forecast',
    icon: Activity,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
  },
]


function AppLayout() {
  const [theme, setTheme] =
    useState<Theme>(() => {
      const saved =
        localStorage.getItem(
          'quantstat-theme',
        )

      return saved === 'light'
        ? 'light'
        : 'dark'
    })


  useEffect(() => {
    document.documentElement.dataset.theme =
      theme

    localStorage.setItem(
      'quantstat-theme',
      theme,
    )
  }, [theme])


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
              Market analytics
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
                  {label}
                </span>
              </NavLink>

            ),
          )}

        </nav>


        <div className="sidebar-footer">

          <span>
            QuantStat Web
          </span>

          <small>
            Development build
          </small>

        </div>

      </aside>


      <main className="main-area">

        <div className="app-toolbar">

          <div className="app-toolbar-status">
            <span className="status-dot" />

            QuantStat API
          </div>


          <button
            className="theme-button"
            type="button"
            title="Toggle theme"
            onClick={() =>
              setTheme(
                current =>
                  current === 'dark'
                    ? 'light'
                    : 'dark',
              )
            }
          >
            {theme === 'dark'
              ? <Sun size={18} />
              : <Moon size={18} />}
          </button>

        </div>


        <Outlet />

      </main>

    </div>
  )
}


export default AppLayout
