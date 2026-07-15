import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { rs } from '../../utils/format.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blank = { code: '', type: 'percent', value: '', minOrder: '' }

export default function ManageDiscounts() {
  const { discounts, addDiscount, deleteDiscount } = useStore()
  const toast = useToast()
  const [form, setForm] = useState(blank)

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
    addDiscount({
      code,
      type: form.type,
      value,
      minOrder: form.minOrder ? Number(form.minOrder) : undefined,
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
          <button type="submit" className="btn-primary w-full">
            <Plus className="h-4 w-4" /> Create Code
          </button>
        </form>

        {/* List */}
        <div className="space-y-3">
          {discounts.length === 0 && (
            <p className="card p-10 text-center text-sm text-charcoal/50">No discount codes yet.</p>
          )}
          {discounts.map((d) => (
            <div key={d.code} className="card flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-lg">
                  🎟️
                </div>
                <div>
                  <p className="font-display font-bold tracking-wide">{d.code}</p>
                  <p className="text-xs text-charcoal/55">{d.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
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
          ))}
        </div>
      </div>
    </div>
  )
}
