import { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { StatusBadge } from './Dashboard.jsx'
import { rs, formatDateTime } from '../../utils/format.js'
import { printOrderInvoice, printOrdersReport } from '../../utils/invoice.js'
import { filterByPeriod, todayLocal } from '../../utils/period.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const PAYMENTS = ['Cash on Delivery', 'Cash', 'Card', 'Easypaisa / JazzCash']

export default function Orders() {
  const {
    orders,
    orderStatuses,
    updateOrderStatus,
    restaurant,
    menu,
    calcDeliveryFee,
    placeOrder,
    deliveryRules,
  } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [range, setRange] = useState({ from: todayLocal(), to: todayLocal() })

  const downloadReport = (period) => {
    const { items, label } = filterByPeriod(orders, (o) => o.createdAt, period, range)
    if (items.length === 0) {
      toast.error('No orders found for this period')
      return
    }
    printOrdersReport(items, restaurant, label)
  }

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Orders</h1>
          <p className="text-sm text-charcoal/55">{orders.length} total orders.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Create Order
        </button>
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

      {/* Download sales report */}
      <div className="card mb-5 p-4">
        <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-charcoal/60">
          ⬇️ Download Sales Report
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
                    <p className="font-medium">{o.customer?.name || '—'}</p>
                    <p className="text-xs text-charcoal/45">{o.customer?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip bg-gray-100 text-charcoal/70">{o.orderType}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{rs(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => printOrderInvoice(o, restaurant)}
                        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                        title="Download invoice"
                      >
                        🧾 Invoice
                      </button>
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
                {o.customer?.name || '—'} · {o.orderType}
              </p>
              <p className="text-xs text-charcoal/45">{formatDateTime(o.createdAt)}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-display font-bold">{rs(o.total)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printOrderInvoice(o, restaurant)}
                    className="rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                  >
                    🧾 Invoice
                  </button>
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
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-charcoal/50">No orders match these filters.</p>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <Modal
          title={`Order ${selected.id}`}
          onClose={() => setSelected(null)}
          wide
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <button
                onClick={() => printOrderInvoice(selected, restaurant)}
                className="btn-dark"
              >
                ⬇️ Download Invoice
              </button>
              <button onClick={() => setSelected(null)} className="btn-ghost">
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-sm text-charcoal/50">{formatDateTime(selected.createdAt)}</span>
            </div>

            <div className="grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
              <Detail label="Order Type" value={selected.orderType} />
              <Detail label="Payment" value={selected.payment} />
              <Detail label="Customer" value={selected.customer?.name} />
              <Detail label="Phone" value={selected.customer?.phone} />
              {selected.customer?.area && <Detail label="Area" value={selected.customer.area} />}
              {selected.customer?.address && (
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

      {/* Create-order modal */}
      {creating && (
        <NewOrderModal
          menu={menu}
          calcDeliveryFee={calcDeliveryFee}
          distanceMode={deliveryRules.mode === 'distance'}
          zoneMode={deliveryRules.mode === 'zone'}
          areas={deliveryRules.areas || []}
          onClose={() => setCreating(false)}
          onCreate={(payload, opts) => {
            const record = placeOrder(payload)
            toast.success(`Order ${record.id} created`)
            setCreating(false)
            if (opts?.print) printOrderInvoice(record, restaurant)
            setSelected(record)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Manual order builder used by the admin to create walk-in / phone orders.
// ---------------------------------------------------------------------------
function NewOrderModal({ menu, calcDeliveryFee, distanceMode, zoneMode, areas = [], onClose, onCreate }) {
  const toast = useToast()
  const [orderType, setOrderType] = useState('Delivery')
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' })
  const [distanceKm, setDistanceKm] = useState('')
  const [areaId, setAreaId] = useState('')
  const [payment, setPayment] = useState('Cash on Delivery')
  const [items, setItems] = useState([]) // { name, price, qty }
  const [discount, setDiscount] = useState('')
  const [feeOverride, setFeeOverride] = useState('') // blank = auto
  const [pick, setPick] = useState('')

  const selectedArea = areas.find((a) => a.id === areaId) || null
  const subtotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0)
  const autoFee = calcDeliveryFee(subtotal, orderType, distanceKm, areaId)
  const deliveryFee = feeOverride === '' ? autoFee : Number(feeOverride) || 0
  const disc = Number(discount) || 0
  const total = Math.max(0, subtotal - disc + deliveryFee)

  const addFromMenu = () => {
    const item = menu.find((m) => m.id === pick)
    if (!item) return
    setItems((list) => {
      const existing = list.find((x) => x.name === item.name)
      if (existing) {
        return list.map((x) => (x.name === item.name ? { ...x, qty: Number(x.qty) + 1 } : x))
      }
      return [...list, { name: item.name, price: Number(item.price), qty: 1 }]
    })
    setPick('')
  }
  const addCustom = () => setItems((list) => [...list, { name: '', price: '', qty: 1 }])
  const updateItem = (i, patch) =>
    setItems((list) => list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeItem = (i) => setItems((list) => list.filter((_, idx) => idx !== i))

  const submit = (print = false) => {
    if (items.length === 0 || subtotal <= 0) {
      toast.error('Add at least one item')
      return
    }
    if (!customer.name.trim()) {
      toast.error('Customer name is required')
      return
    }
    if (orderType === 'Delivery' && !customer.address.trim()) {
      toast.error('Delivery address is required')
      return
    }
    const cleanItems = items
      .filter((it) => it.name.trim() && Number(it.price) > 0 && Number(it.qty) > 0)
      .map((it) => ({
        name: it.name.trim(),
        qty: Number(it.qty),
        price: Number(it.price),
        lineTotal: Number(it.price) * Number(it.qty),
      }))
    if (cleanItems.length === 0) {
      toast.error('Items need a name, price and quantity')
      return
    }
    onCreate(
      {
        orderType,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          ...(orderType === 'Delivery' && selectedArea ? { area: selectedArea.name } : {}),
          ...(customer.address.trim() ? { address: customer.address.trim() } : {}),
        },
        items: cleanItems,
        subtotal,
        deliveryFee: orderType === 'Delivery' ? deliveryFee : 0,
        ...(orderType === 'Delivery' && distanceMode
          ? { deliveryDistanceKm: Number(distanceKm) || 0 }
          : {}),
        discount: disc,
        total: orderType === 'Delivery' ? total : Math.max(0, subtotal - disc),
        payment,
      },
      { print },
    )
  }

  return (
    <Modal
      title="Create Order"
      onClose={onClose}
      wide
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-lg font-extrabold text-brand-600">{rs(total)}</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button onClick={() => submit(false)} className="btn-dark">
              Create Order
            </button>
            <button onClick={() => submit(true)} className="btn-primary">
              Create &amp; Print Invoice
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Order type */}
        <div>
          <label className="label">Order Type</label>
          <div className="flex flex-wrap gap-2">
            {['Delivery', 'Take Away', 'Dine-in'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  orderType === t ? 'bg-brand-500 text-white' : 'bg-gray-100 text-charcoal/70 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Customer */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Customer Name *</label>
            <input
              className="input"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              placeholder="e.g. Ali Raza"
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="0300 1112223"
            />
          </div>
          {orderType === 'Delivery' && (
            <div className="sm:col-span-2">
              <label className="label">Delivery Address *</label>
              <input
                className="input"
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                placeholder="House, street, area…"
              />
            </div>
          )}
          {orderType === 'Delivery' && zoneMode && areas.length > 0 && (
            <div>
              <label className="label">Delivery Area</label>
              <select className="input" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Select area…</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.charge === 0 ? 'Free' : rs(a.charge)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {orderType === 'Delivery' && distanceMode && (
            <div>
              <label className="label">Distance (km)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="input"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <label className="label">Items</label>
          <div className="flex flex-wrap gap-2">
            <select className="input flex-1" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Add from menu…</option>
              {menu.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {rs(m.price)}
                </option>
              ))}
            </select>
            <button type="button" onClick={addFromMenu} disabled={!pick} className="btn-dark disabled:opacity-40">
              Add
            </button>
            <button type="button" onClick={addCustom} className="btn-ghost">
              + Custom
            </button>
          </div>

          {items.length > 0 && (
            <div className="mt-3 space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={it.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    min="0"
                    className="input w-24"
                    value={it.price}
                    onChange={(e) => updateItem(i, { price: e.target.value })}
                    placeholder="Price"
                  />
                  <input
                    type="number"
                    min="1"
                    className="input w-16"
                    value={it.qty}
                    onChange={(e) => updateItem(i, { qty: e.target.value })}
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                    aria-label="Remove item"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment + adjustments */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Payment</label>
            <select className="input" value={payment} onChange={(e) => setPayment(e.target.value)}>
              {PAYMENTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Discount (Rs.)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
            />
          </div>
          {orderType === 'Delivery' && (
            <div>
              <label className="label">Delivery Fee (Rs.)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={feeOverride}
                onChange={(e) => setFeeOverride(e.target.value)}
                placeholder={`Auto: ${autoFee}`}
              />
            </div>
          )}
        </div>

        {/* Summary */}
        <dl className="space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-charcoal/60">Subtotal</dt>
            <dd className="font-semibold">{rs(subtotal)}</dd>
          </div>
          {disc > 0 && (
            <div className="flex justify-between">
              <dt className="text-charcoal/60">Discount</dt>
              <dd className="font-semibold text-emerald-600">− {rs(disc)}</dd>
            </div>
          )}
          {orderType === 'Delivery' && (
            <div className="flex justify-between">
              <dt className="text-charcoal/60">Delivery Fee</dt>
              <dd className="font-semibold">{deliveryFee === 0 ? 'Free' : rs(deliveryFee)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-dashed border-black/10 pt-2 text-base font-display font-extrabold">
            <dt>Total</dt>
            <dd className="text-brand-600">{rs(total)}</dd>
          </div>
        </dl>
      </div>
    </Modal>
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
