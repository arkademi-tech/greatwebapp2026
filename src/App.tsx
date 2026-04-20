import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { TeamProvider, useTeam } from './context/TeamContext'
import { Layout } from './components/Layout'
import { SetupPage } from './pages/SetupPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { ExpenseFormPage } from './pages/ExpenseFormPage'
import { SettlementPage } from './pages/SettlementPage'

function AppRoutes() {
  const { session } = useTeam()

  if (!session) {
    return (
      <Routes>
        <Route path="/join/:token" element={<SetupPage />} />
        <Route path="*" element={<SetupPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/expenses/new" element={<ExpenseFormPage />} />
        <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
        <Route path="/settlement" element={<SettlementPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <TeamProvider>
          <AppRoutes />
        </TeamProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
