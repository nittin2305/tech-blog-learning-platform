import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const handler = () => { logout(); navigate('/login') }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout, navigate])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, role: data.role }))
    setToken(data.token)
    setUser({ username: data.username, email: data.email, role: data.role })
    return data
  }, [])

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/api/auth/register', { username, email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, role: data.role }))
    setToken(data.token)
    setUser({ username: data.username, email: data.email, role: data.role })
    return data
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
