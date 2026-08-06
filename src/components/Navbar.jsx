import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import ThemePicker from './ThemePicker.jsx'
import { Cart, Menu as MenuIcon, Close, Sun, Moon, User } from './Icons.jsx'

const links = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/deals', label: 'Deals' },
  { to: '/contact', label: 'Contact' },
]

const accountLinks = [
  { to: '/account', label: 'My Dashboard', icon: '🏠' },
  { to: '/account/orders', label: 'My Orders', icon: '🧾' },
  { to: '/account/coupons', label: 'My Coupons', icon: '🎟️' },
  { to: '/account/profile', label: 'Profile', icon: '👤' },
]

export default function Navbar() {
  const { count } = useCart()
  const { restaurant, myCoupons, isCouponUsable } = useStore()
  const { user, profile, isAdmin, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const location = useLocation()

  // Both menus close on navigation, so a tapped link never leaves one hanging.
  useEffect(() => {
    setOpen(false)
    setAccountOpen(false)
  }, [location.pathname])

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Account'
  const firstName = displayName.split(' ')[0]
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'
  const couponCount = myCoupons.filter(isCouponUsable).length

  const signOut = async () => {
    await logout()
    setAccountOpen(false)
    toast.info('Signed out')
    navigate('/')
  }

  // Show the shop name from the store, with the last word accented.
  const nameParts = (restaurant.name || 'The Snack Hut').trim().split(' ')
  const lastWord = nameParts.pop()
  const leadWords = nameParts.join(' ')

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-cream/90 backdrop-blur-md">
      <nav className="section flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img
            src="/logo.png"
            alt={restaurant.name}
            className="h-9 w-9 rounded-xl object-cover shadow-md shadow-brand-500/30"
          />
          <span className="font-display text-lg font-bold leading-tight tracking-tight">
            {leadWords && `${leadWords} `}
            <span className="text-brand-500">{lastWord}</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-charcoal/70 hover:bg-black/5 hover:text-charcoal'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!restaurant.isOpen && (
            <span className="chip hidden bg-red-100 text-red-600 sm:inline-flex">Closed</span>
          )}
          <ThemePicker />
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-black/5 transition hover:scale-105 hover:text-brand-500"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-black/5 transition hover:scale-105 hover:text-brand-500"
            aria-label="Cart"
          >
            <Cart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full bg-brand-500 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                aria-expanded={accountOpen}
                aria-label="Your account"
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/25 font-display text-xs font-extrabold">
                  {initial}
                </span>
                <span className="max-w-[90px] truncate">{firstName}</span>
                {couponCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-600">
                    {couponCount}
                  </span>
                )}
              </button>

              {accountOpen && (
                <>
                  {/* Click-away catcher, below the panel but above the page. */}
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-2 shadow-xl ring-1 ring-black/5">
                    <div className="border-b border-black/5 px-4 pb-2">
                      <p className="truncate font-display font-bold">{displayName}</p>
                      <p className="truncate text-xs text-charcoal/50">{user.email}</p>
                    </div>
                    {accountLinks.map((a) => (
                      <Link
                        key={a.to}
                        to={a.to}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-charcoal/75 transition hover:bg-black/5 hover:text-charcoal"
                      >
                        <span>{a.icon}</span>
                        {a.label}
                        {a.to === '/account/coupons' && couponCount > 0 && (
                          <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">
                            {couponCount}
                          </span>
                        )}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2.5 border-t border-black/5 px-4 py-2.5 text-sm font-semibold text-charcoal/75 transition hover:bg-black/5"
                      >
                        <span>📊</span> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 border-t border-black/5 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 sm:flex"
            >
              <User className="h-4 w-4" /> Sign In
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-black/5 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <Close className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="animate-fade-in-fast border-t border-black/5 bg-cream md:hidden">
          <ul className="section flex flex-col gap-1 py-3">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-brand-500 text-white' : 'hover:bg-black/5'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link
                to="/track"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-charcoal/70 hover:bg-black/5"
              >
                Track Order
              </Link>
            </li>

            {user ? (
              <>
                <li className="mt-1 border-t border-black/5 px-4 pb-1 pt-3">
                  <p className="truncate font-display text-sm font-bold">{displayName}</p>
                  <p className="truncate text-xs text-charcoal/50">{user.email}</p>
                </li>
                {accountLinks.map((a) => (
                  <li key={a.to}>
                    <Link
                      to={a.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-charcoal/70 hover:bg-black/5"
                    >
                      <span>{a.icon}</span>
                      {a.label}
                      {a.to === '/account/coupons' && couponCount > 0 && (
                        <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">
                          {couponCount}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-charcoal/70 hover:bg-black/5"
                    >
                      <span>📊</span> Admin Panel
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <User className="h-4 w-4" /> Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-center text-sm font-semibold text-charcoal/70 hover:bg-black/5"
                  >
                    Create an account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
