import { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { rs, formatDateTime } from '../../utils/format.js'
import { printBusinessReport } from '../../utils/invoice.js'
import { filterByPeriod, todayLocal } from '../../utils/period.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blankEntry = () => ({ type: 'income', date: todayLocal(), category: '', description: '', amount: '' })

export default function Businesses() {
  const {
    businesses,
    restaurant,
    expenseCategories,
    incomeCategories,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    addBusinessEntry,
    deleteBusinessEntry,
    businessTotals,
  } = useStore()
  const toast = useToast()

  const [editing, setEditing] = useState(null) // 'new' | id | null
  const [form, setForm] = useState({ name: '', note: '' })
  const [openId, setOpenId] = useState(null)
  const [entry, setEntry] = useState(blankEntry())

  const open = businesses.find((b) => b.id === openId) || null

  // Overall net across all businesses (for the header).
  const grandNet = useMemo(
    () => businesses.reduce((sum, b) => sum + businessTotals(b).net, 0),
    [businesses, businessTotals],
  )

  const openNew = () => {
    setForm({ name: '', note: '' })
    setEditing('new')
  }
  const openEdit = (b) => {
    setForm({ name: b.name, note: b.note || '' })
    setEditing(b.id)
  }
  const saveBusiness = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Business name is required')
      return
    }
    if (editing === 'new') {
      addBusiness(form)
      toast.success('Business account created')
    } else {
      updateBusiness(editing, form)
      toast.success('Business updated')
    }
    setEditing(null)
  }
  const removeBusiness = (b) => {
    if (window.confirm(`Delete "${b.name}" and all its records?`)) {
      deleteBusiness(b.id)
      if (openId === b.id) setOpenId(null)
      toast.success('Business deleted')
    }
  }

  const saveEntry = (e) => {
    e.preventDefault()
    if (!entry.amount || Number(entry.amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    addBusinessEntry(open.id, entry)
    toast.success(entry.type === 'income' ? 'Income added' : 'Expense added')
    setEntry({ ...blankEntry(), type: entry.type })
  }
  const removeEntry = (en) => {
    if (window.confirm('Delete this entry?')) {
      deleteBusinessEntry(open.id, en.id)
      toast.success('Entry deleted')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Businesses</h1>
          <p className="text-sm text-charcoal/55">
            {businesses.length} accounts · Overall{' '}
            <b className={grandNet >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {grandNet >= 0 ? 'Profit' : 'Loss'} {rs(Math.abs(grandNet))}
            </b>
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New Business
        </button>
      </div>

      {/* Business cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => {
          const t = businessTotals(b)
          const profit = t.net >= 0
          return (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display font-bold">{b.name}</h3>
                  {b.note && <p className="truncate text-xs text-charcoal/50">{b.note}</p>}
                </div>
                <span
                  className={`chip whitespace-nowrap ${
                    profit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {profit ? 'Profit' : 'Loss'}
                </span>
              </div>

              <div
                className={`mt-3 rounded-xl p-3 ${profit ? 'bg-emerald-50' : 'bg-red-50'}`}
              >
                <p className="text-xs text-charcoal/50">Net {profit ? 'Profit' : 'Loss'}</p>
                <p
                  className={`font-display text-2xl font-extrabold ${
                    profit ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {rs(Math.abs(t.net))}
                </p>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-charcoal/55">
                  Income <b className="text-emerald-600">{rs(t.income)}</b>
                </span>
                <span className="text-charcoal/55">
                  Expense <b className="text-red-600">{rs(t.expense)}</b>
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setOpenId(b.id)}
                  className="flex-1 rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                >
                  Open Account
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeBusiness(b)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {businesses.length === 0 && (
        <p className="card p-10 text-center text-sm text-charcoal/50">
          No business accounts yet — create one for each of your ventures.
        </p>
      )}

      {/* ---- Add / edit business modal ---- */}
      {editing && (
        <Modal
          title={editing === 'new' ? 'New Business Account' : 'Edit Business'}
          onClose={() => setEditing(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={saveBusiness} className="btn-primary" type="submit" form="business-form">
                Save
              </button>
            </div>
          }
        >
          <form id="business-form" onSubmit={saveBusiness} className="space-y-4">
            <div>
              <label className="label">Business / Account Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Juice Corner, Catering, Branch 2"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <textarea
                className="input min-h-[60px] resize-y"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Location / description"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ---- Business account detail modal ---- */}
      {open && (
        <Modal
          title={open.name}
          onClose={() => {
            setOpenId(null)
            setEntry(blankEntry())
          }}
          wide
          footer={
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setOpenId(null)
                  setEntry(blankEntry())
                }}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          }
        >
          <AccountBody
            business={open}
            restaurant={restaurant}
            totals={businessTotals(open)}
            entry={entry}
            setEntry={setEntry}
            onSaveEntry={saveEntry}
            onRemoveEntry={removeEntry}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            toast={toast}
          />
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail body: P&L summary, add-entry form, daily breakdown + entries list.
// ---------------------------------------------------------------------------
function AccountBody({
  business,
  restaurant,
  totals,
  entry,
  setEntry,
  onSaveEntry,
  onRemoveEntry,
  incomeCategories,
  expenseCategories,
  toast,
}) {
  const profit = totals.net >= 0
  const cats = entry.type === 'income' ? incomeCategories : expenseCategories
  const [custom, setCustom] = useState({ from: todayLocal(), to: todayLocal() })

  const download = (period) => {
    const { items, label } = filterByPeriod(business.entries, (e) => e.date, period, custom)
    if (items.length === 0) {
      toast.error('No entries found for this period')
      return
    }
    printBusinessReport(business, restaurant, items, label)
  }

  // Group by date for the daily record (newest first).
  const byDay = useMemo(() => {
    const map = {}
    business.entries.forEach((e) => {
      const d = e.date || ''
      if (!map[d]) map[d] = { income: 0, expense: 0 }
      map[d][e.type] += Number(e.amount || 0)
    })
    return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }, [business.entries])

  const entries = [...business.entries].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div>
      {/* P&L summary */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs text-charcoal/50">Income</p>
          <p className="font-display text-lg font-extrabold text-emerald-600">{rs(totals.income)}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-xs text-charcoal/50">Expense</p>
          <p className="font-display text-lg font-extrabold text-red-600">{rs(totals.expense)}</p>
        </div>
        <div className={`rounded-xl p-3 ${profit ? 'bg-emerald-100' : 'bg-red-100'}`}>
          <p className="text-xs text-charcoal/50">Net {profit ? 'Profit' : 'Loss'}</p>
          <p
            className={`font-display text-lg font-extrabold ${
              profit ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {rs(Math.abs(totals.net))}
          </p>
        </div>
      </div>

      {/* Download reports */}
      <div className="mb-6 rounded-xl border border-dashed border-black/15 p-4">
        <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-charcoal/60">
          ⬇️ Download Report
        </h4>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => download('today')} className="btn-dark">
            Daily (Today)
          </button>
          <button onClick={() => download('week')} className="btn-dark">
            Weekly
          </button>
          <button onClick={() => download('month')} className="btn-dark">
            Monthly
          </button>
          <button onClick={() => download('all')} className="btn-ghost">
            All Time
          </button>
        </div>

        {/* Custom range */}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input"
              value={custom.from}
              onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              value={custom.to}
              onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            />
          </div>
          <button onClick={() => download('custom')} className="btn-outline">
            Download Range
          </button>
        </div>
      </div>

      {/* Add entry */}
      <form onSubmit={onSaveEntry} className="mb-6 rounded-xl bg-gray-50 p-4">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEntry({ ...entry, type: 'income', category: '' })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              entry.type === 'income'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-charcoal/60 ring-1 ring-black/10'
            }`}
          >
            + Income
          </button>
          <button
            type="button"
            onClick={() => setEntry({ ...entry, type: 'expense', category: '' })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              entry.type === 'expense'
                ? 'bg-red-500 text-white'
                : 'bg-white text-charcoal/60 ring-1 ring-black/10'
            }`}
          >
            − Expense
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={entry.date}
              onChange={(e) => setEntry({ ...entry, date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Amount (Rs.)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={entry.amount}
              onChange={(e) => setEntry({ ...entry, amount: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={entry.category}
              onChange={(e) => setEntry({ ...entry, category: e.target.value })}
            >
              <option value="">Select…</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={entry.description}
              onChange={(e) => setEntry({ ...entry, description: e.target.value })}
              placeholder="Details…"
            />
          </div>
        </div>
        <button
          type="submit"
          className={`btn mt-3 w-full text-white ${
            entry.type === 'income'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {entry.type === 'income' ? 'Add Income' : 'Add Expense'}
        </button>
      </form>

      {/* Daily record */}
      <h4 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-charcoal/60">
        Daily Record
      </h4>
      {byDay.length === 0 ? (
        <p className="mb-6 rounded-xl bg-gray-50 p-6 text-center text-sm text-charcoal/50">
          No entries yet.
        </p>
      ) : (
        <div className="mb-6 overflow-x-auto rounded-xl ring-1 ring-black/5">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Income</th>
                <th className="px-3 py-2 text-right">Expense</th>
                <th className="px-3 py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {byDay.map(([d, v]) => {
                const net = v.income - v.expense
                return (
                  <tr key={d} className="border-t border-black/5">
                    <td className="whitespace-nowrap px-3 py-2 text-charcoal/70">
                      {formatDateTime(d).split(',')[0]}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600">{rs(v.income)}</td>
                    <td className="px-3 py-2 text-right text-red-600">{rs(v.expense)}</td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${
                        net >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {rs(net)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* All entries */}
      <h4 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-charcoal/60">
        Transactions ({entries.length})
      </h4>
      {entries.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-charcoal/50">
          No transactions yet — add income or an expense above.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((en) => (
            <div
              key={en.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {en.category || (en.type === 'income' ? 'Income' : 'Expense')}
                  {en.description && (
                    <span className="text-charcoal/50"> · {en.description}</span>
                  )}
                </p>
                <p className="text-xs text-charcoal/45">{formatDateTime(en.date).split(',')[0]}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`whitespace-nowrap font-semibold ${
                    en.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {en.type === 'income' ? '+ ' : '− '}
                  {rs(en.amount)}
                </span>
                <button
                  onClick={() => onRemoveEntry(en)}
                  className="text-charcoal/30 hover:text-red-500"
                  aria-label="Delete entry"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
