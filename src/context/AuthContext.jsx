import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// ---------------------------------------------------------------------------
// Admin authentication, backed by Supabase Auth.
//
// The session lives in localStorage (see supabase.js) and its access token is
// what Row Level Security checks on every request — so an admin's writes are
// authorised by the database, not by a flag in the browser.
//
// `isAdmin` is not just "signed in": it mirrors the `is_admin()` SQL function,
// which looks the user up in `public.admins`. That is the same predicate every
// admin RLS policy uses, so the UI can never show more than the DB will allow.
// ---------------------------------------------------------------------------

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

const friendly = (message) =>
  /invalid login credentials/i.test(message || '')
    ? 'Wrong email or password.'
    : message || 'Could not sign in. Please try again.'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  // True until the stored session (if any) has been restored and checked, so
  // guarded routes can wait instead of bouncing the admin back to the login.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const apply = async (next) => {
      if (cancelled) return
      setSession(next)
      if (!next) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      const { data, error } = await supabase.rpc('is_admin')
      if (cancelled) return
      setIsAdmin(!error && data === true)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session))

    // supabase-js can deadlock if you call it from inside this callback, so the
    // follow-up work is deferred to the next tick.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setTimeout(() => apply(next), 0)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // Signs in and confirms admin rights up front, so the caller can navigate
  // straight to the dashboard without racing the auth listener.
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password,
    })
    if (error) return { ok: false, error: friendly(error.message) }

    const { data: ok } = await supabase.rpc('is_admin')
    if (ok !== true) {
      await supabase.auth.signOut()
      return { ok: false, error: 'This account does not have admin access.' }
    }

    setSession(data.session)
    setIsAdmin(true)
    setLoading(false)
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, loading, session, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
