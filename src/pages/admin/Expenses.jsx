import { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { rs, formatDateTime } from '../../utils/format.js'
import { printExpenseReport } from '../../utils/invoice.js'
import { filterByPeriod, todayLocal } from '../../utils/period.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blank = () => ({
  date: todayLocal(),
  category: '',
  description: '',
  paidTo: '',
  method: 'Cash',
  amount: '',
})

const METHODS = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other']

export default function Expenses() {
  const { expenses, expenseCategories, restaurant, addExpense, updateExpense, deleteExpense } =
    useStore()
  const toast = useToast()

  const [editing, setEditing] = useState(null) // 'new' | id | null
  const [form, setForm] = useState(blank())
  const [filterCat, setFilterCat] = useState('all')
  const [filterMonth, setFilterMonth] = useState('') // yyyy-mm
  const [range, setRange] = useState({ from: todayLocal(), to: todayLocal() })

  const downloadReport = (period) => {
    const { items, label } = filterByPeriod(expenses, (e) => e.date, period, range)
    if (items.length === 0) {
      toast.error('No expenses found for this period')
      return
    }
    printExpenseReport(items, restaurant, label)
  }

  const filtered = useMemo(() => {
    return [...expenses]
      .filter((e) => (filterCat === 'all' ? true : e.category === filterCat))
      .filter((e) => (filterMonth ? String(e.date).startsWith(filterMonth) : true))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, filterCat, filterMonth])

  const total = useMemo(() => filtered.reduce((s, e) => s + Number(e.amount || 0), 0), [filtered])

  // Totals by category (for the mini breakdown).
  const byCategory = useMemo(() => {
    const map = {}
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const openNew = () => {
    setForm({ ...blank(), category: expenseCategories[0] })
    setEditing('new')
  }
  const openEdit = (e) => {
    setForm({ ...e })
    setEditing(e.id)
  }
  const save = (ev) => {
    ev.preventDefault()
    if (!form.category) {
      toast.error('Please pick a category')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (editing === 'new') {
      addExpense(form)
      toast.success('Expense added')
    } else {
      updateExpense(editing, form)
      toast.success('Expense updated')
    }
    setEditing(null)
  }
  const remove = (e) => {
    if (window.confirm('Delete this expense?')) {
      deleteExpense(e.id)
      toast.success('Expense deleted')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Expenses</h1>
          <p className="text-sm text-charcoal/55">Track your business kharche.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {/* Summary tiles */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Total (filtered)</p>
          <p className="font-display text-2xl font-extrabold text-brand-600">{rs(total)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Entries</p>
          <p className="font-display text-2xl font-extrabold">{filtered.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Top Category</p>
          <p className="truncate font-display text-lg font-bold">
            {byCategory[0] ? byCategory[0][0] : '—'}
          </p>
          {byCategory[0] && (
            <p className="text-sm text-charcoal/50">{rs(byCategory[0][1])}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">All categories</option>
            {expenseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Month</label>
          <input
            type="month"
            className="input"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
        {(filterCat !== 'all' || filterMonth) && (
          <button
            onClick={() => {
              setFilterCat('all')
              setFilterMonth('')
            }}
            className="btn-ghost"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Download report */}
      <div className="card mb-6 p-4">
        <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-charcoal/60">
          ⬇️ Download Report
        </h4>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadReport('today')} className="btn-dark">
            Daily (Today)
          </button>
          <button onClick={() => downloadReport('week')} className="btn-dark">
            Weekly
          </button>
          <button onClick={() => downloadReport('month')} className="btn-dark">
            Monthly
          </button>
          <button onClick={() => downloadReport('all')} className="btn-ghost">
            All Time
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input"
              value={range.from}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              value={range.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
            />
          </div>
          <button onClick={() => downloadReport('custom')} className="btn-outline">
            Download Range
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="card p-10 text-center text-sm text-charcoal/50">
          No expenses found — add one to get started.
        </p>
      ) : (
        <>
          {/* Mobile: card stack */}
          <div className="space-y-3 md:hidden">
            {filtered.map((e) => (
              <div key={e.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="chip bg-brand-50 text-brand-600">{e.category}</span>
                    <p className="mt-2 text-sm font-medium">{e.description || '—'}</p>
                    <p className="text-xs text-charcoal/50">
                      {formatDateTime(e.date).split(',')[0]}
                      {e.paidTo ? ` · ${e.paidTo}` : ''} · {e.method}
                    </p>
                  </div>
                  <span className="flex-none font-display font-bold text-brand-600">
                    {rs(e.amount)}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-3 border-t border-black/5 pt-3">
                  <button
                    onClick={() => openEdit(e)}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(e)}
                    className="text-charcoal/40 hover:text-red-500"
                    aria-label="Delete"
                  >
                    <Trash className="inline h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="card flex justify-between p-4 font-bold">
              <span>Total</span>
              <span className="text-brand-600">{rs(total)}</span>
            </div>
          </div>

          {/* Desktop: table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Paid To</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-black/5">
                  <td className="whitespace-nowrap px-4 py-3 text-charcoal/60">
                    {formatDateTime(e.date).split(',')[0]}
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip bg-brand-50 text-brand-600">{e.category}</span>
                  </td>
                  <td className="px-4 py-3">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-charcoal/60">{e.paidTo || '—'}</td>
                  <td className="px-4 py-3 text-charcoal/60">{e.method}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    {rs(e.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(e)}
                      className="mr-2 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(e)}
                      className="text-charcoal/30 hover:text-red-500"
                      aria-label="Delete"
                    >
                      <Trash className="inline h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/10 font-bold">
                <td className="px-4 py-3" colSpan={5}>
                  Total
                </td>
                <td className="px-4 py-3 text-right text-brand-600">{rs(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          </div>
        </>
      )}

      {/* Add / edit modal */}
      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Expense' : 'Edit Expense'}
          onClose={() => setEditing(null)}
          wide
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={save} className="btn-primary" type="submit" form="expense-form">
                Save
              </button>
            </div>
          }
        >
          <form id="expense-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Amount (Rs.) *</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select…</option>
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Paid To (optional)</label>
              <input
                className="input"
                value={form.paidTo}
                onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                placeholder="e.g. PESCO, Swat Packaging"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was this for?"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
