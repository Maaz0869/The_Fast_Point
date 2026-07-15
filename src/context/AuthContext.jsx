import { createContext, useContext, useState } from 'react'

// ---------------------------------------------------------------------------
// Very small auth context for the admin panel. Uses hardcoded demo
// credentials for now — replace `login` with a real API call later.
// ---------------------------------------------------------------------------

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

const DEMO_USER = 'admin'
const DEMO_PASS = 'admin123'

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)

  const login = (username, password) => {
    if (username === DEMO_USER && password === DEMO_PASS) {
      setIsAdmin(true)
      return { ok: true }
    }
    return { ok: false, error: 'Invalid username or password.' }
  }

  const logout = () => setIsAdmin(false)

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, demo: { user: DEMO_USER, pass: DEMO_PASS } }}>
      {children}
    </AuthContext.Provider>
  )
}
