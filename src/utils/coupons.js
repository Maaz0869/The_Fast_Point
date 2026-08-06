import { rs } from './format.js'

// ---------------------------------------------------------------------------
// Building personal coupons. Shared by the Customers screen (one customer, or
// one code each for everyone) and by Promotions (a code attached to a WhatsApp
// broadcast), so a coupon means the same thing wherever it was created.
// ---------------------------------------------------------------------------

// The readable half of a coupon code: the customer's first name, cleaned up.
export const codeStub = (customer) =>
  (customer.name || customer.email || 'VIP')
    .split(/[\s@.]+/)[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8) || 'VIP'

// A code that's easy to read out over the phone: first name + a short random
// tail, so two customers can never collide on the same coupon.
export const suggestCode = (customer, taken) => {
  const stub = codeStub(customer)
  for (let i = 0; i < 50; i++) {
    const code = `${stub}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    if (!taken.has(code)) return code
  }
  return `${stub}${Date.now().toString(36).toUpperCase()}`
}

// Turns the shared terms form into a coupon record owned by one customer.
// `form` = { type, value, minOrder, days, maxUses }
export const buildCoupon = (customer, form, code) => {
  const value = Number(form.value)
  const days = Number(form.days)
  const minOrder = form.minOrder ? Number(form.minOrder) : undefined
  const off = form.type === 'percent' ? `${value}% off` : `${rs(value)} off`
  return {
    code,
    type: form.type,
    value,
    userId: customer.id,
    ...(minOrder ? { minOrder } : {}),
    expiresAt: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null,
    maxUses: Number(form.maxUses) > 0 ? Number(form.maxUses) : null,
    description: `${off}${minOrder ? ` on orders over ${rs(minOrder)}` : ''} — just for ${
      (customer.name || customer.email || 'you').split(' ')[0]
    }`,
  }
}

// Human-readable expiry for a coupon, used in broadcast messages.
export const expiryText = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'no expiry'

export const blankCouponForm = {
  type: 'percent',
  value: '',
  minOrder: '',
  days: '30',
  maxUses: '1',
}
