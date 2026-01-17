import { createContext, useContext, useState, useEffect } from 'react'
import { apiEndpoint, apiRequest } from '../config/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Load user from localStorage and verify with backend on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser))
          
          // Verify token with backend
          const response = await apiRequest(apiEndpoint('auth/me'))
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
          } else {
            // Token invalid, clear everything
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            setUser(null)
          }
        } catch (error) {
          console.error('Error verifying token:', error)
          // Keep user logged in locally even if backend is down
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role
        }
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        
        return { success: true, user: userData }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Cannot connect to server. Please try again.' }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role
        }
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        
        return { success: true, user: userData }
      } else {
        return { success: false, error: data.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Cannot connect to server. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.error('Logout error:', err))
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin: user?.role === 'ADMIN'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}