// ---------------------------------------------------------------------------
// Shareable promo links.
//
// A WhatsApp blast is only half the job: the customer still has to find the
// thing you told them about. These helpers turn an offer into a link that lands
// them exactly where the deal is, with the coupon already in their pocket.
//
//   deal + code  →  /deals?deal=<id>&code=<CODE>
//   code only    →  /menu?code=<CODE>
//   neither      →  the homepage
//
// The code rides along in the URL, but a customer browses for a while before
// reaching checkout — and the query string is long gone by then. So whichever
// page they land on stashes the code in sessionStorage, and checkout picks it
// up from there. sessionStorage (not local) on purpose: the offer belongs to
// this visit, not to the browser forever.
// ---------------------------------------------------------------------------

const PROMO_KEY = 'snackhut_promo_code'

export function buildPromoLink(origin, { deal, code } = {}) {
  const base = String(origin || '').replace(/\/+$/, '')
  const params = new URLSearchParams()

  if (deal?.id) params.set('deal', deal.id)
  if (code) params.set('code', code)

  const path = deal?.id ? '/deals' : code ? '/menu' : '/'
  const qs = params.toString()
  return qs ? `${base}${path}?${qs}` : base || '/'
}

// Remembers a code that arrived on the URL so checkout can still find it.
export function rememberPromoCode(code) {
  if (!code) return
  try {
    sessionStorage.setItem(PROMO_KEY, String(code).trim().toUpperCase())
  } catch {
    // Private mode / storage disabled — the code just won't survive the trip.
  }
}

export function readPromoCode() {
  try {
    return sessionStorage.getItem(PROMO_KEY) || ''
  } catch {
    return ''
  }
}

// Cleared once it has been applied (or once an order is placed), so a stale
// code can't quietly reattach itself to the customer's next order.
export function clearPromoCode() {
  try {
    sessionStorage.removeItem(PROMO_KEY)
  } catch {
    /* nothing to clean up */
  }
}
