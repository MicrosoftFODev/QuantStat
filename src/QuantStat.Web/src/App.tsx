import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import AppLayout
  from './components/layout/AppLayout'

import DashboardPage
  from './features/dashboard/DashboardPage'

import StatisticsPage
  from './features/statistics/StatisticsPage'

import PlaceholderPage
  from './pages/PlaceholderPage'


function App() {
  return (
    <Routes>

      <Route
        element={<AppLayout />}
      >

        <Route
          index
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        <Route
          path="/dashboard"
          element={
            <DashboardPage />
          }
        />


        <Route
          path="/markets"
          element={
            <PlaceholderPage
              title="Markets"
              description="Market discovery and instrument analysis"
            />
          }
        />


        <Route
          path="/charts"
          element={
            <PlaceholderPage
              title="Charts"
              description="Interactive quantitative chart analysis"
            />
          }
        />


        <Route
          path="/statistics"
          element={
            <StatisticsPageWrapper />
          }
        />


        <Route
          path="/import"
          element={
            <PlaceholderPage
              title="Import"
              description="Analyze Excel and CSV datasets"
            />
          }
        />


        <Route
          path="/dictionary"
          element={
            <PlaceholderPage
              title="Dictionary"
              description="Statistical reference and calculators"
            />
          }
        />


        <Route
          path="/forecast"
          element={
            <PlaceholderPage
              title="Forecast"
              description="Forecasting models and diagnostics"
            />
          }
        />


        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Settings"
              description="QuantStat preferences and account"
            />
          }
        />


        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Route>

    </Routes>
  )
}


/*
 * Temporary wrapper.
 *
 * The next refactor will move market
 * selection into shared application
 * state so Dashboard, Statistics,
 * Charts and Forecast all use the same
 * selected market.
 */
import {
  useEffect,
  useState,
} from 'react'

import {
  getMarkets,
} from './api/quantStatApi'

import type {
  MarketMetadata,
} from './models/market'


function StatisticsPageWrapper() {
  const [metadata, setMetadata] =
    useState<MarketMetadata | null>(
      null,
    )

  const [symbol, setSymbol] =
    useState('ETHUSD')

  const [interval, setInterval] =
    useState(1440)

  const [periodDays, setPeriodDays] =
    useState(365)


  useEffect(() => {
    const controller =
      new AbortController()

    getMarkets(
      controller.signal,
    )
      .then(setMetadata)
      .catch(console.error)

    return () =>
      controller.abort()
  }, [])


  return (
    <StatisticsPage
      metadata={metadata}
      symbol={symbol}
      interval={interval}
      periodDays={periodDays}
      onSymbolChange={setSymbol}
      onIntervalChange={setInterval}
      onPeriodChange={setPeriodDays}
    />
  )
}


export default App
