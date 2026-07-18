import { createContext, useContext, useState } from 'react'

// ---------------------------------------------------------------------------
// Very small auth context for the admin panel. Uses hardcoded demo
// credentials for now — replace `login` with a real API call later.
// ---------------------------------------------------------------------------

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

const DEMO_USER = 'admin'
const DEMO_PASS = 'admin123'
const AUTH_KEY = 'snackhut_admin'

// sessionStorage keeps the admin logged in across refreshes, but clears when the
// tab/browser is closed. Wrapped so privacy modes / disabled storage can't crash.
const readAuth = () => {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}
const writeAuth = (v) => {
  try {
    if (v) sessionStorage.setItem(AUTH_KEY, '1')
    else sessionStorage.removeItem(AUTH_KEY)
  } catch {
    /* storage unavailable — stay in-memory */
  }
}

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(readAuth)

  const login = (username, password) => {
    if (username === DEMO_USER && password === DEMO_PASS) {
      setIsAdmin(true)
      writeAuth(true)
      return { ok: true }
    }
    return { ok: false, error: 'Invalid username or password.' }
  }

  const logout = () => {
    setIsAdmin(false)
    writeAuth(false)
  }

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, demo: { user: DEMO_USER, pass: DEMO_PASS } }}>
      {children}
    </AuthContext.Provider>
  )
}
