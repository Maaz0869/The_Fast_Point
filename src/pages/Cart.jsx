import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { rs } from '../utils/format.js'
import { Minus, Plus, Trash } from '../components/Icons.jsx'

export default function Cart() {
  const { items, setQty, removeItem, subtotal, count } = useCart()
  const { calcDeliveryFee, deliveryRules, restaurant } = useStore()
  const navigate = useNavigate()

  // Show the delivery estimate for a default Delivery order type.
  const estDelivery = calcDeliveryFee(subtotal, 'Delivery')
  const total = subtotal + estDelivery
  const remainingForFree = Math.max(0, deliveryRules.freeAbove - subtotal)

  if (count === 0) {
    return (
      <div className="section flex flex-col items-center py-24 text-center">
        <span className="text-6xl">🛒</span>
        <h1 className="mt-6 font-display text-2xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-charcoal/55">Looks like you haven't added anything yet.</p>
        <Link to="/menu" className="btn-primary mt-6">
          Browse Menu →
        </Link>
      </div>
    )
  }

  return (
    <div className="section py-10">
      <h1 className="mb-8 font-display text-3xl font-extrabold">Your Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="space-y-4">
          {items.map((line) => (
            <div key={line.id} className="card flex gap-4 p-4">
              <img
                src={line.image}
                alt={line.name}
                className="h-24 w-24 flex-none rounded-xl object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold leading-tight">{line.name}</h3>
                    {(line.extras?.length > 0 || line.spiceLabel) && (
                      <p className="mt-1 text-xs text-charcoal/50">
                        {line.spiceLabel && <span>Spice: {line.spiceLabel}</span>}
                        {line.extras?.length > 0 && (
                          <span>
                            {line.spiceLabel ? ' · ' : ''}
                            {line.extras.map((e) => e.name).join(', ')}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-charcoal/60">{rs(line.unitPrice)} each</p>
                  </div>
                  <button
                    onClick={() => removeItem(line.id)}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-charcoal/40 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove item"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 rounded-full bg-black/5 p-1">
                    <button
                      onClick={() => setQty(line.id, line.qty - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-charcoal shadow-sm transition hover:text-brand-500"
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold">{line.qty}</span>
                    <button
                      onClick={() => setQty(line.id, line.qty + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-charcoal shadow-sm transition hover:text-brand-500"
                      aria-label="Increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-display font-bold text-brand-600">
                    {rs(line.unitPrice * line.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Link to="/menu" className="inline-block text-sm font-semibold text-brand-600 hover:underline">
            ← Add more items
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <h2 className="font-display text-lg font-bold">Order Summary</h2>

            {remainingForFree > 0 && (
              <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                Add <b>{rs(remainingForFree)}</b> more for <b>free delivery</b>! 🚚
              </div>
            )}

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-charcoal/60">Subtotal ({count} items)</dt>
                <dd className="font-semibold">{rs(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-charcoal/60">Delivery (est.)</dt>
                <dd className="font-semibold">
                  {estDelivery === 0 ? <span className="text-emerald-600">Free</span> : rs(estDelivery)}
                </dd>
              </div>
              <div className="my-2 border-t border-dashed border-black/10" />
              <div className="flex justify-between text-base">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display font-extrabold text-brand-600">{rs(total)}</dd>
              </div>
            </dl>

            <p className="mt-2 text-xs text-charcoal/40">
              Final delivery fee depends on your chosen order type at checkout.
            </p>

            {restaurant.isOpen ? (
              <button onClick={() => navigate('/checkout')} className="btn-primary mt-5 w-full">
                Proceed to Checkout →
              </button>
            ) : (
              <div className="mt-5 rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
                Currently Closed — ordering unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
