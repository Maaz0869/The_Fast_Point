import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function AdminLogin() {
  const { isAdmin, login, demo } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />

  const submit = (e) => {
    e.preventDefault()
    const res = login(form.username.trim(), form.password)
    if (res.ok) {
      toast.success('Welcome back, admin!')
      navigate('/admin/dashboard')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-night via-night to-brand-900 p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg">
            🍔
          </span>
          <span className="font-display text-xl font-bold">The Snack Hut</span>
        </Link>

        <div className="animate-scale-in rounded-2xl bg-white p-7 shadow-2xl">
          <h1 className="font-display text-2xl font-extrabold">Admin Login</h1>
          <p className="mt-1 text-sm text-charcoal/55">Sign in to manage your restaurant.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value })
                  setError('')
                }}
                placeholder="admin"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value })
                  setError('')
                }}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full">
              Sign In
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-brand-50 p-3 text-center text-xs text-brand-700">
            Demo credentials — <b>{demo.user}</b> / <b>{demo.pass}</b>
          </div>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-sm font-semibold text-white/70 hover:text-white"
        >
          ← Back to website
        </Link>
      </div>
    </div>
  )
}
