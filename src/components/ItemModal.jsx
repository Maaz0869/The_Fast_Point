import { useMemo, useState } from 'react'
import { EXTRAS, SPICE_LEVELS } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { rs } from '../utils/format.js'
import { Check, Close, Minus, Plus } from './Icons.jsx'

// Modal for customizing a menu item (extras + spice level + quantity) before
// adding it to the cart. Price updates live as options change.
export default function ItemModal({ item, onClose }) {
  const { addItem } = useCart()
  const toast = useToast()
  const [extras, setExtras] = useState([])
  const [spice, setSpice] = useState('medium')
  const [qty, setQty] = useState(1)

  const spiceObj = SPICE_LEVELS.find((s) => s.id === spice)

  const unitPrice = useMemo(() => {
    const extrasTotal = extras.reduce((sum, id) => {
      const e = EXTRAS.find((x) => x.id === id)
      return sum + (e?.price || 0)
    }, 0)
    return item.price + extrasTotal + (spiceObj?.price || 0)
  }, [extras, spiceObj, item.price])

  const toggleExtra = (id) =>
    setExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleAdd = () => {
    addItem({
      itemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      extras: extras.map((id) => EXTRAS.find((x) => x.id === id)).filter(Boolean),
      spice,
      spiceLabel: spiceObj?.name,
      unitPrice,
      qty,
    })
    toast.success(`${qty}× ${item.name} added to cart`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-scale-in flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image header */}
        <div className="relative h-44 flex-none sm:h-52">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow transition hover:bg-white"
            aria-label="Close"
          >
            <Close className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="font-display text-2xl font-bold drop-shadow">{item.name}</h3>
            <p className="text-sm text-white/85">{rs(item.price)}</p>
          </div>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="mb-4 text-sm text-charcoal/60">{item.description}</p>

          {/* Spice level */}
          <div className="mb-6">
            <h4 className="mb-2 font-display text-sm font-bold">Spice Level</h4>
            <div className="grid grid-cols-3 gap-2">
              {SPICE_LEVELS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpice(s.id)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                    spice === s.id
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-black/10 hover:border-brand-300'
                  }`}
                >
                  {s.name}
                  {s.price > 0 && <span className="block text-xs font-normal">+{rs(s.price)}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div className="mb-2">
            <h4 className="mb-2 font-display text-sm font-bold">Add Extras</h4>
            <div className="grid gap-2">
              {EXTRAS.map((e) => {
                const active = extras.includes(e.id)
                return (
                  <button
                    key={e.id}
                    onClick={() => toggleExtra(e.id)}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                      active ? 'border-brand-500 bg-brand-50' : 'border-black/10 hover:border-brand-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                          active ? 'border-brand-500 bg-brand-500 text-white' : 'border-black/20'
                        }`}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                      </span>
                      {e.name}
                    </span>
                    <span className="text-charcoal/60">+{rs(e.price)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none border-t border-black/5 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-black/5 p-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-charcoal shadow-sm transition hover:text-brand-500"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-charcoal shadow-sm transition hover:text-brand-500"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleAdd} className="btn-primary flex-1">
              Add to Cart · {rs(unitPrice * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
