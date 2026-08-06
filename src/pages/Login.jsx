import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function Login() {
  const { user, signIn, sendPasswordReset } = useAuth()
  const { restaurant } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Where the customer was headed before being asked to sign in.
  const from = location.state?.from?.pathname || '/account'

  if (user) return <Navigate to={from} replace />

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.')
      return
    }
    setBusy(true)
    const res = await signIn(form.email, form.password)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    toast.success('Welcome back! 👋')
    navigate(from, { replace: true })
  }

  const forgot = async () => {
    if (!form.email.trim()) {
      setError('Enter your email first, then tap "Forgot password".')
      return
    }
    setBusy(true)
    const res = await sendPasswordReset(form.email)
    setBusy(false)
    if (res.ok) toast.success('Password reset link sent — check your email.')
    else setError(res.error)
  }

  return (
    <div className="section max-w-md py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-2 text-sm text-charcoal/55">
          Sign in to see your orders and personal coupons from {restaurant.name}.
        </p>
      </div>

      <form onSubmit={submit} className="card mt-7 space-y-4 p-6">
        <label className="block">
          <span className="label">Email</span>
          <input
            type="email"
            autoComplete="username"
            className="input"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="you@example.com"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            className="input"
            value={form.password}
            onChange={(e) => set({ password: e.target.value })}
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={forgot}
          disabled={busy}
          className="w-full text-center text-xs font-semibold text-charcoal/50 hover:text-brand-600"
        >
          Forgot password?
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal/60">
        New here?{' '}
        <Link to="/signup" state={location.state} className="font-bold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-charcoal/40">
        Shop owner?{' '}
        <Link to="/admin" className="font-semibold hover:text-brand-600">
          Admin login →
        </Link>
      </p>
    </div>
  )
}
