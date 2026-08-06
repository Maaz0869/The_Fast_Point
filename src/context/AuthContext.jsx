import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { db } from '../lib/db.js'

// ---------------------------------------------------------------------------
// Authentication for both kinds of account, backed by Supabase Auth.
//
//   • Customers — sign up / sign in from the storefront. Signing in gets them
//     an order history, saved delivery details and their personal coupons.
//   • The shop owner — signs in at /admin.
//
// The session lives in localStorage (see supabase.js) and its access token is
// what Row Level Security checks on every request, so what a user may read or
// write is decided by the database, not by a flag in the browser.
//
// `isAdmin` is not just "signed in": it mirrors the `is_admin()` SQL function,
// which looks the user up in `public.admins`. That is the same predicate every
// admin RLS policy uses, so the UI can never show more than the DB will allow.
// A customer account is simply a signed-in user that `is_admin()` rejects.
// ---------------------------------------------------------------------------

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

const friendly = (message) => {
  const m = String(message || '')
  if (/invalid login credentials/i.test(m)) return 'Wrong email or password.'
  if (/email not confirmed/i.test(m))
    return 'Please confirm your email first — check your inbox for the link.'
  if (/signups? not allowed|signup is disabled/i.test(m))
    return 'New sign-ups are turned off right now. Please contact the shop.'
  if (/already registered|already exists/i.test(m))
    return 'That email already has an account — please sign in instead.'
  if (/password should be at least/i.test(m)) return 'Password must be at least 6 characters.'
  if (/rate limit|too many requests|security purposes/i.test(m))
    return 'Too many attempts. Please wait a minute and try again.'
  if (/database error saving new user/i.test(m))
    return 'Sign-up could not be completed. Please run supabase/user-accounts.sql, then try again.'
  return m || 'Something went wrong. Please try again.'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState(null)
  // True until the stored session (if any) has been restored and checked, so
  // guarded routes can wait instead of bouncing a signed-in user to the login.
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  // Everything a fresh session needs: the admin check and the customer profile.
  const hydrate = useCallback(async (nextUser) => {
    const [adminRes, prof] = await Promise.all([
      supabase.rpc('is_admin'),
      db.profiles.getMine(nextUser.id).catch(() => null),
    ])
    return { isAdmin: !adminRes.error && adminRes.data === true, profile: prof }
  }, [])

  useEffect(() => {
    let cancelled = false

    const apply = async (next) => {
      if (cancelled) return
      setSession(next)
      if (!next) {
        setIsAdmin(false)
        setProfile(null)
        setLoading(false)
        return
      }
      const info = await hydrate(next.user)
      if (cancelled) return
      setIsAdmin(info.isAdmin)
      setProfile(info.profile)
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
  }, [hydrate])

  // ---- Customer sign-up ---------------------------------------------------
  // Name + phone ride along as user metadata; the `on_auth_user_created` trigger
  // copies them into `profiles` so the shop has the customer's details from the
  // very first minute.
  const signUp = useCallback(
    async ({ name, phone, email, password }) => {
      const cleanEmail = String(email).trim()
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name: String(name || '').trim(), phone: String(phone || '').trim() } },
      })
      if (error) return { ok: false, error: friendly(error.message) }

      // A project with "Confirm email" on returns a user but no session — there
      // is nothing to sign in to until they click the link in their inbox.
      if (!data.session) return { ok: true, needsConfirmation: true }

      // The trigger has already written the profile row; this fills in anything
      // it couldn't (and keeps sign-up working if the SQL wasn't applied).
      const prof = await db.profiles
        .upsertMine(data.user.id, { name, phone, email: cleanEmail })
        .catch(() => null)

      setSession(data.session)
      setIsAdmin(false)
      setProfile(prof)
      setLoading(false)
      return { ok: true }
    },
    [],
  )

  // ---- Customer sign-in ---------------------------------------------------
  // Unlike `login` below this places no admin requirement on the account, and
  // reports back whether the user happens to be an admin so the caller can
  // offer them the dashboard.
  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email).trim(),
        password,
      })
      if (error) return { ok: false, error: friendly(error.message) }

      const info = await hydrate(data.user)
      setSession(data.session)
      setIsAdmin(info.isAdmin)
      setProfile(info.profile)
      setLoading(false)
      return { ok: true, isAdmin: info.isAdmin }
    },
    [hydrate],
  )

  // ---- Admin sign-in ------------------------------------------------------
  // Signs in and confirms admin rights up front, so the caller can navigate
  // straight to the dashboard without racing the auth listener. A customer
  // account is signed back out: /admin is not a door it may open.
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
    setProfile(null)
  }, [])

  // ---- Profile ------------------------------------------------------------
  const updateProfile = useCallback(
    async (patch) => {
      if (!user) return { ok: false, error: 'Please sign in first.' }
      try {
        const saved = await db.profiles.upsertMine(user.id, { ...patch, email: user.email })
        setProfile(saved)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: friendly(e.message) }
      }
    },
    [user],
  )

  const changePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    return error ? { ok: false, error: friendly(error.message) } : { ok: true }
  }, [])

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    return error ? { ok: false, error: friendly(error.message) } : { ok: true }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        loading,
        signUp,
        signIn,
        login,
        logout,
        signOut: logout,
        updateProfile,
        changePassword,
        sendPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
