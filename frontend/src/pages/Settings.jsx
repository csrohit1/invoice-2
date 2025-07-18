import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BuildingOfficeIcon, UserIcon, CogIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company')
  const { user, isTestMode } = useAuth()
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    gstNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: ''
  })

  const queryClient = useQueryClient()

  // Initialize with mock data in test mode
  useState(() => {
    if (isTestMode && user?.tenant) {
      setCompanyData({
        name: user.tenant.name || '',
        email: user.tenant.email || '',
        phone: user.tenant.phone || '',
        website: user.tenant.website || '',
        gstNumber: user.tenant.gstNumber || '',
        addressLine1: user.tenant.addressLine1 || '',
        addressLine2: user.tenant.addressLine2 || '',
        city: user.tenant.city || '',
        state: user.tenant.state || '',
        pincode: user.tenant.pincode || '',
        country: user.tenant.country || ''
      })
    }
  }, [isTestMode, user])

  const { data: tenantSettings } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => api.get('/tenant/settings').then(res => res.data.data),
    enabled: !isTestMode,
    onSuccess: (data) => {
      if (data) {
        setCompanyData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          gstNumber: data.gstNumber || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          country: data.country || ''
        })
      }
    }
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => {
      if (isTestMode) {
        // Mock update in test mode
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: { success: true } })
          }, 500)
        })
      }
      return api.patch('/tenant/update-tenant-settings', data)
    },
    onSuccess: () => {
      if (!isTestMode) {
        queryClient.invalidateQueries(['tenant-settings'])
      }
      alert('Settings updated successfully!')
    }
  })

  const handleCompanySubmit = (e) => {
    e.preventDefault()
    updateSettingsMutation.mutate(companyData)
  }

  const tabs = [
    { id: 'company', name: 'Company Info', icon: BuildingOfficeIcon },
    { id: 'users', name: 'Users', icon: UserIcon },
    { id: 'general', name: 'General', icon: CogIcon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex space-x-8">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Company Information</h3>
              {isTestMode && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Test Mode:</strong> Changes will be saved locally for demonstration purposes.
                  </p>
                </div>
              )}
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="input-field mt-1"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      className="input-field mt-1"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="url"
                      className="input-field mt-1"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GST Number</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={companyData.gstNumber}
                      onChange={(e) => setCompanyData({ ...companyData, gstNumber: e.target.value })}
                      placeholder="Enter GST number"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        value={companyData.addressLine1}
                        onChange={(e) => setCompanyData({ ...companyData, addressLine1: e.target.value })}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        value={companyData.addressLine2}
                        onChange={(e) => setCompanyData({ ...companyData, addressLine2: e.target.value })}
                        placeholder="Apartment, suite, etc. (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        value={companyData.city}
                        onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        value={companyData.state}
                        onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pincode</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        value={companyData.pincode}
                        onChange={(e) => setCompanyData({ ...companyData, pincode: e.target.value })}
                        placeholder="Enter pincode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        value={companyData.country}
                        onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateSettingsMutation.isLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">User Management</h3>
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">User management features will be implemented here.</p>
                <p className="text-sm text-gray-400 mt-2">Add, edit, and manage user roles and permissions.</p>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
              <div className="text-center py-8">
                <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">General settings will be implemented here.</p>
                <p className="text-sm text-gray-400 mt-2">Configure system preferences, notifications, and more.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings