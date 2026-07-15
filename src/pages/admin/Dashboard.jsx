import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext.jsx'
import { rs, formatDateTime } from '../../utils/format.js'

export default function Dashboard() {
  const { orders, menu, deals, discounts } = useStore()

  const revenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0)
  const pending = orders.filter((o) => o.status !== 'Delivered').length
  const recent = orders.slice(0, 5)

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: '🧾', tint: 'bg-blue-50 text-blue-600' },
    { label: 'Revenue', value: rs(revenue), icon: '💰', tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Orders', value: pending, icon: '⏳', tint: 'bg-amber-50 text-amber-600' },
    { label: 'Menu Items', value: menu.length, icon: '🍔', tint: 'bg-brand-50 text-brand-600' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
        <p className="text-sm text-charcoal/55">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.tint}`}>
              {s.icon}
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm text-charcoal/55">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-charcoal/50">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-black/5 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{o.id}</p>
                    <p className="text-xs text-charcoal/50">
                      {o.customer.name} · {o.orderType} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-brand-600">{rs(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/menu', label: 'Add Menu Item', icon: '🍔' },
              { to: '/admin/deals', label: 'Create a Deal', icon: '🏷️' },
              { to: '/admin/slider', label: 'Update Slider', icon: '🖼️' },
              { to: '/admin/delivery', label: 'Delivery Rules', icon: '🛵' },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 rounded-xl border border-black/5 px-4 py-3 text-sm font-semibold transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span>{a.icon}</span> {a.label}
                <span className="ml-auto text-charcoal/30">→</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="font-display text-xl font-extrabold">{deals.length}</p>
              <p className="text-xs text-charcoal/50">Active Deals</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="font-display text-xl font-extrabold">{discounts.length}</p>
              <p className="text-xs text-charcoal/50">Discount Codes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    Pending: 'bg-gray-100 text-gray-600',
    Preparing: 'bg-amber-100 text-amber-700',
    'Out for Delivery': 'bg-blue-100 text-blue-700',
    Delivered: 'bg-emerald-100 text-emerald-700',
  }
  return <span className={`chip ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}
