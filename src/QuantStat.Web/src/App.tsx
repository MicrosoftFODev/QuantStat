import SettingsPage
  from './features/settings/SettingsPage'

import DictionaryPage
  from './features/dictionary/DictionaryPage'

import MarketsPage
  from './features/markets/MarketsPage'

import ChartsPage
  from './features/charts/ChartsPage'

import StatisticsPage
  from './features/statistics/StatisticsPage'

import PlaceholderPage
  from './pages/PlaceholderPage'

import SimulationPage
  from './features/simulation/SimulationPage'

import AppLayout
  from './components/layout/AppLayout'

import './styles/app.css'

import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'


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
              to="/markets"
              replace
            />
          }
        />


        <Route
          path="/dashboard"
          element={
            <Navigate
              to="/markets"
              replace
            />
          }
        />


        <Route
          path="/markets"
          element={
            <MarketsPage />
          }
        />


        <Route
          path="/charts"
          element={
            <ChartsPage />
          }
        />


        <Route
          path="/statistics"
          element={
            <StatisticsPage />
          }
        />


        <Route
          path="/dictionary"
          element={
            <DictionaryPage />
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
          path="/simulation"
          element={
            <SimulationPage />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage />
          }
        />


        <Route
          path="*"
          element={
            <Navigate
              to="/markets"
              replace
            />
          }
        />

      </Route>

    </Routes>
  )
}


export default App
