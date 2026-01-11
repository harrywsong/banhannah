import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    // Mock authentication - in production, call API
    const mockUsers = [
      { id: 1, email: 'admin@yewon.com', password: 'admin123', name: 'Admin User', role: 'admin' },
      { id: 2, email: 'student@yewon.com', password: 'student123', name: 'Student User', role: 'student' },
      { id: 3, email: 'test@test.com', password: 'test123', name: 'Test User', role: 'student' }
    ]

    const foundUser = mockUsers.find(u => u.email === email && u.password === password)
    
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return { success: true, user: userData }
    }
    
    return { success: false, error: 'Invalid email or password' }
  }

  const register = (name, email, password) => {
    // Mock registration - in production, call API
    const newUser = {
      id: Date.now(),
      email,
      name,
      role: 'student'
    }
    
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
    if (existingUsers.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' }
    }

    existingUsers.push({ ...newUser, password })
    localStorage.setItem('users', JSON.stringify(existingUsers))
    
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
    return { success: true, user: newUser }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin: user?.role === 'admin'
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
