import { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import CouponFields from '../../components/CouponFields.jsx'
import { rs, formatDateTime } from '../../utils/format.js'
import { blankCouponForm, buildCoupon, suggestCode } from '../../utils/coupons.js'
import { Plus, Search, Trash } from '../../components/Icons.jsx'

const blankCoupon = { ...blankCouponForm, code: '' }

export default function Customers() {
  const {
    customers,
    orders,
    discounts,
    addDiscount,
    addDiscounts,
    deleteDiscount,
    isCouponUsable: usable,
  } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [giving, setGiving] = useState(null) // the customer we're issuing a coupon to
  const [bulk, setBulk] = useState(false) // one coupon each, for everyone
  const [onlyWithout, setOnlyWithout] = useState(true)
  const [form, setForm] = useState(blankCoupon)

  // Order stats per account, plus the guest total, in a single pass.
  const { rows, guest } = useMemo(() => {
    const byUser = new Map()
    let guestCount = 0
    let guestSpend = 0
    for (const o of orders) {
      if (!o.userId) {
        guestCount++
        guestSpend += Number(o.total || 0)
        continue
      }
      const acc = byUser.get(o.userId) || { count: 0, spent: 0, last: null }
      acc.count++
      acc.spent += Number(o.total || 0)
      if (!acc.last || new Date(o.createdAt) > new Date(acc.last)) acc.last = o.createdAt
      byUser.set(o.userId, acc)
    }
    const list = customers.map((c) => ({
      ...c,
      ...(byUser.get(c.id) || { count: 0, spent: 0, last: null }),
      coupons: discounts.filter((d) => d.userId === c.id),
    }))
    list.sort((a, b) => b.spent - a.spent || (a.name || '').localeCompare(b.name || ''))
    return { rows: list, guest: { count: guestCount, spent: guestSpend } }
  }, [customers, orders, discounts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.address].some((v) => String(v || '').toLowerCase().includes(q)),
    )
  }, [rows, query])

  const openGive = (customer) => {
    setForm({ ...blankCoupon, code: suggestCode(customer, new Set(discounts.map((d) => d.code))) })
    setGiving(customer)
  }

  const openBulk = () => {
    setForm({ ...blankCoupon, code: '' })
    setBulk(true)
  }

  // Customers the bulk action will actually reach, given the "skip anyone who
  // already has one" switch. Shown live on the button so the count is never a
  // surprise.
  const bulkTargets = rows.filter((c) => !onlyWithout || !c.coupons.some(usable))
  const withCoupon = rows.filter((c) => c.coupons.some(usable)).length

  const validForm = () => {
    const value = Number(form.value)
    if (!value) {
      toast.error('Discount value is required')
      return false
    }
    if (form.type === 'percent' && value > 100) {
      toast.error('A percentage discount cannot be over 100%')
      return false
    }
    return true
  }

  const issue = (e) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (!code) {
      toast.error('Code is required')
      return
    }
    if (discounts.some((d) => d.code.toUpperCase() === code)) {
      toast.error('That code already exists')
      return
    }
    if (!validForm()) return

    addDiscount(buildCoupon(giving, form, code))
    toast.success(`Coupon ${code} issued to ${giving.name || giving.email}`)
    setGiving(null)
  }

  // One coupon per customer, each with its own code — so a code shared with a
  // friend is useless to them: the database ties it to a single account.
  const issueToAll = (e) => {
    e.preventDefault()
    if (!validForm()) return
    if (!bulkTargets.length) {
      toast.error('Nobody to give a coupon to')
      return
    }
    const taken = new Set(discounts.map((d) => d.code.toUpperCase()))
    const batch = bulkTargets.map((c) => {
      const code = suggestCode(c, taken)
      taken.add(code)
      return buildCoupon(c, form, code)
    })
    addDiscounts(batch)
    toast.success(`${batch.length} personal coupon${batch.length > 1 ? 's' : ''} issued`)
    setBulk(false)
  }

  const revoke = (code) => {
    if (!window.confirm(`Remove coupon "${code}"?`)) return
    deleteDiscount(code)
    toast.success('Coupon removed')
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Customers</h1>
          <p className="text-sm text-charcoal/55">
            Everyone with an account — and the personal coupons you've given them.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
            <input
              className="input w-56 pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone…"
            />
          </div>
          {customers.length > 0 && (
            <button onClick={openBulk} className="btn-dark px-4 py-2.5 text-sm">
              🎁 Coupon for Everyone
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered customers" value={customers.length} icon="👥" />
        <Stat
          label="Repeat customers"
          value={rows.filter((r) => r.count > 1).length}
          icon="🔁"
        />
        <Stat
          label="Have a live coupon"
          value={withCoupon}
          icon="🎟️"
          hint={
            customers.length
              ? `${customers.length - withCoupon} without one`
              : undefined
          }
        />
        <Stat
          label="Guest orders"
          value={guest.count}
          icon="🕵️"
          hint={guest.count ? rs(guest.spent) : 'None'}
        />
      </div>

      {customers.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl">👥</p>
          <p className="mt-3 font-display font-bold">No customer accounts yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/55">
            Customers can sign up from the website. If nobody can, run
            <code className="mx-1 rounded bg-black/5 px-1">supabase/user-accounts.sql</code>
            and switch on <b>Allow new users to sign up</b> in the Supabase dashboard
            (Authentication → Sign In / Providers → Email).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="card p-10 text-center text-sm text-charcoal/50">
              No customer matches "{query}".
            </p>
          )}
          {filtered.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 font-display font-extrabold text-brand-600">
                  {(c.name || c.email || '?').trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold">{c.name || '(no name)'}</p>
                  <p className="truncate text-xs text-charcoal/55">{c.email}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-charcoal/50">
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.address && <span className="truncate">📍 {c.address}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <Mini label="Orders" value={c.count} />
                  <Mini label="Spent" value={rs(c.spent)} />
                  <Mini label="Last order" value={c.last ? formatDateTime(c.last) : '—'} />
                </div>
                <button onClick={() => openGive(c)} className="btn-primary px-4 py-2 text-sm">
                  <Plus className="h-4 w-4" /> Give Coupon
                </button>
              </div>

              {c.coupons.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
                  {c.coupons.map((d) => {
                    const expired = d.expiresAt && new Date(d.expiresAt) < new Date()
                    const spent = d.maxUses != null && d.usedCount >= d.maxUses
                    return (
                      <span
                        key={d.code}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                          expired || spent
                            ? 'bg-black/5 text-charcoal/40 ring-black/10'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        }`}
                      >
                        🎟️ {d.code} ·{' '}
                        {d.type === 'percent' ? `${d.value}%` : rs(d.value)}
                        {expired && ' · expired'}
                        {!expired && spent && ' · used'}
                        <button
                          onClick={() => revoke(d.code)}
                          className="text-red-400 hover:text-red-600"
                          aria-label={`Remove ${d.code}`}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* One customer */}
      {giving && (
        <Modal title={`Coupon for ${giving.name || giving.email}`} onClose={() => setGiving(null)}>
          <form onSubmit={issue} className="space-y-4">
            <div>
              <label className="label">Code</label>
              <input
                className="input uppercase tracking-wider"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <p className="mt-1 text-xs text-charcoal/45">
                Only {giving.name || 'this customer'} can see or use this code.
              </p>
            </div>

            <CouponFields form={form} setForm={setForm} />

            <button type="submit" className="btn-primary w-full">
              <Plus className="h-4 w-4" /> Issue Coupon
            </button>
          </form>
        </Modal>
      )}

      {/* Everyone, one unique code each */}
      {bulk && (
        <Modal title="A coupon for every customer" onClose={() => setBulk(false)}>
          <form onSubmit={issueToAll} className="space-y-4">
            <p className="rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-700">
              Each customer gets their <b>own unique code</b> (e.g. <code>ALI7K3X</code>) tied to
              their account — so a code passed to a friend simply won't work for them. Same terms
              for everyone; set them below.
            </p>

            <CouponFields form={form} setForm={setForm} />

            <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-black/[0.03] p-3 text-sm font-medium text-charcoal/70">
              <input
                type="checkbox"
                checked={onlyWithout}
                onChange={(e) => setOnlyWithout(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span>
                Skip customers who already have a live coupon
                <span className="mt-0.5 block text-xs font-normal text-charcoal/45">
                  {withCoupon} of {customers.length} already have one
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={!bulkTargets.length}
              className="btn-primary w-full"
            >
              <Plus className="h-4 w-4" />
              {bulkTargets.length
                ? `Issue to ${bulkTargets.length} customer${bulkTargets.length > 1 ? 's' : ''}`
                : 'Nobody to issue to'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Stat({ label, value, icon, hint }) {
  return (
    <div className="card p-5">
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">{label}</p>
      {hint && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-charcoal/40">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  )
}
