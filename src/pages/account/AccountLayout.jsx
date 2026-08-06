import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { db } from '../../lib/db.js'

const tabs = [
  { to: '/account', label: 'Overview', icon: '🏠', end: true },
  { to: '/account/orders', label: 'My Orders', icon: '🧾' },
  { to: '/account/coupons', label: 'My Coupons', icon: '🎟️' },
  { to: '/account/profile', label: 'Profile', icon: '👤' },
]

// The customer's dashboard shell: identity header, tabs, and the order history
// every tab shares (fetched once here and handed down through the outlet).
export default function AccountLayout() {
  const { user, profile, isAdmin, logout } = useAuth()
  const { restaurant } = useStore()
  const toast = useToast()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Keyed on the user id alone: `toast` is a fresh object on every toast render,
  // so depending on it here would make a failed load retry itself forever.
  const userId = user?.id
  const load = useCallback(async () => {
    if (!userId) return
    setError('')
    try {
      setOrders(await db.orders.mine(userId))
    } catch (e) {
      console.error('[account] order history failed to load:', e)
      setError("We couldn't load your orders just now.")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const signOut = async () => {
    await logout()
    toast.info('Signed out')
    navigate('/')
  }

  const name = profile?.name || user?.email?.split('@')[0] || 'there'
  const initial = name.trim().charAt(0).toUpperCase() || '🙂'

  return (
    <div className="section py-10">
      {/* Header */}
      <div className="card flex flex-wrap items-center gap-4 p-6">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-brand-500 font-display text-xl font-extrabold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-extrabold">
            Hi, {name.split(' ')[0]}! 👋
          </h1>
          <p className="truncate text-sm text-charcoal/55">{user?.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <NavLink to="/admin/dashboard" className="btn-outline px-4 py-2 text-sm">
              Admin Panel
            </NavLink>
          )}
          <button onClick={signOut} className="btn-dark px-4 py-2 text-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex flex-none items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white text-charcoal/70 ring-1 ring-black/5 hover:text-brand-600'
              }`
            }
          >
            <span>{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>

      {error && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
          <button onClick={load} className="font-bold underline">
            Try again
          </button>
        </div>
      )}

      <div className="mt-6">
        <Outlet context={{ orders, loading, reload: load, shopName: restaurant.name }} />
      </div>
    </div>
  )
}
