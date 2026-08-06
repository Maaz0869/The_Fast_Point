// ---------------------------------------------------------------------------
// Client side of the WhatsApp auto-send. All it does is talk to our own
// /api/whatsapp-broadcast function — the Cloud API token stays on the server.
//
// On a plain `npm run dev` there is no serverless runtime, so `status()` simply
// reports "not configured" and the admin panel falls back to the manual
// one-tap-per-customer flow. Nothing breaks locally.
// ---------------------------------------------------------------------------

const ENDPOINT = '/api/whatsapp-broadcast'

export async function broadcastStatus() {
  try {
    const res = await fetch(ENDPOINT)
    if (!res.ok) return { configured: false }
    const data = await res.json()
    return { configured: !!data.configured, ...data }
  } catch {
    return { configured: false }
  }
}

// `recipients`: [{ wa, params:[name, offer, code], text }]
// `mode`: 'template' (works any time, needs an approved template) | 'text'
export async function sendBroadcast({ recipients, mode, templateName, language }, accessToken) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ recipients, mode, templateName, language }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Send failed (HTTP ${res.status})`)
  return data
}
