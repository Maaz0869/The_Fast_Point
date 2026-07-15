import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { rs } from '../utils/format.js'
import { buildOrderMessage, buildWhatsappLink, sendOrderToWhatsapp } from '../utils/whatsapp.js'
import { Check } from '../components/Icons.jsx'

const ORDER_TYPES = [
  { id: 'Delivery', label: 'Delivery', icon: '🛵', hint: 'To your door' },
  { id: 'Take Away', label: 'Take Away', icon: '🥡', hint: 'Pick up' },
  { id: 'Dine-in', label: 'Dine-in', icon: '🍽️', hint: 'Eat with us' },
]

const PAYMENTS = [
  { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: '💵' },
  { id: 'Card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'Easypaisa / JazzCash', label: 'Easypaisa / JazzCash', icon: '📱' },
]

export default function Checkout() {
  const { items, subtotal, count, clearCart } = useCart()
  const { calcDeliveryFee, findDiscount, placeOrder, restaurant } = useStore()
  const toast = useToast()
  const navigate = useNavigate()

  const [orderType, setOrderType] = useState('Delivery')
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' })
  const [payment, setPayment] = useState('Cash on Delivery')
  const [codeInput, setCodeInput] = useState('')
  const [applied, setApplied] = useState(null)
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)

  const deliveryFee = calcDeliveryFee(subtotal, orderType)

  const discount = useMemo(() => {
    if (!applied) return 0
    if (applied.minOrder && subtotal < applied.minOrder) return 0
    return applied.type === 'percent'
      ? Math.round((subtotal * applied.value) / 100)
      : applied.value
  }, [applied, subtotal])

  const total = Math.max(0, subtotal - discount + deliveryFee)

  if (count === 0) {
    return (
      <div className="section py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">Your cart is empty</h1>
        <Link to="/menu" className="btn-primary mt-6">
          Browse Menu →
        </Link>
      </div>
    )
  }

  const applyCode = () => {
    const found = findDiscount(codeInput)
    if (!found) {
      toast.error('Invalid discount code')
      return
    }
    if (found.minOrder && subtotal < found.minOrder) {
      toast.error(`Minimum order ${rs(found.minOrder)} required for this code`)
      return
    }
    setApplied(found)
    toast.success(`Code ${found.code} applied!`)
  }

  const validate = () => {
    const e = {}
    if (!customer.name.trim()) e.name = 'Name is required'
    if (!customer.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^[0-9+\-\s]{7,}$/.test(customer.phone.trim())) e.phone = 'Enter a valid phone number'
    if (orderType === 'Delivery' && !customer.address.trim()) e.address = 'Delivery address is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const buildOrderPayload = () => ({
    orderType,
    customer:
      orderType === 'Delivery'
        ? customer
        : { name: customer.name, phone: customer.phone },
    items: items.map((l) => ({
      name: line_name(l),
      qty: l.qty,
      price: l.unitPrice,
      lineTotal: l.unitPrice * l.qty,
      extras: l.extras,
      spiceLabel: l.spiceLabel,
    })),
    subtotal,
    deliveryFee,
    discount,
    discountCode: applied?.code || null,
    total,
    payment,
  })

  const submit = (e) => {
    e.preventDefault()
    if (!restaurant.isOpen) {
      toast.error("We're currently closed.")
      return
    }
    if (!validate()) {
      toast.error('Please fill in the required details.')
      return
    }
    setPlacing(true)
    const message = buildOrderMessage({
      items: itemsForMsg(items),
      orderType,
      customer,
      subtotal,
      deliveryFee,
      discount,
      total,
    })
    // Send the order straight to the shop's WhatsApp — the customer never
    // leaves the site. Falls back to opening WhatsApp only if no auto-send key
    // is configured yet.
    if (restaurant.callmebotApiKey) {
      sendOrderToWhatsapp(restaurant.whatsapp, restaurant.callmebotApiKey, message).catch(() => {})
    } else {
      window.open(buildWhatsappLink(restaurant.whatsapp, message), '_blank')
    }
    const record = placeOrder(buildOrderPayload())
    clearCart()
    setPlacing(false)
    toast.success('Order placed successfully! 🎉')
    navigate(`/order/${record.id}`, { state: { order: record } })
  }

  return (
    <div className="section py-10">
      <h1 className="mb-8 font-display text-3xl font-extrabold">Checkout</h1>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Order type */}
          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">1. Order Type</h2>
            <div className="grid grid-cols-3 gap-3">
              {ORDER_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setOrderType(t.id)}
                  className={`rounded-2xl border-2 p-4 text-center transition ${
                    orderType === t.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-black/10 hover:border-brand-300'
                  }`}
                >
                  <div className="text-2xl">{t.icon}</div>
                  <div className="mt-1 text-sm font-bold">{t.label}</div>
                  <div className="text-xs text-charcoal/50">{t.hint}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Customer details */}
          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">2. Your Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" error={errors.name}>
                <input
                  className="input"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="e.g. Ali Raza"
                />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input
                  className="input"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="e.g. 0300 1234567"
                />
              </Field>
              {orderType === 'Delivery' && (
                <div className="sm:col-span-2">
                  <Field label="Delivery Address" error={errors.address}>
                    <textarea
                      className="input min-h-[90px] resize-y"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="House #, street, area, city"
                    />
                  </Field>
                </div>
              )}
            </div>
            {orderType !== 'Delivery' && (
              <p className="mt-3 rounded-lg bg-brand-50 p-3 text-xs text-brand-700">
                {orderType === 'Take Away'
                  ? '🥡 Your order will be ready for pickup at our counter.'
                  : '🍽️ Please share your name so our staff can seat you.'}
              </p>
            )}
          </section>

          {/* Payment */}
          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">3. Payment Method</h2>
            <div className="grid gap-3">
              {PAYMENTS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                    payment === p.id ? 'border-brand-500 bg-brand-50' : 'border-black/10 hover:border-brand-300'
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="flex-1 text-sm font-semibold">{p.label}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      payment === p.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-black/20'
                    }`}
                  >
                    {payment === p.id && <Check className="h-3 w-3" />}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <h2 className="font-display text-lg font-bold">Order Summary</h2>

            <ul className="mt-4 max-h-52 space-y-3 overflow-y-auto pr-1">
              {items.map((l) => (
                <li key={l.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-charcoal/70">
                    <b>{l.qty}×</b> {l.name}
                    {l.spiceLabel && <span className="text-charcoal/40"> · {l.spiceLabel}</span>}
                  </span>
                  <span className="flex-none font-semibold">{rs(l.unitPrice * l.qty)}</span>
                </li>
              ))}
            </ul>

            {/* Discount code */}
            <div className="mt-4 flex gap-2">
              <input
                className="input"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Discount code"
              />
              <button type="button" onClick={applyCode} className="btn-dark flex-none px-4 py-2 text-sm">
                Apply
              </button>
            </div>
            {applied && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">
                ✓ {applied.code} — {applied.description}
              </p>
            )}

            <dl className="mt-4 space-y-2 border-t border-dashed border-black/10 pt-4 text-sm">
              <Row label="Subtotal" value={rs(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`- ${rs(discount)}`} accent="text-emerald-600" />}
              <Row
                label={orderType === 'Delivery' ? 'Delivery Fee' : 'Delivery'}
                value={
                  orderType !== 'Delivery'
                    ? '—'
                    : deliveryFee === 0
                    ? 'Free'
                    : rs(deliveryFee)
                }
                accent={deliveryFee === 0 && orderType === 'Delivery' ? 'text-emerald-600' : ''}
              />
              <div className="my-1 border-t border-dashed border-black/10" />
              <div className="flex justify-between text-base">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display font-extrabold text-brand-600">{rs(total)}</dd>
              </div>
            </dl>

            <button type="submit" disabled={placing || !restaurant.isOpen} className="btn-primary mt-5 w-full">
              {placing ? 'Placing order…' : `Place Order · ${rs(total)}`}
            </button>

            {!restaurant.isOpen && (
              <p className="mt-3 text-center text-sm font-semibold text-red-600">
                We're currently closed.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// Compose a display name that includes extras so the order record is clear.
function line_name(l) {
  if (!l.extras?.length) return l.name
  return `${l.name} (${l.extras.map((e) => e.name).join(', ')})`
}

function itemsForMsg(items) {
  return items.map((l) => ({
    name: l.name,
    qty: l.qty,
    unitPrice: l.unitPrice,
    extras: l.extras,
    spiceLabel: l.spiceLabel,
  }))
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
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
