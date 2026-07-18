import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Menu as MenuIcon, Close } from '../../components/Icons.jsx'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/orders', label: 'Orders', icon: '🧾' },
  { to: '/admin/menu', label: 'Menu Items', icon: '🍔' },
  { to: '/admin/deals', label: 'Deals & Offers', icon: '🏷️' },
  { to: '/admin/discounts', label: 'Discount Codes', icon: '🎟️' },
  { to: '/admin/slider', label: 'Hero Slider', icon: '🖼️' },
  { to: '/admin/delivery', label: 'Delivery Rules', icon: '🛵' },
  { to: '/admin/expenses', label: 'Expenses', icon: '💸' },
  { to: '/admin/suppliers', label: 'Suppliers & Udhaar', icon: '🤝' },
  { to: '/admin/businesses', label: 'Businesses (P&L)', icon: '🏢' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const { restaurant, toggleOpen, orders } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pendingCount = orders.filter((o) => o.status !== 'Delivered').length

  const handleLogout = () => {
    logout()
    toast.info('Logged out')
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-night text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm">
              🍔
            </span>
            <span className="truncate font-display font-bold">{restaurant.name}</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close menu">
            <Close className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.to === '/admin/orders' && pendingCount > 0 && (
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            🌐 View Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-black/5 bg-white px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-black/10 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-charcoal/50 sm:inline">Restaurant is</span>
            <button
              onClick={toggleOpen}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition ${
                restaurant.isOpen
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${restaurant.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}
              />
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
