import { Link, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { rs, formatDateTime } from '../../utils/format.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function Overview() {
  const { orders, loading } = useOutletContext()
  const { profile } = useAuth()
  const { myCoupons, isCouponUsable } = useStore()

  const spent = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
  const usable = myCoupons.filter(isCouponUsable)
  const since = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })
    : '—'

  const stats = [
    { label: 'Orders placed', value: loading ? '…' : orders.length, icon: '🧾' },
    { label: 'Total spent', value: loading ? '…' : rs(spent), icon: '💰' },
    { label: 'Coupons for you', value: usable.length, icon: '🎟️', to: '/account/coupons' },
    { label: 'Member since', value: since, icon: '⭐' },
  ]

  const recent = orders.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const card = (
            <div className="card h-full p-5">
              <div className="text-2xl">{s.icon}</div>
              <p className="mt-3 font-display text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                {s.label}
              </p>
            </div>
          )
          return s.to ? (
            <Link key={s.label} to={s.to} className="transition hover:-translate-y-0.5">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          )
        })}
      </div>

      {usable.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white">
          <p className="font-display text-lg font-bold">
            🎉 You have {usable.length} coupon{usable.length > 1 ? 's' : ''} waiting
          </p>
          <p className="mt-1 text-sm text-white/85">
            Use code <b className="tracking-wide">{usable[0].code}</b> — {usable[0].description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/menu" className="btn bg-white text-brand-600 hover:bg-white/90">
              Order Now
            </Link>
            <Link to="/account/coupons" className="btn bg-white/15 text-white hover:bg-white/25">
              See all coupons
            </Link>
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent Orders</h2>
          {orders.length > 3 && (
            <Link to="/account/orders" className="text-sm font-semibold text-brand-600 hover:underline">
              View all →
            </Link>
          )}
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-charcoal/45">Loading…</p>
        ) : recent.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-charcoal/55">You haven't ordered yet.</p>
            <Link to="/menu" className="btn-primary mt-4">
              Browse the Menu →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold">#{o.id}</p>
                  <p className="text-xs text-charcoal/50">
                    {formatDateTime(o.createdAt)} · {o.items.length} item
                    {o.items.length === 1 ? '' : 's'}
                  </p>
                </div>
                <StatusBadge status={o.status} />
                <span className="font-display font-extrabold text-brand-600">{rs(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
