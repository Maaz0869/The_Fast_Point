// ---------------------------------------------------------------------------
// Client side of the automatic order email. All it sends is the order id — the
// /api/order-email function reads the real order from the database, so the
// amounts in the email can never be whatever a browser felt like claiming.
//
// Deliberately fire-and-forget: the order is already safely stored by the time
// this runs, so a mail hiccup (or `npm run dev`, where there is no serverless
// runtime at all) must never show the customer an error.
//
// `keepalive` lets the request finish even if the page navigates away to the
// confirmation screen a moment later.
// ---------------------------------------------------------------------------

export function emailOrderToShop(orderId) {
  if (!orderId) return Promise.resolve()
  return fetch('/api/order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
    keepalive: true,
  }).catch(() => {})
}
