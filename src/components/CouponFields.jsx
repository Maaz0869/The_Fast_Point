// Coupon terms shared by every place the admin creates a personal coupon:
// Customers (one customer / everyone) and Promotions (attach to a broadcast).
// Only where the *code* comes from differs between them.
export default function CouponFields({ form, setForm }) {
  const set = (patch) => setForm({ ...form, ...patch })

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => set({ type: e.target.value })}>
            <option value="percent">Percentage (%)</option>
            <option value="flat">Flat (Rs.)</option>
          </select>
        </div>
        <div>
          <label className="label">{form.type === 'percent' ? 'Percent' : 'Amount'}</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.value}
            onChange={(e) => set({ value: e.target.value })}
            placeholder={form.type === 'percent' ? '15' : '300'}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Minimum order (optional)</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.minOrder}
            onChange={(e) => set({ minOrder: e.target.value })}
            placeholder="1500"
          />
        </div>
        <div>
          <label className="label">Valid for (days)</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.days}
            onChange={(e) => set({ days: e.target.value })}
            placeholder="30"
          />
          <p className="mt-1 text-xs text-charcoal/45">0 = never expires</p>
        </div>
      </div>

      <div>
        <label className="label">How many times can it be used?</label>
        <input
          type="number"
          min="0"
          className="input"
          value={form.maxUses}
          onChange={(e) => set({ maxUses: e.target.value })}
          placeholder="1"
        />
        <p className="mt-1 text-xs text-charcoal/45">0 = unlimited</p>
      </div>
    </>
  )
}
