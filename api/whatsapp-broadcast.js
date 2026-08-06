// ---------------------------------------------------------------------------
// One-tap WhatsApp broadcast, via the official WhatsApp Business Cloud API.
//
// This runs on the server (Vercel Function) for two reasons that both matter:
//   1. The Cloud API access token must never reach the browser — anyone with it
//      could send messages as the shop, so it lives only in an env var here.
//   2. Meta's Graph API does not allow browser (CORS) calls anyway.
//
// Env vars (Vercel → Settings → Environment Variables):
//   WHATSAPP_TOKEN      — permanent access token of the WhatsApp system user
//   WHATSAPP_PHONE_ID   — "Phone number ID" of the sending number
//   WHATSAPP_TEMPLATE   — (optional) default approved template name
//   WHATSAPP_LANGUAGE   — (optional) template language, default en_US
//
// Only a signed-in admin may call it: the caller's Supabase access token is
// checked against the same `is_admin()` function every admin RLS policy uses, so
// there is no second source of truth for who counts as the shop owner.
// ---------------------------------------------------------------------------

const GRAPH_VERSION = 'v21.0'

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://xrqhfwfukkpcmhmjjzxp.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycWhmd2Z1a2twY21obWpqenhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODY0MzAsImV4cCI6MjA5OTk2MjQzMH0.PVMElJxH1wbvx84alE2_Dpz1wgJOegRBlOaNupR_b2o'

const MAX_RECIPIENTS = 500
const GAP_MS = 200 // gentle pacing so a big list can't trip Meta's rate limits

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const configured = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)

// Verifies the caller is the shop owner, using their own Supabase session.
async function isAdmin(authHeader) {
  const token = /^Bearer (.+)$/i.exec(authHeader || '')?.[1]
  if (!token) return false
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    return r.ok && (await r.json()) === true
  } catch {
    return false
  }
}

// A template message can be sent at any time; a plain text message only reaches
// someone who has messaged the shop in the last 24 hours (Meta's rule).
function buildPayload(recipient, body) {
  if (body.mode === 'text') {
    return {
      messaging_product: 'whatsapp',
      to: recipient.wa,
      type: 'text',
      text: { body: recipient.text || '', preview_url: true },
    }
  }
  return {
    messaging_product: 'whatsapp',
    to: recipient.wa,
    type: 'template',
    template: {
      name: body.templateName,
      language: { code: body.language || process.env.WHATSAPP_LANGUAGE || 'en_US' },
      components: [
        {
          type: 'body',
          // Positional: the approved template must use {{1}} name, {{2}} offer,
          // {{3}} coupon code — documented in the README.
          parameters: (recipient.params || []).map((text) => ({
            type: 'text',
            text: String(text ?? '').slice(0, 1024) || '-',
          })),
        },
      ],
    },
  }
}

async function sendOne(recipient, body) {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(recipient, body)),
    },
  )
  const out = await res.json().catch(() => ({}))
  if (res.ok) return { wa: recipient.wa, ok: true, id: out.messages?.[0]?.id || null }
  return {
    wa: recipient.wa,
    ok: false,
    // Meta's `details` is the part that actually says what went wrong.
    error: out.error?.error_data?.details || out.error?.message || `HTTP ${res.status}`,
  }
}

export default async function handler(req, res) {
  // Lets the admin panel show the right UI without exposing anything secret.
  if (req.method === 'GET') {
    return res.status(200).json({
      configured: configured(),
      defaultTemplate: process.env.WHATSAPP_TEMPLATE || '',
      defaultLanguage: process.env.WHATSAPP_LANGUAGE || 'en_US',
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!configured()) {
    return res.status(503).json({
      error:
        'WhatsApp auto-send is not configured. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID, then redeploy.',
    })
  }

  if (!(await isAdmin(req.headers.authorization))) {
    return res.status(403).json({ error: 'Admin sign-in required.' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const recipients = Array.isArray(body.recipients) ? body.recipients : []

  if (!recipients.length) return res.status(400).json({ error: 'No recipients.' })
  if (recipients.length > MAX_RECIPIENTS) {
    return res.status(400).json({ error: `Too many recipients (max ${MAX_RECIPIENTS} per send).` })
  }
  if (body.mode !== 'text' && !body.templateName) {
    return res.status(400).json({ error: 'A template name is required for template messages.' })
  }

  const results = []
  for (const r of recipients) {
    if (!r?.wa) {
      results.push({ wa: r?.wa || '', ok: false, error: 'Missing phone number' })
      continue
    }
    try {
      results.push(await sendOne(r, body))
    } catch (e) {
      results.push({ wa: r.wa, ok: false, error: e.message || 'Request failed' })
    }
    if (recipients.length > 1) await sleep(GAP_MS)
  }

  const sent = results.filter((r) => r.ok).length
  return res.status(200).json({ sent, failed: results.length - sent, results })
}
