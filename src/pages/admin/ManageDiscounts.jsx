import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { rs } from '../../utils/format.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blank = { code: '', type: 'percent', value: '', minOrder: '', days: '', maxUses: '' }

export default function ManageDiscounts() {
  const { discounts, customers, addDiscount, deleteDiscount } = useStore()
  const toast = useToast()
  const [form, setForm] = useState(blank)

  // Personal coupons live in the same table; they're issued from the Customers
  // page, and shown here so every code the shop has out is in one list.
  const ownerOf = (userId) => {
    const c = customers.find((x) => x.id === userId)
    return c ? c.name || c.email : 'a customer'
  }

  const add = (e) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (!code || !form.value) {
      toast.error('Code and value are required')
      return
    }
    if (discounts.some((d) => d.code.toUpperCase() === code)) {
      toast.error('That code already exists')
      return
    }
    const value = Number(form.value)
    if (form.type === 'percent' && value > 100) {
      toast.error('A percentage discount cannot be over 100%')
      return
    }
    const days = Number(form.days)
    addDiscount({
      code,
      type: form.type,
      value,
      minOrder: form.minOrder ? Number(form.minOrder) : undefined,
      // Public code: no owner. Personal ones are created from Customers.
      userId: null,
      expiresAt: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null,
      maxUses: Number(form.maxUses) > 0 ? Number(form.maxUses) : null,
      description:
        form.type === 'percent'
          ? `${value}% off${form.minOrder ? ` on orders over ${rs(form.minOrder)}` : ''}`
          : `${rs(value)} off${form.minOrder ? ` on orders over ${rs(form.minOrder)}` : ''}`,
    })
    toast.success(`Code ${code} created`)
    setForm(blank)
  }

  const remove = (code) => {
    if (window.confirm(`Remove code "${code}"?`)) {
      deleteDiscount(code)
      toast.success('Code removed')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Discount Codes</h1>
        <p className="text-sm text-charcoal/55">Create promo codes customers can apply at checkout.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Create form */}
        <form onSubmit={add} className="card h-fit space-y-4 p-5">
          <h2 className="font-display font-bold">Create New Code</h2>
          <div>
            <label className="label">Code</label>
            <input
              className="input uppercase"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="SNACK10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
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
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'percent' ? '10' : '200'}
              />
            </div>
          </div>
          <div>
            <label className="label">Minimum Order (optional)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
              placeholder="1500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valid for (days)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.days}
                onChange={(e) => setForm({ ...form, days: e.target.value })}
                placeholder="Never expires"
              />
            </div>
            <div>
              <label className="label">Total uses</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            <Plus className="h-4 w-4" /> Create Code
          </button>
          <p className="rounded-lg bg-brand-50 p-3 text-xs text-brand-700">
            This creates a <b>public</b> code anyone can use. To give one customer their own private
            coupon, go to{' '}
            <Link to="/admin/customers" className="font-bold underline">
              Customers
            </Link>
            .
          </p>
        </form>

        {/* List */}
        <div className="space-y-3">
          {discounts.length === 0 && (
            <p className="card p-10 text-center text-sm text-charcoal/50">No discount codes yet.</p>
          )}
          {discounts.map((d) => {
            const expired = d.expiresAt && new Date(d.expiresAt) < new Date()
            const usedUp = d.maxUses != null && d.usedCount >= d.maxUses
            return (
            <div
              key={d.code}
              className={`card flex items-center justify-between gap-3 p-4 ${
                expired || usedUp ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-lg">
                  🎟️
                </div>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-display font-bold tracking-wide">
                    {d.code}
                    {d.userId ? (
                      <span className="chip bg-brand-50 text-brand-600">
                        Private · {ownerOf(d.userId)}
                      </span>
                    ) : (
                      <span className="chip bg-black/5 text-charcoal/50">Public</span>
                    )}
                  </p>
                  <p className="text-xs text-charcoal/55">{d.description}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-charcoal/40">
                    {d.expiresAt && (
                      <span className={expired ? 'font-semibold text-red-500' : ''}>
                        {expired ? 'Expired' : `Expires ${new Date(d.expiresAt).toLocaleDateString('en-PK')}`}
                      </span>
                    )}
                    <span className={usedUp ? 'font-semibold text-red-500' : ''}>
                      Used {d.usedCount}
                      {d.maxUses != null ? ` / ${d.maxUses}` : ' time(s)'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-none items-center gap-3">
                <span className="chip bg-emerald-50 text-emerald-600">
                  {d.type === 'percent' ? `${d.value}%` : rs(d.value)}
                </span>
                <button
                  onClick={() => remove(d.code)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                  aria-label="Remove"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
