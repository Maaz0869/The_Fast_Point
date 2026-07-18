import { createContext, useContext, useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// ThemeContext — manages two independent things:
//   1. mode   : 'light' | 'dark'   → toggles the `dark` class on <html>
//   2. accent : brand colour theme → sets `data-accent` on <html>
// Both persist to localStorage. The initial values are applied by an inline
// script in index.html (before paint) to avoid a flash of the wrong theme.
// ---------------------------------------------------------------------------

const ThemeContext = createContext(null)

export const useTheme = () => useContext(ThemeContext)

// Available accent themes. `key` matches the [data-accent] selector in
// index.css; `color` is the swatch shown in the picker.
export const ACCENTS = [
  { key: 'orange', label: 'Orange', color: '#f4511e' },
  { key: 'rose', label: 'Rose', color: '#f43f5e' },
  { key: 'emerald', label: 'Emerald', color: '#10b981' },
  { key: 'blue', label: 'Blue', color: '#3b82f6' },
  { key: 'violet', label: 'Violet', color: '#8b5cf6' },
]

// localStorage can throw in sandboxed iframes / privacy modes. Wrap all access
// so the outermost provider can never crash the whole app on mount.
const safeGet = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — theme still works in-memory */
  }
}

const getInitialMode = () => {
  if (typeof window === 'undefined') return 'light'
  const stored = safeGet('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getInitialAccent = () => {
  if (typeof window === 'undefined') return 'orange'
  const stored = safeGet('accent')
  return ACCENTS.some((a) => a.key === stored) ? stored : 'orange'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode)
  const [accent, setAccentState] = useState(getInitialAccent)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    safeSet('theme', mode)
  }, [mode])

  useEffect(() => {
    const root = document.documentElement
    // 'orange' is the :root default, so no attribute needed for it.
    if (accent === 'orange') root.removeAttribute('data-accent')
    else root.setAttribute('data-accent', accent)
    safeSet('accent', accent)
  }, [accent])

  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))
  const setAccent = (key) => setAccentState(key)

  return (
    <ThemeContext.Provider
      value={{
        theme: mode,
        isDark: mode === 'dark',
        toggleTheme,
        accent,
        setAccent,
        accents: ACCENTS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
