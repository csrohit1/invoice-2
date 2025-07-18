import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Inventory from './pages/Inventory'
import SalesOrders from './pages/SalesOrders'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales-orders" element={<SalesOrders />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App