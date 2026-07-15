import { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { StatusBadge } from './Dashboard.jsx'
import { rs, formatDateTime } from '../../utils/format.js'

export default function Orders() {
  const { orders, orderStatuses, updateOrderStatus } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (filter === 'all' || o.status === filter) &&
          (typeFilter === 'all' || o.orderType === typeFilter),
      ),
    [orders, filter, typeFilter],
  )

  const changeStatus = (id, status) => {
    updateOrderStatus(id, status)
    toast.success(`Order ${id} → ${status}`)
    setSelected((s) => (s && s.id === id ? { ...s, status } : s))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Orders</h1>
        <p className="text-sm text-charcoal/55">{orders.length} total orders.</p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            All Statuses
          </Chip>
          {orderStatuses.map((s) => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input sm:ml-auto sm:w-48"
        >
          <option value="all">All Types</option>
          <option value="Delivery">Delivery</option>
          <option value="Take Away">Take Away</option>
          <option value="Dine-in">Dine-in</option>
        </select>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(o)}
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      {o.id}
                    </button>
                    <p className="text-xs text-charcoal/45">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer.name}</p>
                    <p className="text-xs text-charcoal/45">{o.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip bg-gray-100 text-charcoal/70">{o.orderType}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{rs(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                        className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-semibold focus:border-brand-400 focus:outline-none"
                      >
                        {orderStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-black/5 md:hidden">
          {filtered.map((o) => (
            <div key={o.id} className="p-4">
              <div className="flex items-start justify-between">
                <button onClick={() => setSelected(o)} className="font-display font-bold text-brand-600">
                  {o.id}
                </button>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-sm">
                {o.customer.name} · {o.orderType}
              </p>
              <p className="text-xs text-charcoal/45">{formatDateTime(o.createdAt)}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-display font-bold">{rs(o.total)}</span>
                <select
                  value={o.status}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-semibold"
                >
                  {orderStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-charcoal/50">No orders match these filters.</p>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <Modal title={`Order ${selected.id}`} onClose={() => setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-sm text-charcoal/50">{formatDateTime(selected.createdAt)}</span>
            </div>

            <div className="grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
              <Detail label="Order Type" value={selected.orderType} />
              <Detail label="Payment" value={selected.payment} />
              <Detail label="Customer" value={selected.customer.name} />
              <Detail label="Phone" value={selected.customer.phone} />
              {selected.customer.address && (
                <div className="sm:col-span-2">
                  <Detail label="Address" value={selected.customer.address} />
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 font-display font-bold">Items</h4>
              <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
                {selected.items.map((it, i) => (
                  <li key={i} className="flex justify-between px-4 py-2.5 text-sm">
                    <span>
                      <b>{it.qty}×</b> {it.name}
                    </span>
                    <span className="font-semibold">{rs(it.lineTotal)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="space-y-1.5 border-t border-dashed border-black/10 pt-3 text-sm">
              <Row label="Subtotal" value={rs(selected.subtotal)} />
              {selected.discount > 0 && (
                <Row label="Discount" value={`- ${rs(selected.discount)}`} />
              )}
              {selected.orderType === 'Delivery' && (
                <Row label="Delivery" value={selected.deliveryFee === 0 ? 'Free' : rs(selected.deliveryFee)} />
              )}
              <div className="flex justify-between pt-1 text-base font-display font-extrabold">
                <dt>Total</dt>
                <dd className="text-brand-600">{rs(selected.total)}</dd>
              </div>
            </dl>

            <div>
              <label className="label">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {orderStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(selected.id, s)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      selected.status === s
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-charcoal/70 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-none whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-brand-500 text-white' : 'bg-white text-charcoal/60 ring-1 ring-black/5 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-charcoal/50">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-charcoal/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
