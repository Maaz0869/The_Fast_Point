// ---------------------------------------------------------------------------
// Emails a new order to the shop, automatically.
//
// Runs on the server (Vercel Function) so the mail provider's API key never
// reaches the browser, and so the order can be read back from the database with
// the service role — the caller only ever sends an order *id*, never the amounts
// (a browser could lie about those; the database cannot).
//
// Two ways in, and both are safe to have enabled at once:
//   1. The checkout page fires `{ orderId }` the moment an order is stored.
//   2. A Supabase Database Webhook posts `{ record: { id } }` on INSERT — see
//      supabase/order-email.sql. Survives the customer closing the tab.
//
// Double-sending is prevented in the database, not in code: `emailed_at` is
// claimed with a conditional UPDATE ... WHERE emailed_at IS NULL, so exactly one
// caller can ever win the race, no matter how many fire at once.
//
// Env vars (Vercel → Settings → Environment Variables):
//   RESEND_API_KEY             — from resend.com (free tier is plenty)
//   ORDER_EMAIL_TO             — where orders land (default below)
//   ORDER_EMAIL_FROM           — sender (default Resend's shared test sender)
//   ORDER_EMAIL_SECRET         — optional shared secret for the DB webhook
//   SUPABASE_SERVICE_ROLE_KEY  — required: lets this function read orders
//
// With no RESEND_API_KEY the endpoint stays quiet and reports `skipped` — the
// site keeps working exactly as before, nothing breaks.
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://xrqhfwfukkpcmhmjjzxp.supabase.co'

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const MAIL_TO = process.env.ORDER_EMAIL_TO || 'thesnackhut001@gmail.com'
const MAIL_FROM = process.env.ORDER_EMAIL_FROM || 'The Snack Hut <onboarding@resend.dev>'
const SHOP_NAME = process.env.ORDER_EMAIL_SHOP || 'The Snack Hut'

// An order id posted from the browser is unauthenticated, so only genuinely
// fresh orders are accepted. Nobody can walk the table and re-mail old ones.
const MAX_AGE_MS = 30 * 60 * 1000

const configured = () => !!(process.env.RESEND_API_KEY && SERVICE_KEY)

const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const when = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-PK', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso || ''
  }
}

// Claims the order for emailing. Returns the row on success, or null when the
// order doesn't exist, is too old, or somebody already emailed it.
async function claimOrder(orderId) {
  const url =
    `${SUPABASE_URL}/rest/v1/orders` +
    `?id=eq.${encodeURIComponent(orderId)}&emailed_at=is.null&select=*`

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ emailed_at: new Date().toISOString() }),
  })

  if (!res.ok) throw new Error(`Could not read the order (HTTP ${res.status})`)
  const rows = await res.json()
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return null

  if (Date.now() - new Date(row.created_at).getTime() > MAX_AGE_MS) return null
  return row
}

// Puts `emailed_at` back if the mail failed, so the next attempt can retry
// instead of the order being silently marked as sent forever.
async function releaseOrder(orderId) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailed_at: null }),
    })
  } catch {
    /* best effort — the send error is what matters to the caller */
  }
}

function renderEmail(o) {
  const c = o.customer || {}
  const items = Array.isArray(o.items) ? o.items : []
  const delivery = o.order_type === 'Delivery'

  const rows = items
    .map((it) => {
      const extras = Array.isArray(it.extras) && it.extras.length
        ? `<div style="color:#888;font-size:12px">+ ${esc(it.extras.map((e) => e.name || e).join(', '))}</div>`
        : ''
      const spice = it.spiceLabel
        ? `<div style="color:#888;font-size:12px">${esc(it.spiceLabel)}</div>`
        : ''
      return `<tr>
        <td style="padding:9px 10px;border-bottom:1px solid #eee;font-size:14px">
          ${esc(it.name)}${extras}${spice}
        </td>
        <td style="padding:9px 10px;border-bottom:1px solid #eee;text-align:center;font-size:14px">${Number(it.qty) || 1}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #eee;text-align:right;font-size:14px">${money(it.lineTotal)}</td>
      </tr>`
    })
    .join('')

  const line = (label, value, strong) => `
    <tr>
      <td style="padding:4px 0;font-size:${strong ? '17px' : '14px'};${strong ? 'font-weight:800;border-top:2px solid #1f2430;padding-top:10px' : 'color:#555'}">${label}</td>
      <td style="padding:4px 0;text-align:right;font-size:${strong ? '17px' : '14px'};${strong ? 'font-weight:800;color:#e8622a;border-top:2px solid #1f2430;padding-top:10px' : ''}">${value}</td>
    </tr>`

  const html = `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#1f2430;max-width:640px;margin:0 auto;padding:24px">
  <div style="border-bottom:3px solid #e8622a;padding-bottom:14px">
    <h1 style="margin:0;font-size:20px;color:#e8622a">${esc(SHOP_NAME)}</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#555">New order received</p>
  </div>

  <div style="margin:20px 0;padding:14px 16px;background:#fdece4;border-radius:12px">
    <div style="font-size:22px;font-weight:800">#${esc(o.id)}</div>
    <div style="font-size:13px;color:#555;margin-top:2px">${when(o.created_at)}</div>
    <div style="font-size:13px;color:#555;margin-top:6px">
      <b>${esc(o.order_type)}</b> &middot; ${esc(o.payment)} &middot; ${esc(o.status)}
    </div>
  </div>

  <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 6px">Customer</h2>
  <p style="margin:0 0 20px;font-size:14px;line-height:1.6">
    <b style="font-size:16px">${esc(c.name) || 'Walk-in Customer'}</b><br />
    ${c.phone ? `📞 <a href="tel:${esc(c.phone)}" style="color:#1f2430">${esc(c.phone)}</a><br />` : ''}
    ${c.area ? `📍 ${esc(c.area)}<br />` : ''}
    ${delivery && c.address ? `🏠 ${esc(c.address)}` : ''}
  </p>

  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#1f2430;color:#fff">
        <th style="padding:9px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Item</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Qty</th>
        <th style="padding:9px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Total</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#888">No items</td></tr>'}</tbody>
  </table>

  <table style="width:280px;margin:18px 0 0 auto;border-collapse:collapse">
    ${line('Subtotal', money(o.subtotal))}
    ${Number(o.discount) > 0 ? line('Discount', `− ${money(o.discount)}`) : ''}
    ${delivery ? line('Delivery Fee', Number(o.delivery_fee) === 0 ? 'Free' : money(o.delivery_fee)) : ''}
    ${line('Grand Total', money(o.total), true)}
  </table>

  <p style="margin-top:30px;font-size:11px;color:#999;text-align:center">
    Sent automatically by ${esc(SHOP_NAME)} when the order was placed.
  </p>
</div>`

  // A plain-text part matters here: phone notifications preview it, so the shop
  // sees the customer and the total without opening the mail.
  const text = [
    `New order #${o.id} — ${money(o.total)}`,
    `${o.order_type} · ${o.payment}`,
    `${c.name || 'Walk-in Customer'}${c.phone ? ` · ${c.phone}` : ''}`,
    delivery && c.address ? c.address : '',
    '',
    ...items.map((it) => `${it.qty || 1} × ${it.name} — ${money(it.lineTotal)}`),
  ]
    .filter(Boolean)
    .join('\n')

  const subject = `🍔 New order #${o.id} — ${money(o.total)} (${o.order_type})`
  return { subject, html, text }
}

async function sendEmail(mail, replyTo) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: MAIL_TO.split(',').map((s) => s.trim()).filter(Boolean),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  const out = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(out.message || out.error?.message || `HTTP ${res.status}`)
  return out.id || null
}

export default async function handler(req, res) {
  // Lets anything ask whether order emails are switched on, without leaking keys.
  if (req.method === 'GET') {
    return res.status(200).json({ configured: configured(), to: configured() ? MAIL_TO : null })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!configured()) {
    // Not an error: the shop simply hasn't turned this on. The checkout page
    // fires and forgets, and must never show the customer a failure for it.
    return res.status(200).json({ skipped: 'Order emails are not configured' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

  // The Supabase webhook can prove who it is; the browser cannot. When a secret
  // is set, webhook calls must carry it — browser calls are unaffected.
  const secret = process.env.ORDER_EMAIL_SECRET
  const isWebhook = !!body.record
  if (isWebhook && secret && req.headers['x-order-email-secret'] !== secret) {
    return res.status(403).json({ error: 'Bad webhook secret' })
  }

  const orderId = body.orderId || body.record?.id
  if (!orderId) return res.status(400).json({ error: 'orderId is required' })

  let order
  try {
    order = await claimOrder(orderId)
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }

  // Already emailed, too old, or no such order — all "nothing to do", not errors.
  if (!order) return res.status(200).json({ skipped: 'Already sent or not eligible' })

  try {
    const id = await sendEmail(renderEmail(order), order.customer?.email || null)
    return res.status(200).json({ sent: true, id })
  } catch (e) {
    await releaseOrder(orderId)
    return res.status(502).json({ error: e.message })
  }
}
