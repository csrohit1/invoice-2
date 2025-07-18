import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Mock data for testing
const mockData = {
  customers: [
    {
      id: 'customer-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: '123 Main Street, New York, NY 10001',
      createdAt: new Date().toISOString()
    },
    {
      id: 'customer-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+0987654321',
      address: '456 Oak Avenue, Los Angeles, CA 90210',
      createdAt: new Date().toISOString()
    }
  ],
  inventory: [
    {
      id: 'item-1',
      name: 'Premium Widget',
      description: 'High-quality widget with advanced features',
      unitPrice: 249900, // in paise
      taxRate: 18,
      quantity: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: 'item-2',
      name: 'Standard Widget',
      description: 'Basic widget for everyday use',
      unitPrice: 149900, // in paise
      taxRate: 18,
      quantity: 100,
      createdAt: new Date().toISOString()
    }
  ],
  salesOrders: [
    {
      id: 'order-1',
      orderNumber: 1001,
      customerId: 'customer-1',
      status: 'PENDING',
      subTotal: 499800,
      taxAmount: 89964,
      total: 589764,
      placeOfSupply: 'Maharashtra',
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'order-item-1',
          inventoryItemId: 'item-1',
          quantity: 2,
          unitPrice: 249900,
          taxRate: 18,
          amount: 499800,
          hsnOrSacCode: '998313'
        }
      ]
    }
  ],
  invoices: [
    {
      id: 'invoice-1',
      invoiceNumber: 10001,
      customerId: 'customer-1',
      salesOrderId: 'order-1',
      status: 'PENDING',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: 'invoice-item-1',
          inventoryItemId: 'item-1',
          quantity: 2,
          unitPrice: 249900,
          taxRate: 18
        }
      ]
    }
  ]
}

// Mock API responses
const mockResponses = {
  '/customers': () => ({ data: { data: mockData.customers } }),
  '/inventory-item': () => ({ data: { data: mockData.inventory } }),
  '/sales-order': () => ({ data: { data: mockData.salesOrders } }),
  '/invoice': () => ({ data: { data: mockData.invoices } }),
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    const isTestMode = localStorage.getItem('testMode') === 'true'
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add test mode flag to config
    config.isTestMode = isTestMode
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle mock responses and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Handle mock responses in test mode
    if (originalRequest.isTestMode && error.code === 'ERR_NETWORK') {
      const mockResponse = mockResponses[originalRequest.url]
      if (mockResponse) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))
        return mockResponse()
      }
    }
    
    if (error.response?.status === 401 && !originalRequest.isTestMode) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('testMode')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Mock CRUD operations for test mode
const mockCrud = {
  create: (collection, data) => {
    const newItem = { ...data, id: `${collection}-${Date.now()}`, createdAt: new Date().toISOString() }
    mockData[collection].push(newItem)
    return { data: { data: newItem } }
  },
  update: (collection, id, data) => {
    const index = mockData[collection].findIndex(item => item.id === id)
    if (index !== -1) {
      mockData[collection][index] = { ...mockData[collection][index], ...data }
      return { data: { data: mockData[collection][index] } }
    }
    throw new Error('Item not found')
  },
  delete: (collection, id) => {
    const index = mockData[collection].findIndex(item => item.id === id)
    if (index !== -1) {
      mockData[collection].splice(index, 1)
      return { data: { success: true } }
    }
    throw new Error('Item not found')
  }
}

// Override axios methods for test mode
const originalPost = api.post
const originalPatch = api.patch
const originalDelete = api.delete

api.post = async function(url, data, config) {
  if (localStorage.getItem('testMode') === 'true') {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (url.includes('/customers')) return mockCrud.create('customers', data)
    if (url.includes('/inventory-item')) return mockCrud.create('inventory', data)
    if (url.includes('/sales-order')) return mockCrud.create('salesOrders', data)
    if (url.includes('/invoice')) return mockCrud.create('invoices', data)
  }
  return originalPost.call(this, url, data, config)
}

api.patch = async function(url, data, config) {
  if (localStorage.getItem('testMode') === 'true') {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const id = url.split('/').pop()
    if (url.includes('/customers/')) return mockCrud.update('customers', id, data)
    if (url.includes('/inventory-item/')) return mockCrud.update('inventory', id, data)
    if (url.includes('/sales-order/') && url.includes('/status/')) {
      const orderId = url.split('/')[2]
      const status = url.includes('accept') ? 'ACCEPTED' : 'REJECTED'
      return mockCrud.update('salesOrders', orderId, { status })
    }
    if (url.includes('/invoice/') && url.includes('/status/')) {
      const invoiceId = url.split('/')[2]
      const status = 'PAID'
      return mockCrud.update('invoices', invoiceId, { status })
    }
  }
  return originalPatch.call(this, url, data, config)
}

api.delete = async function(url, config) {
  if (localStorage.getItem('testMode') === 'true') {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const id = url.split('/').pop()
    if (url.includes('/customers/')) return mockCrud.delete('customers', id)
    if (url.includes('/inventory-item/')) return mockCrud.delete('inventory', id)
  }
  return originalDelete.call(this, url, config)
}

export default api