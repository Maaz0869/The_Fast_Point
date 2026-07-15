// Currency formatting — everything is shown in PKR (Rs.).
export const rs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`

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

// Whole-number percent saved, e.g. 550 → 440 = 20.
export const discountPercent = (item) =>
  hasDiscount(item) ? Math.round((1 - Number(item.salePrice) / Number(item.price)) * 100) : 0

export const formatDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-PK', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso
  }
}
