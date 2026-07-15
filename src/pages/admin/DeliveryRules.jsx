import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { rs } from '../../utils/format.js'
import { Plus, Trash } from '../../components/Icons.jsx'

export default function DeliveryRules() {
  const { deliveryRules, setDeliveryRules, calcDeliveryFee } = useStore()
  const toast = useToast()
  const [rules, setRules] = useState(() => ({
    freeAbove: deliveryRules.freeAbove,
    charge: deliveryRules.charge,
    tiers: deliveryRules.tiers ? [...deliveryRules.tiers.map((t) => ({ ...t }))] : [],
  }))
  const [preview, setPreview] = useState(800)

  const updateTier = (i, key, val) => {
    setRules((r) => {
      const tiers = [...r.tiers]
      tiers[i] = { ...tiers[i], [key]: Number(val) }
      return { ...r, tiers }
    })
  }
  const addTier = () => setRules((r) => ({ ...r, tiers: [...r.tiers, { upTo: 0, charge: 0 }] }))
  const removeTier = (i) => setRules((r) => ({ ...r, tiers: r.tiers.filter((_, idx) => idx !== i) }))

  const save = () => {
    const clean = {
      freeAbove: Number(rules.freeAbove) || 0,
      charge: Number(rules.charge) || 0,
      tiers: rules.tiers
        .map((t) => ({ upTo: Number(t.upTo), charge: Number(t.charge) }))
        .filter((t) => t.upTo > 0)
        .sort((a, b) => a.upTo - b.upTo),
    }
    setDeliveryRules(clean)
    toast.success('Delivery rules saved')
  }

  // Live preview uses the SAVED rules so admins see current behaviour.
  const previewFee = calcDeliveryFee(Number(preview) || 0, 'Delivery')

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Delivery Charge Rules</h1>
        <p className="text-sm text-charcoal/55">
          Define how delivery fees are calculated based on the order subtotal.
        </p>
      </div>

      <div className="card space-y-6 p-6">
        {/* Base rule */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Free delivery above (Rs.)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={rules.freeAbove}
              onChange={(e) => setRules({ ...rules, freeAbove: e.target.value })}
            />
            <p className="mt-1 text-xs text-charcoal/45">
              Orders at or above this amount get free delivery.
            </p>
          </div>
          <div>
            <label className="label">Default charge below threshold (Rs.)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={rules.charge}
              onChange={(e) => setRules({ ...rules, charge: e.target.value })}
            />
            <p className="mt-1 text-xs text-charcoal/45">
              Applied when no tier matches (and below free threshold).
            </p>
          </div>
        </div>

        {/* Tiers */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Tiered charges (optional)</label>
            <button onClick={addTier} className="btn-ghost px-3 py-1.5 text-sm">
              <Plus className="h-4 w-4" /> Add Tier
            </button>
          </div>
          <p className="mb-3 text-xs text-charcoal/45">
            e.g. up to Rs. 500 → Rs. 150 charge; up to Rs. 1500 → Rs. 100 charge.
          </p>
          <div className="space-y-2">
            {rules.tiers.length === 0 && (
              <p className="rounded-xl bg-gray-50 p-3 text-sm text-charcoal/50">
                No tiers — the default charge applies to all orders below the free threshold.
              </p>
            )}
            {rules.tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2">
                <span className="pl-2 text-sm text-charcoal/60">Subtotal under Rs.</span>
                <input
                  type="number"
                  min="0"
                  className="input w-28 py-2"
                  value={t.upTo}
                  onChange={(e) => updateTier(i, 'upTo', e.target.value)}
                />
                <span className="text-sm text-charcoal/60">→ charge Rs.</span>
                <input
                  type="number"
                  min="0"
                  className="input w-28 py-2"
                  value={t.charge}
                  onChange={(e) => updateTier(i, 'charge', e.target.value)}
                />
                <button
                  onClick={() => removeTier(i)}
                  className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  aria-label="Remove tier"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} className="btn-primary">
          Save Rules
        </button>
      </div>

      {/* Live preview (against saved rules) */}
      <div className="card mt-6 p-6">
        <h2 className="mb-3 font-display font-bold">Preview (saved rules)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-charcoal/60">Order subtotal Rs.</span>
          <input
            type="number"
            min="0"
            className="input w-32"
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
          />
          <span className="text-sm text-charcoal/60">→ delivery fee:</span>
          <span className="chip bg-brand-50 text-brand-600 text-sm">
            {previewFee === 0 ? 'Free 🎉' : rs(previewFee)}
          </span>
        </div>
        <p className="mt-2 text-xs text-charcoal/45">
          Save your changes above to see them reflected here and on the customer site.
        </p>
      </div>
    </div>
  )
}
