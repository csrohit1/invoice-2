import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Mock user data for testing
const mockUser = {
  id: 'test-user-id',
  email: 'admin@test.com',
  tenantId: 'test-tenant-id',
  role: 'ADMIN',
  firstName: 'Admin',
  lastName: 'User',
  tenant: {
    id: 'test-tenant-id',
    name: 'Test Company Ltd',
    email: 'admin@test.com',
    phone: '+1234567890',
    website: 'https://testcompany.com',
    gstNumber: '29ABCDE1234F2Z5',
    addressLine1: '123 Business Street',
    addressLine2: 'Suite 100',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India'
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const testMode = localStorage.getItem('testMode') === 'true'
    
    if (token) {
      if (testMode) {
        setUser(mockUser)
        setIsTestMode(true)
      } else {
        // In real mode, you would verify the token with the backend
        setUser({ token })
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // Check for test credentials
      if (email === 'admin@test.com' && password === 'test123') {
        // Mock login for testing
        const mockToken = 'mock-jwt-token-for-testing'
        
        localStorage.setItem('accessToken', mockToken)
        localStorage.setItem('testMode', 'true')
        
        setUser(mockUser)
        setIsTestMode(true)
        navigate('/')
        return { success: true }
      }

      // Real API login
      const response = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken } = response.data.data
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('testMode', 'false')
      
      setUser({ token: accessToken })
      setIsTestMode(false)
      navigate('/')
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('testMode')
    setUser(null)
    setIsTestMode(false)
    navigate('/login')
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isTestMode
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}