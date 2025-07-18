import { useQuery } from '@tanstack/react-query'
import {
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  DocumentIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import api from '../services/api'

const Dashboard = () => {
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data.data)
  })

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory-item').then(res => res.data.data)
  })

  const { data: salesOrders } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => api.get('/sales-order').then(res => res.data.data)
  })

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoice').then(res => res.data.data)
  })

  const stats = [
    {
      name: 'Total Customers',
      value: customers?.length || 0,
      icon: UsersIcon,
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Inventory Items',
      value: inventory?.length || 0,
      icon: CubeIcon,
      change: '+5%',
      changeType: 'positive',
    },
    {
      name: 'Sales Orders',
      value: salesOrders?.length || 0,
      icon: DocumentTextIcon,
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: 'Invoices',
      value: invoices?.length || 0,
      icon: DocumentIcon,
      change: '+15%',
      changeType: 'positive',
    },
  ]

  const recentActivity = [
    { id: 1, type: 'invoice', description: 'Invoice #INV-001 created for John Doe', time: '2 hours ago' },
    { id: 2, type: 'order', description: 'Sales Order #SO-001 accepted', time: '4 hours ago' },
    { id: 3, type: 'customer', description: 'New customer "ABC Corp" added', time: '6 hours ago' },
    { id: 4, type: 'payment', description: 'Payment received for Invoice #INV-002', time: '1 day ago' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-primary-600">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-primary-600 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary text-center py-3">
              <DocumentIcon className="h-5 w-5 mx-auto mb-1" />
              New Invoice
            </button>
            <button className="btn-primary text-center py-3">
              <DocumentTextIcon className="h-5 w-5 mx-auto mb-1" />
              New Order
            </button>
            <button className="btn-primary text-center py-3">
              <UsersIcon className="h-5 w-5 mx-auto mb-1" />
              Add Customer
            </button>
            <button className="btn-primary text-center py-3">
              <CubeIcon className="h-5 w-5 mx-auto mb-1" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Revenue chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard