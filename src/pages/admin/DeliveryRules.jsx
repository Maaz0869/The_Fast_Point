import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { rs } from '../../utils/format.js'
import { Plus, Trash } from '../../components/Icons.jsx'

export default function DeliveryRules() {
  const { deliveryRules, setDeliveryRules, calcDeliveryFee } = useStore()
  const toast = useToast()
  const [rules, setRules] = useState(() => ({
    mode: deliveryRules.mode || 'zone',
    freeAbove: deliveryRules.freeAbove,
    charge: deliveryRules.charge,
    areas: deliveryRules.areas ? deliveryRules.areas.map((a) => ({ ...a })) : [],
    tiers: deliveryRules.tiers ? deliveryRules.tiers.map((t) => ({ ...t })) : [],
    distanceTiers: deliveryRules.distanceTiers
      ? deliveryRules.distanceTiers.map((t) => ({ ...t }))
      : [],
    distanceBeyond: deliveryRules.distanceBeyond ?? 0,
  }))
  const [preview, setPreview] = useState(800)
  const [previewKm, setPreviewKm] = useState(4)
  const [previewArea, setPreviewArea] = useState('')

  // ---- Order-total tiers ----
  const updateTier = (i, key, val) =>
    setRules((r) => {
      const tiers = [...r.tiers]
      tiers[i] = { ...tiers[i], [key]: Number(val) }
      return { ...r, tiers }
    })
  const addTier = () => setRules((r) => ({ ...r, tiers: [...r.tiers, { upTo: 0, charge: 0 }] }))
  const removeTier = (i) => setRules((r) => ({ ...r, tiers: r.tiers.filter((_, idx) => idx !== i) }))

  // ---- Distance tiers ----
  const updateDist = (i, key, val) =>
    setRules((r) => {
      const distanceTiers = [...r.distanceTiers]
      distanceTiers[i] = { ...distanceTiers[i], [key]: Number(val) }
      return { ...r, distanceTiers }
    })
  const addDist = () =>
    setRules((r) => ({ ...r, distanceTiers: [...r.distanceTiers, { uptoKm: 0, charge: 0 }] }))
  const removeDist = (i) =>
    setRules((r) => ({ ...r, distanceTiers: r.distanceTiers.filter((_, idx) => idx !== i) }))

  // ---- Delivery areas (jagah) ----
  const areaId = (name, i) =>
    (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
    `area-${i}`
  const updateArea = (i, key, val) =>
    setRules((r) => {
      const areas = [...r.areas]
      areas[i] = { ...areas[i], [key]: val }
      return { ...r, areas }
    })
  const addArea = () =>
    setRules((r) => ({ ...r, areas: [...r.areas, { id: '', name: '', charge: 0 }] }))
  const removeArea = (i) =>
    setRules((r) => ({ ...r, areas: r.areas.filter((_, idx) => idx !== i) }))

  const save = () => {
    const clean = {
      mode: rules.mode,
      // Zone mode has no free-delivery threshold — the area charge always applies.
      freeAbove: rules.mode === 'zone' ? 0 : Number(rules.freeAbove) || 0,
      charge: Number(rules.charge) || 0,
      areas: rules.areas
        .map((a, i) => ({ id: areaId(a.name, i), name: (a.name || '').trim(), charge: Number(a.charge) || 0 }))
        .filter((a) => a.name),
      tiers: rules.tiers
        .map((t) => ({ upTo: Number(t.upTo), charge: Number(t.charge) }))
        .filter((t) => t.upTo > 0)
        .sort((a, b) => a.upTo - b.upTo),
      distanceTiers: rules.distanceTiers
        .map((t) => ({ uptoKm: Number(t.uptoKm), charge: Number(t.charge) }))
        .filter((t) => t.uptoKm > 0)
        .sort((a, b) => a.uptoKm - b.uptoKm),
      distanceBeyond: Number(rules.distanceBeyond) || 0,
    }
    setDeliveryRules(clean)
    toast.success('Delivery rules saved')
  }

  const isDistance = rules.mode === 'distance'
  const isZone = rules.mode === 'zone'
  // Preview uses SAVED rules so admins see live behaviour.
  const previewFee = calcDeliveryFee(
    Number(preview) || 0,
    'Delivery',
    Number(previewKm) || 0,
    previewArea,
  )

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Delivery Charge Rules</h1>
        <p className="text-sm text-charcoal/55">
          Charge delivery by area (place), by distance (km), or by order total.
        </p>
      </div>

      <div className="card space-y-6 p-6">
        {/* Mode toggle */}
        <div>
          <label className="label">Charge delivery based on</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRules({ ...rules, mode: 'zone' })}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                isZone ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-black/10'
              }`}
            >
              🏘️ Area / Place
            </button>
            <button
              type="button"
              onClick={() => setRules({ ...rules, mode: 'distance' })}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                isDistance ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-black/10'
              }`}
            >
              📍 Distance (km)
            </button>
            <button
              type="button"
              onClick={() => setRules({ ...rules, mode: 'order' })}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                !isDistance ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-black/10'
              }`}
            >
              🧾 Order total
            </button>
          </div>
        </div>

        {/* Base rule */}
        <div className="grid gap-4 sm:grid-cols-2">
          {!isZone && (
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
                Orders at or above this subtotal get free delivery (0 = disabled).
              </p>
            </div>
          )}
          <div>
            <label className="label">Fallback charge (Rs.)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={rules.charge}
              onChange={(e) => setRules({ ...rules, charge: e.target.value })}
            />
            <p className="mt-1 text-xs text-charcoal/45">Used when no tier matches.</p>
          </div>
        </div>

        {/* Delivery areas (jagah) */}
        {isZone && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Delivery areas &amp; charges</label>
              <button onClick={addArea} className="btn-ghost px-3 py-1.5 text-sm">
                <Plus className="h-4 w-4" /> Add Area
              </button>
            </div>
            <p className="mb-3 text-xs text-charcoal/45">
              Add every place you deliver to and its charge. Customers pick their area at
              checkout and see the charge for it.
            </p>
            <div className="space-y-2">
              {rules.areas.length === 0 && (
                <p className="rounded-xl bg-gray-50 p-3 text-sm text-charcoal/50">
                  No areas yet — the fallback charge applies to all deliveries.
                </p>
              )}
              {rules.areas.map((a, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2">
                  <input
                    className="input flex-1 py-2"
                    value={a.name}
                    onChange={(e) => updateArea(i, 'name', e.target.value)}
                    placeholder="Area / place name (e.g. Mingora)"
                  />
                  <span className="text-sm text-charcoal/60">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    className="input w-24 py-2"
                    value={a.charge}
                    onChange={(e) => updateArea(i, 'charge', e.target.value)}
                  />
                  <button
                    onClick={() => removeArea(i)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    aria-label="Remove area"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distance tiers */}
        {isDistance && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Distance charges</label>
              <button onClick={addDist} className="btn-ghost px-3 py-1.5 text-sm">
                <Plus className="h-4 w-4" /> Add Distance Tier
              </button>
            </div>
            <p className="mb-3 text-xs text-charcoal/45">
              e.g. within 3 km → Rs. 50; within 6 km → Rs. 100; within 10 km → Rs. 180.
            </p>
            <div className="space-y-2">
              {rules.distanceTiers.length === 0 && (
                <p className="rounded-xl bg-gray-50 p-3 text-sm text-charcoal/50">
                  No distance tiers — the fallback charge applies to all deliveries.
                </p>
              )}
              {rules.distanceTiers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2">
                  <span className="pl-2 text-sm text-charcoal/60">Within</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="input w-24 py-2"
                    value={t.uptoKm}
                    onChange={(e) => updateDist(i, 'uptoKm', e.target.value)}
                  />
                  <span className="text-sm text-charcoal/60">km → charge Rs.</span>
                  <input
                    type="number"
                    min="0"
                    className="input w-24 py-2"
                    value={t.charge}
                    onChange={(e) => updateDist(i, 'charge', e.target.value)}
                  />
                  <button
                    onClick={() => removeDist(i)}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    aria-label="Remove tier"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-charcoal/60">Beyond the last tier → charge Rs.</span>
              <input
                type="number"
                min="0"
                className="input w-28 py-2"
                value={rules.distanceBeyond}
                onChange={(e) => setRules({ ...rules, distanceBeyond: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Order-total tiers */}
        {!isDistance && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Order-total charges</label>
              <button onClick={addTier} className="btn-ghost px-3 py-1.5 text-sm">
                <Plus className="h-4 w-4" /> Add Tier
              </button>
            </div>
            <p className="mb-3 text-xs text-charcoal/45">
              e.g. subtotal under Rs. 500 → Rs. 150; under Rs. 1500 → Rs. 100.
            </p>
            <div className="space-y-2">
              {rules.tiers.length === 0 && (
                <p className="rounded-xl bg-gray-50 p-3 text-sm text-charcoal/50">
                  No tiers — the fallback charge applies to all orders below the free threshold.
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
        )}

        <button onClick={save} className="btn-primary">
          Save Rules
        </button>
      </div>

      {/* Live preview (against saved rules) */}
      <div className="card mt-6 p-6">
        <h2 className="mb-3 font-display font-bold">Preview (saved rules)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-charcoal/60">Subtotal Rs.</span>
          <input
            type="number"
            min="0"
            className="input w-28"
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
          />
          {deliveryRules.mode === 'distance' && (
            <>
              <span className="text-sm text-charcoal/60">Distance</span>
              <input
                type="number"
                min="0"
                step="0.5"
                className="input w-24"
                value={previewKm}
                onChange={(e) => setPreviewKm(e.target.value)}
              />
              <span className="text-sm text-charcoal/60">km</span>
            </>
          )}
          {deliveryRules.mode === 'zone' && (
            <>
              <span className="text-sm text-charcoal/60">Area</span>
              <select
                className="input w-44"
                value={previewArea}
                onChange={(e) => setPreviewArea(e.target.value)}
              >
                <option value="">Select area…</option>
                {(deliveryRules.areas || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <span className="text-sm text-charcoal/60">→ fee:</span>
          <span className="chip bg-brand-50 text-sm text-brand-600">
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
