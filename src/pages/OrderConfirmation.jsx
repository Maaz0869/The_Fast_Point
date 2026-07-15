import { Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { rs, formatDateTime } from '../utils/format.js'
import { Check } from '../components/Icons.jsx'

export default function OrderConfirmation() {
  const { id } = useParams()
  const location = useLocation()
  const { findOrder } = useStore()

  // Prefer the freshly-placed order passed via navigation state, else look up.
  const order = location.state?.order || findOrder(id)

  if (!order) {
    return (
      <div className="section py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">Order not found</h1>
        <p className="mt-2 text-charcoal/55">We couldn't find order {id}.</p>
        <Link to="/menu" className="btn-primary mt-6">
          Back to Menu
        </Link>
      </div>
    )
  }

  return (
    <div className="section max-w-2xl py-12">
      <div className="animate-scale-in text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold">Order Confirmed! 🎉</h1>
        <p className="mt-2 text-charcoal/55">
          Thanks {order.customer.name.split(' ')[0]}! Your order has been received and is being
          prepared.
        </p>
        <div className="mt-5 inline-flex flex-col items-center rounded-2xl bg-brand-50 px-8 py-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Order Number
          </span>
          <span className="font-display text-2xl font-extrabold text-brand-700">{order.id}</span>
        </div>
      </div>

      <div className="card mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-4">
          <div>
            <p className="text-xs text-charcoal/50">Placed on</p>
            <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
          </div>
          <span className="chip bg-amber-100 text-amber-700">{order.status}</span>
        </div>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <Detail label="Order Type" value={order.orderType} />
          <Detail label="Payment" value={order.payment} />
          <Detail label="Name" value={order.customer.name} />
          <Detail label="Phone" value={order.customer.phone} />
          {order.customer.address && (
            <div className="sm:col-span-2">
              <Detail label="Delivery Address" value={order.customer.address} />
            </div>
          )}
        </div>

        <div className="border-t border-black/5 pt-4">
          <h3 className="mb-3 font-display font-bold">Items</h3>
          <ul className="space-y-2 text-sm">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="text-charcoal/70">
                  <b>{it.qty}×</b> {it.name}
                </span>
                <span className="font-semibold">{rs(it.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-dashed border-black/10 pt-4 text-sm">
            <Row label="Subtotal" value={rs(order.subtotal)} />
            {order.discount > 0 && (
              <Row label="Discount" value={`- ${rs(order.discount)}`} accent="text-emerald-600" />
            )}
            {order.orderType === 'Delivery' && (
              <Row
                label="Delivery Fee"
                value={order.deliveryFee === 0 ? 'Free' : rs(order.deliveryFee)}
              />
            )}
            <div className="flex justify-between border-t border-dashed border-black/10 pt-2 text-base">
              <dt className="font-display font-bold">Total</dt>
              <dd className="font-display font-extrabold text-brand-600">{rs(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to={`/track?order=${order.id}`} className="btn-outline flex-1">
          Track My Order
        </Link>
        <Link to="/menu" className="btn-primary flex-1">
          Order Again
        </Link>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-charcoal/50">{label}</p>
      <p className="font-semibold">{value}</p>
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
