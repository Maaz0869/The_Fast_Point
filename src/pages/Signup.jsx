import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Check } from '../components/Icons.jsx'

const PERKS = [
  'Personal discount coupons, just for you',
  'Your delivery details filled in automatically',
  'Every past order in one place — reorder in one tap',
]

export default function Signup() {
  const { user, signUp } = useAuth()
  const { restaurant } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Set when the project requires email confirmation — there's no session yet,
  // so the only thing left to tell the customer is "check your inbox".
  const [sentTo, setSentTo] = useState('')

  const from = location.state?.from?.pathname || '/account'

  if (user) return <Navigate to={from} replace />

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Please enter your name.')
    if (!/^[0-9+\-\s]{7,}$/.test(form.phone.trim())) return setError('Enter a valid phone number.')
    if (!form.email.trim()) return setError('Please enter your email.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Both passwords must match.')

    setBusy(true)
    const res = await signUp(form)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    if (res.needsConfirmation) {
      setSentTo(form.email.trim())
      return
    }
    toast.success(`Welcome to ${restaurant.name}! 🎉`)
    navigate(from, { replace: true })
  }

  if (sentTo) {
    return (
      <div className="section max-w-md py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold">Almost there!</h1>
        <p className="mt-2 text-sm text-charcoal/60">
          We've sent a confirmation link to <b>{sentTo}</b>. Tap it to activate your account, then
          come back and sign in.
        </p>
        <Link to="/login" className="btn-primary mt-7">
          Go to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="section max-w-md py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">Create your account</h1>
        <p className="mt-2 text-sm text-charcoal/55">
          Join {restaurant.name} — it takes less than a minute.
        </p>
      </div>

      <ul className="mt-6 space-y-2 rounded-2xl bg-brand-50 p-4">
        {PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm font-medium text-brand-700">
            <Check className="mt-0.5 h-4 w-4 flex-none" strokeWidth={3} />
            {p}
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <label className="block">
          <span className="label">Full Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Ali Raza"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="label">Phone Number</span>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="e.g. 0300 1234567"
          />
        </label>

        <label className="block">
          <span className="label">Email</span>
          <input
            type="email"
            autoComplete="username"
            className="input"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="input"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </label>
          <label className="block">
            <span className="label">Confirm Password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="input"
              value={form.confirm}
              onChange={(e) => set({ confirm: e.target.value })}
              placeholder="••••••••"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal/60">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-bold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
