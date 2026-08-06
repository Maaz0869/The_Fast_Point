import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { rs, formatDateTime } from '../../utils/format.js'
import { printOrderInvoice } from '../../utils/invoice.js'
import { reorderLines } from '../../utils/reorder.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function MyOrders() {
  const { orders, loading } = useOutletContext()
  const { menu, restaurant } = useStore()
  const { addItem } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(null)

  // Rebuilds the cart from a past order at today's prices. Items that have left
  // the menu are named in the toast rather than silently dropped.
  const reorder = (order) => {
    const { lines, missing } = reorderLines(order, menu)
    if (!lines.length) {
      toast.error('None of those items are on the menu any more.')
      return
    }
    lines.forEach(addItem)
    if (missing.length) toast.info(`No longer available: ${missing.join(', ')}`)
    toast.success(`${lines.length} item${lines.length > 1 ? 's' : ''} added to your cart`)
    navigate('/cart')
  }

  if (loading) {
    return <p className="card p-10 text-center text-sm text-charcoal/45">Loading your orders…</p>
  }

  if (!orders.length) {
    return (
      <div className="card p-12 text-center">
        <p className="text-4xl">🧾</p>
        <h2 className="mt-4 font-display text-xl font-bold">No orders yet</h2>
        <p className="mt-2 text-sm text-charcoal/55">
          Orders you place while signed in will appear here.
        </p>
        <Link to="/menu" className="btn-primary mt-6">
          Browse the Menu →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const expanded = open === o.id
        return (
          <div key={o.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-bold">#{o.id}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-0.5 text-xs text-charcoal/50">
                  {formatDateTime(o.createdAt)} · {o.orderType} · {o.items.length} item
                  {o.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <span className="font-display text-lg font-extrabold text-brand-600">
                {rs(o.total)}
              </span>
              <button
                onClick={() => setOpen(expanded ? null : o.id)}
                className="btn-ghost px-3 py-2 text-sm"
              >
                {expanded ? 'Hide' : 'Details'}
              </button>
            </div>

            {expanded && (
              <div className="border-t border-black/5 bg-black/[0.02] px-5 py-4">
                <ul className="space-y-2 text-sm">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="text-charcoal/70">
                        <b>{it.qty}×</b> {it.name}
                        {it.spiceLabel && (
                          <span className="text-charcoal/40"> · {it.spiceLabel}</span>
                        )}
                      </span>
                      <span className="flex-none font-semibold">{rs(it.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-3 space-y-1.5 border-t border-dashed border-black/10 pt-3 text-sm">
                  <Row label="Subtotal" value={rs(o.subtotal)} />
                  {o.discount > 0 && (
                    <Row label="Discount" value={`- ${rs(o.discount)}`} accent="text-emerald-600" />
                  )}
                  {o.orderType === 'Delivery' && (
                    <Row
                      label="Delivery Fee"
                      value={o.deliveryFee === 0 ? 'Free' : rs(o.deliveryFee)}
                    />
                  )}
                  <Row label="Payment" value={o.payment} />
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => reorder(o)} className="btn-primary px-4 py-2 text-sm">
                    🔁 Order Again
                  </button>
                  <Link to={`/track?order=${o.id}`} className="btn-outline px-4 py-2 text-sm">
                    Track
                  </Link>
                  <button
                    onClick={() => printOrderInvoice(o, restaurant)}
                    className="btn-dark px-4 py-2 text-sm"
                  >
                    ⬇️ Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Row({ label, value, accent = '' }) {
  return (
    <div className="flex justify-between">
      <dt className="text-charcoal/60">{label}</dt>
      <dd className={`font-semibold ${accent}`}>{value}</dd>
    </div>
  )
}
