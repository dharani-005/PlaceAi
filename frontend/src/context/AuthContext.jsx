import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback((tokenData) => {
    // tokenData = { access_token, role, full_name, user_id, email? }
    localStorage.setItem('token', tokenData.access_token)
    const u = {
      role: tokenData.role,
      full_name: tokenData.full_name,
      user_id: tokenData.user_id,
      email: tokenData.email || '',
    }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }, [])

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
