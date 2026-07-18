// Currency formatting — everything is shown in PKR (Rs.).
// Non-numeric / NaN / undefined all fall back to 0 so we never render "Rs. NaN".
export const rs = (n) => {
  const v = Number(n)
  return `Rs. ${(Number.isFinite(v) ? v : 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

// ---- Discount / sale-price helpers -----------------------------------------
// A menu item may carry an optional `salePrice`. A discount is "active" only
// when salePrice is a positive number below the regular price.
export const hasDiscount = (item) =>
  !!item &&
  item.salePrice != null &&
  Number(item.salePrice) > 0 &&
  Number(item.salePrice) < Number(item.price)

// The price the customer actually pays (sale price when discounted).
export const effectivePrice = (item) =>
  hasDiscount(item) ? Number(item.salePrice) : Number(item.price)

// ---- Size variants (e.g. pizza Small / Large / Extra Large) ----------------
export const hasSizes = (item) => Array.isArray(item?.sizes) && item.sizes.length > 0

// Cheapest size price — used to show "From Rs. X" on cards.
export const startingPrice = (item) =>
  hasSizes(item)
    ? Math.min(...item.sizes.map((s) => Number(s.price) || 0))
    : effectivePrice(item)

// Whole-number percent saved, e.g. 550 → 440 = 20.
export const discountPercent = (item) =>
  hasDiscount(item) ? Math.round((1 - Number(item.salePrice) / Number(item.price)) * 100) : 0

export const formatDateTime = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
