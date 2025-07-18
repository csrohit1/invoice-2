import { Routes, Route } from 'react-router-dom'
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
