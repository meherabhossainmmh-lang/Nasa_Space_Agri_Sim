import ErrorBoundary from './components/ErrorBoundary.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  )
}
