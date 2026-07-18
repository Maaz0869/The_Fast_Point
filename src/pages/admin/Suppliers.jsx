import { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { rs, formatDateTime } from '../../utils/format.js'
import { printSupplierInvoice } from '../../utils/invoice.js'
import { todayLocal } from '../../utils/period.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blankSupplier = { name: '', company: '', phone: '', address: '', note: '', openingBalance: '' }
const blankTxn = () => ({ type: 'purchase', date: todayLocal(), invoiceNo: '', description: '', amount: '' })

export default function Suppliers() {
  const {
    suppliers,
    restaurant,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierTxn,
    deleteSupplierTxn,
    supplierBalance,
  } = useStore()
  const toast = useToast()

  const [editing, setEditing] = useState(null) // 'new' | supplierId | null
  const [form, setForm] = useState(blankSupplier)
  const [openId, setOpenId] = useState(null) // supplier detail view
  const [txn, setTxn] = useState(blankTxn())

  const open = suppliers.find((s) => s.id === openId) || null

  const totalOwed = useMemo(
    () => suppliers.reduce((sum, s) => sum + Math.max(0, supplierBalance(s)), 0),
    [suppliers, supplierBalance],
  )

  // ---- Supplier account CRUD ----
  const openNew = () => {
    setForm(blankSupplier)
    setEditing('new')
  }
  const openEdit = (s) => {
    setForm({
      name: s.name,
      company: s.company || '',
      phone: s.phone || '',
      address: s.address || '',
      note: s.note || '',
      openingBalance: s.openingBalance || '',
    })
    setEditing(s.id)
  }
  const saveSupplier = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Supplier name is required')
      return
    }
    if (editing === 'new') {
      addSupplier(form)
      toast.success('Supplier account created')
    } else {
      updateSupplier(editing, { ...form, openingBalance: Number(form.openingBalance) || 0 })
      toast.success('Supplier updated')
    }
    setEditing(null)
  }
  const removeSupplier = (s) => {
    if (window.confirm(`Delete "${s.name}" and its full ledger?`)) {
      deleteSupplier(s.id)
      if (openId === s.id) setOpenId(null)
      toast.success('Supplier deleted')
    }
  }

  // ---- Ledger transactions ----
  const saveTxn = (e) => {
    e.preventDefault()
    if (!txn.amount || Number(txn.amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    addSupplierTxn(open.id, txn)
    toast.success(txn.type === 'purchase' ? 'Purchase (udhaar) added' : 'Payment recorded')
    setTxn(blankTxn())
  }
  const removeTxn = (t) => {
    if (window.confirm('Delete this entry?')) {
      deleteSupplierTxn(open.id, t.id)
      toast.success('Entry deleted')
    }
  }

  const downloadInvoice = (s) => {
    printSupplierInvoice(s, restaurant, supplierBalance(s))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Suppliers & Udhaar</h1>
          <p className="text-sm text-charcoal/55">
            {suppliers.length} accounts · Total payable{' '}
            <b className="text-red-600">{rs(totalOwed)}</b>
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New Supplier
        </button>
      </div>

      {/* Supplier cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => {
          const bal = supplierBalance(s)
          return (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display font-bold">{s.name}</h3>
                  {s.company && <p className="truncate text-xs text-charcoal/50">{s.company}</p>}
                </div>
                <span
                  className={`chip whitespace-nowrap ${
                    bal > 0
                      ? 'bg-red-100 text-red-600'
                      : bal < 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-charcoal/60'
                  }`}
                >
                  {bal > 0 ? 'Payable' : bal < 0 ? 'Advance' : 'Clear'}
                </span>
              </div>

              {s.phone && <p className="mt-2 text-sm text-charcoal/60">📞 {s.phone}</p>}

              <div className="mt-3 rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-charcoal/50">Balance</p>
                <p
                  className={`font-display text-xl font-extrabold ${
                    bal > 0 ? 'text-red-600' : bal < 0 ? 'text-emerald-600' : 'text-charcoal'
                  }`}
                >
                  {rs(Math.abs(bal))}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setOpenId(s.id)}
                  className="flex-1 rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                >
                  Open Account
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeSupplier(s)}
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

      {suppliers.length === 0 && (
        <p className="card p-10 text-center text-sm text-charcoal/50">
          No suppliers yet — create an account to start tracking udhaar.
        </p>
      )}

      {/* ---- Add / edit supplier modal ---- */}
      {editing && (
        <Modal
          title={editing === 'new' ? 'New Supplier Account' : 'Edit Supplier'}
          onClose={() => setEditing(null)}
          wide
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={saveSupplier} className="btn-primary" type="submit" form="supplier-form">
                Save
              </button>
            </div>
          }
        >
          <form id="supplier-form" onSubmit={saveSupplier} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Supplier Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Khan Meat Suppliers"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Company (optional)</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Khan & Sons"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0301 2345678"
              />
            </div>
            <div>
              <label className="label">Opening Balance (Rs.)</label>
              <input
                type="number"
                className="input"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                placeholder="Already owed amount (0 if none)"
                disabled={editing !== 'new'}
              />
              {editing !== 'new' && (
                <p className="mt-1 text-xs text-charcoal/45">
                  Opening balance can only be set when creating the account.
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Shop / market address"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Note (optional)</label>
              <textarea
                className="input min-h-[60px] resize-y"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="e.g. Delivers every Monday"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ---- Supplier account / ledger modal ---- */}
      {open && (
        <Modal
          title={open.name}
          onClose={() => {
            setOpenId(null)
            setTxn(blankTxn())
          }}
          wide
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <button onClick={() => downloadInvoice(open)} className="btn-dark">
                ⬇️ Download Invoice
              </button>
              <button
                onClick={() => {
                  setOpenId(null)
                  setTxn(blankTxn())
                }}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          }
        >
          <AccountBody
            supplier={open}
            balance={supplierBalance(open)}
            txn={txn}
            setTxn={setTxn}
            onSaveTxn={saveTxn}
            onRemoveTxn={removeTxn}
          />
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Account body: balance summary + add-transaction form + ledger table.
// ---------------------------------------------------------------------------
function AccountBody({ supplier, balance, txn, setTxn, onSaveTxn, onRemoveTxn }) {
  const sorted = [...supplier.ledger].sort((a, b) => new Date(b.date) - new Date(a.date))
  const owed = balance >= 0

  return (
    <div>
      {/* Balance banner */}
      <div
        className={`mb-5 flex items-center justify-between rounded-xl p-4 ${
          owed ? 'bg-red-50' : 'bg-emerald-50'
        }`}
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">
            {owed ? 'Balance Payable (Udhaar)' : 'Advance / Credit'}
          </p>
          <p
            className={`font-display text-2xl font-extrabold ${
              owed ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {rs(Math.abs(balance))}
          </p>
        </div>
        {supplier.phone && <span className="text-sm text-charcoal/55">📞 {supplier.phone}</span>}
      </div>

      {/* Add transaction */}
      <form onSubmit={onSaveTxn} className="mb-6 rounded-xl bg-gray-50 p-4">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setTxn({ ...txn, type: 'purchase' })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              txn.type === 'purchase'
                ? 'bg-red-500 text-white'
                : 'bg-white text-charcoal/60 ring-1 ring-black/10'
            }`}
          >
            + Purchase / Udhaar
          </button>
          <button
            type="button"
            onClick={() => setTxn({ ...txn, type: 'payment' })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              txn.type === 'payment'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-charcoal/60 ring-1 ring-black/10'
            }`}
          >
            − Payment
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={txn.date}
              onChange={(e) => setTxn({ ...txn, date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Amount (Rs.)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={txn.amount}
              onChange={(e) => setTxn({ ...txn, amount: e.target.value })}
              placeholder="0"
            />
          </div>
          {txn.type === 'purchase' && (
            <div>
              <label className="label">Invoice / Bill No.</label>
              <input
                className="input"
                value={txn.invoiceNo}
                onChange={(e) => setTxn({ ...txn, invoiceNo: e.target.value })}
                placeholder="optional"
              />
            </div>
          )}
          <div className={txn.type === 'purchase' ? '' : 'sm:col-span-2'}>
            <label className="label">Description</label>
            <input
              className="input"
              value={txn.description}
              onChange={(e) => setTxn({ ...txn, description: e.target.value })}
              placeholder={txn.type === 'purchase' ? 'e.g. 40 kg beef' : 'e.g. cash payment'}
            />
          </div>
        </div>
        <button
          type="submit"
          className={`btn mt-3 w-full text-white ${
            txn.type === 'purchase' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {txn.type === 'purchase' ? 'Add Purchase' : 'Record Payment'}
        </button>
      </form>

      {/* Ledger */}
      <h4 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-charcoal/60">
        Ledger ({sorted.length})
      </h4>
      {sorted.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-charcoal/50">
          No transactions yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-black/5">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id} className="border-t border-black/5">
                  <td className="whitespace-nowrap px-3 py-2 text-charcoal/60">
                    {formatDateTime(t.date).split(',')[0]}
                  </td>
                  <td className="px-3 py-2">
                    {t.description || (t.type === 'payment' ? 'Payment' : 'Purchase')}
                    {t.invoiceNo && (
                      <span className="ml-1 text-xs text-charcoal/40">#{t.invoiceNo}</span>
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right font-semibold ${
                      t.type === 'payment' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {t.type === 'payment' ? '− ' : '+ '}
                    {rs(t.amount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onRemoveTxn(t)}
                      className="text-charcoal/30 hover:text-red-500"
                      aria-label="Delete entry"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
