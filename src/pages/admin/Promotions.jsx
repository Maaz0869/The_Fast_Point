import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { broadcastStatus, sendBroadcast } from '../../lib/broadcast.js'
import CouponFields from '../../components/CouponFields.jsx'
import { rs } from '../../utils/format.js'
import {
  blankCouponForm,
  buildCoupon,
  codeStub,
  expiryText,
  suggestCode,
} from '../../utils/coupons.js'
import { buildWhatsappLink } from '../../utils/whatsapp.js'
import { Check, Whatsapp } from '../../components/Icons.jsx'

// ---------------------------------------------------------------------------
// Send an offer to every customer on WhatsApp.
//
// WhatsApp will not let a website blast messages to arbitrary numbers — that is
// a platform rule, not a limitation here. CallMeBot (used for order alerts) only
// delivers to the shop's *own* number. So this screen does the next best thing:
// it prepares one personalised, ready-to-send WhatsApp chat per customer and
// walks the admin through them one tap at a time, keeping track of who's done.
//
// Copy tools are provided too, for anyone who prefers a WhatsApp broadcast list.
// ---------------------------------------------------------------------------

// Local numbers ("0300 1234567") have to become international ("923001234567")
// before wa.me will accept them. The shop's own number supplies the country code.
export const toWaNumber = (phone, countryCode = '92') => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  const d = digits.startsWith('00') ? digits.slice(2) : digits // 0092… → 92…
  // Already international.
  if (d.startsWith(countryCode) && d.length >= countryCode.length + 9) return d
  // Local form: 0300… → 92300…
  if (d.startsWith('0')) return countryCode + d.slice(1)
  // Bare mobile number with no leading zero.
  if (d.length <= 10) return countryCode + d
  return d
}

const DEFAULT_TEMPLATE = `Hi {name}! 🍔

{offer}

Your code: *{code}*
Valid till: {expiry}

Order here: {link}
— {shop}`

const NO_COUPON_TEMPLATE = `Hi {name}! 🍔

{offer}

Order here: {link}
— {shop}`

export default function Promotions() {
  const {
    customers,
    orders,
    discounts,
    restaurant,
    offerBanner,
    addDiscount,
    addDiscounts,
    isCouponUsable,
  } = useStore()
  const { session } = useAuth()
  const toast = useToast()

  const [offer, setOffer] = useState(offerBanner?.text || '')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [couponMode, setCouponMode] = useState('personal') // personal | existing | none
  const [publicCode, setPublicCode] = useState('')
  const [terms, setTerms] = useState(blankCouponForm)
  const [selected, setSelected] = useState(null) // null = "everyone" until touched
  const [sent, setSent] = useState({}) // recipient key -> true
  const [issued, setIssued] = useState({}) // recipient key -> code we generated

  // Auto-send (WhatsApp Cloud API). Absent unless the server function has a
  // token, so the manual flow stays the default and nothing breaks locally.
  const [auto, setAuto] = useState({ configured: false })
  const [autoMode, setAutoMode] = useState('template')
  const [templateName, setTemplateName] = useState('')
  const [language, setLanguage] = useState('en_US')
  const [blasting, setBlasting] = useState(false)
  const [report, setReport] = useState(null)

  useEffect(() => {
    broadcastStatus().then((s) => {
      setAuto(s)
      if (s.defaultTemplate) setTemplateName(s.defaultTemplate)
      if (s.defaultLanguage) setLanguage(s.defaultLanguage)
    })
  }, [])

  // The shop's own WhatsApp number tells us the country code to assume.
  const countryCode = String(restaurant.whatsapp || '92').replace(/\D/g, '').slice(0, 2) || '92'
  const siteLink = window.location.origin

  // ---- Recipients ---------------------------------------------------------
  // Registered accounts first, then anyone who has ordered as a guest — they are
  // customers too, they just never signed up.
  const recipients = useMemo(() => {
    const list = []
    const seen = new Set()

    for (const c of customers) {
      const wa = toWaNumber(c.phone, countryCode)
      if (!wa) continue
      seen.add(wa)
      list.push({ key: c.id, id: c.id, name: c.name || c.email, phone: c.phone, wa, guest: false })
    }
    for (const o of orders) {
      const wa = toWaNumber(o.customer?.phone, countryCode)
      if (!wa || seen.has(wa)) continue
      seen.add(wa)
      list.push({
        key: `g:${wa}`,
        id: null,
        name: o.customer?.name || 'Guest',
        phone: o.customer?.phone,
        wa,
        guest: true,
      })
    }
    return list
  }, [customers, orders, countryCode])

  // A guest has no account, so there is nothing to tie a private coupon to.
  const eligible = useMemo(
    () => recipients.filter((r) => couponMode !== 'personal' || !r.guest),
    [recipients, couponMode],
  )

  const chosen = useMemo(
    () => (selected === null ? eligible : eligible.filter((r) => selected[r.key])),
    [eligible, selected],
  )

  const publicCodes = discounts.filter((d) => !d.userId && isCouponUsable(d))
  const activeCoupon = publicCodes.find((d) => d.code === publicCode) || null
  const skippedGuests = recipients.length - eligible.length

  const toggle = (key) =>
    setSelected((s) => {
      const base = s || Object.fromEntries(eligible.map((r) => [r.key, true]))
      return { ...base, [key]: !base[key] }
    })
  const selectAll = (on) =>
    setSelected(on ? null : Object.fromEntries(eligible.map((r) => [r.key, false])))

  // ---- Message building ---------------------------------------------------
  // What the message will say. For a personal coupon that hasn't been issued yet
  // this is an illustrative code — deliberately stable, so the preview doesn't
  // reshuffle on every keystroke.
  const codeFor = (r) => {
    if (couponMode === 'none') return ''
    if (couponMode === 'existing') return activeCoupon?.code || ''
    return issued[r.key] || `${codeStub(r)}7K3X`
  }

  // Mints the real coupon. Called only when a recipient is actually messaged, so
  // nobody who never got the message ends up holding a code.
  const issueCodeFor = (r) => {
    if (couponMode !== 'personal') return codeFor(r)
    if (issued[r.key]) return issued[r.key]
    const taken = new Set([
      ...discounts.map((d) => d.code.toUpperCase()),
      ...Object.values(issued),
    ])
    const code = suggestCode(r, taken)
    addDiscount(buildCoupon({ id: r.id, name: r.name }, terms, code))
    setIssued((m) => ({ ...m, [r.key]: code }))
    return code
  }

  const expiryFor = () => {
    if (couponMode === 'existing') return expiryText(activeCoupon?.expiresAt)
    if (couponMode === 'personal') {
      const days = Number(terms.days)
      return days > 0 ? expiryText(new Date(Date.now() + days * 86400000).toISOString()) : 'no expiry'
    }
    return ''
  }

  const render = (r, code) =>
    template
      .replaceAll('{name}', (r.name || 'there').split(' ')[0])
      .replaceAll('{offer}', offer || 'We have a special offer for you today!')
      .replaceAll('{code}', code || '—')
      .replaceAll('{expiry}', expiryFor())
      .replaceAll('{shop}', restaurant.name)
      .replaceAll('{link}', siteLink)

  const insert = (token) => setTemplate((t) => `${t}${t.endsWith(' ') ? '' : ' '}${token}`)

  // ---- Sending ------------------------------------------------------------
  const validate = () => {
    if (!offer.trim() && !template.includes('{code}')) {
      toast.error('Write the offer first')
      return false
    }
    if (couponMode === 'existing' && !activeCoupon) {
      toast.error('Pick a public code to send')
      return false
    }
    if (couponMode === 'personal' && !Number(terms.value)) {
      toast.error('Set the discount value for the personal coupons')
      return false
    }
    return true
  }

  const sendTo = (r) => {
    if (!validate()) return
    const code = issueCodeFor(r)
    // Opened one at a time on purpose: browsers block a loop of window.open, and
    // WhatsApp needs the admin to press send in each chat anyway.
    window.open(buildWhatsappLink(r.wa, render(r, code)), '_blank')
    setSent((s) => ({ ...s, [r.key]: true }))
  }

  // ---- Auto-send: everyone, one click ------------------------------------
  // Personal coupons are minted up front here (as one batch write) because the
  // whole point is that no further taps are needed.
  const blastAll = async () => {
    if (!validate()) return
    if (!chosen.length) {
      toast.error('Nobody selected')
      return
    }
    if (autoMode === 'template' && !templateName.trim()) {
      toast.error('Enter your approved WhatsApp template name')
      return
    }
    if (
      !window.confirm(
        `Send this offer to ${chosen.length} customer${chosen.length > 1 ? 's' : ''} on WhatsApp right now?`,
      )
    )
      return

    setBlasting(true)
    setReport(null)
    try {
      const codes = { ...issued }
      const fresh = []
      if (couponMode === 'personal') {
        const taken = new Set([
          ...discounts.map((d) => d.code.toUpperCase()),
          ...Object.values(codes),
        ])
        for (const r of chosen) {
          if (codes[r.key]) continue
          const code = suggestCode(r, taken)
          taken.add(code)
          codes[r.key] = code
          fresh.push(buildCoupon({ id: r.id, name: r.name }, terms, code))
        }
        if (fresh.length) addDiscounts(fresh)
        setIssued(codes)
      }

      const payload = chosen.map((r) => {
        const code = couponMode === 'personal' ? codes[r.key] : codeFor(r)
        return {
          wa: r.wa,
          // Positional template variables: {{1}} name, {{2}} offer, {{3}} code.
          params: [(r.name || 'there').split(' ')[0], offer, code || '—'],
          text: render(r, code),
        }
      })

      const res = await sendBroadcast(
        { recipients: payload, mode: autoMode, templateName: templateName.trim(), language },
        session?.access_token,
      )
      setReport(res)
      // Mark the ones that actually went through, so a retry only re-sends the
      // failures rather than double-messaging everybody.
      const okNumbers = new Set(res.results.filter((x) => x.ok).map((x) => x.wa))
      setSent((s) => {
        const next = { ...s }
        chosen.forEach((r) => {
          if (okNumbers.has(r.wa)) next[r.key] = true
        })
        return next
      })
      if (res.failed) toast.error(`${res.sent} sent, ${res.failed} failed`)
      else toast.success(`Sent to ${res.sent} customer${res.sent > 1 ? 's' : ''} 🎉`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBlasting(false)
    }
  }

  const pending = chosen.filter((r) => !sent[r.key])
  const sendNext = () => {
    if (!pending.length) {
      toast.info('Everyone on the list has been messaged')
      return
    }
    sendTo(pending[0])
  }

  const copy = (text, label) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error('Could not copy'))
  }

  const preview = chosen[0]
    ? render(chosen[0], codeFor(chosen[0]))
    : 'Add a customer with a phone number to see the preview.'

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Promotions & WhatsApp Blast</h1>
        <p className="text-sm text-charcoal/55">
          Write an offer once, then send it to every customer on WhatsApp — each message
          personalised, with their own coupon code.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* ---------------- Compose ---------------- */}
        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="font-display font-bold">1. The offer</h2>
            <div>
              <label className="label">What are you announcing?</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="e.g. 30% off all pizzas this weekend only!"
              />
              {offerBanner?.text && offer !== offerBanner.text && (
                <button
                  type="button"
                  onClick={() => setOffer(offerBanner.text)}
                  className="mt-1 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Use the site's offer banner text →
                </button>
              )}
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-display font-bold">2. Coupon to include</h2>
            <div className="grid gap-2">
              {[
                {
                  id: 'personal',
                  title: 'A private code for each customer',
                  hint: 'Unique per person and tied to their account — cannot be shared',
                },
                {
                  id: 'existing',
                  title: 'An existing public code',
                  hint: 'Same code for everyone, from Discount Codes',
                },
                { id: 'none', title: 'No coupon', hint: 'Just announce the offer' },
              ].map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => {
                    setCouponMode(o.id)
                    setTemplate(o.id === 'none' ? NO_COUPON_TEMPLATE : DEFAULT_TEMPLATE)
                  }}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                    couponMode === o.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-black/10 hover:border-brand-300'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                      couponMode === o.id
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-black/20'
                    }`}
                  >
                    {couponMode === o.id && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{o.title}</span>
                    <span className="block text-xs text-charcoal/50">{o.hint}</span>
                  </span>
                </button>
              ))}
            </div>

            {couponMode === 'personal' && (
              <div className="space-y-4 rounded-xl bg-black/[0.03] p-4">
                <CouponFields form={terms} setForm={setTerms} />
                <p className="text-xs text-charcoal/50">
                  A code is created only when you actually message that customer.
                </p>
              </div>
            )}

            {couponMode === 'existing' && (
              <div>
                <label className="label">Public code</label>
                <select
                  className="input"
                  value={publicCode}
                  onChange={(e) => setPublicCode(e.target.value)}
                >
                  <option value="">Select a code…</option>
                  {publicCodes.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.type === 'percent' ? `${d.value}%` : rs(d.value)} off
                    </option>
                  ))}
                </select>
                {publicCodes.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No live public codes — create one under Discount Codes first.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-display font-bold">3. Message</h2>
            <textarea
              className="input min-h-[190px] resize-y font-mono text-xs leading-relaxed"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {['{name}', '{offer}', '{code}', '{expiry}', '{shop}', '{link}'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => insert(t)}
                  className="chip bg-black/5 text-charcoal/60 hover:bg-brand-50 hover:text-brand-600"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* WhatsApp-style preview */}
            <div>
              <p className="label">Preview {chosen[0] ? `— to ${chosen[0].name}` : ''}</p>
              <div className="rounded-2xl bg-[#e5ddd5] p-4">
                <pre className="max-w-full whitespace-pre-wrap break-words rounded-xl rounded-tl-none bg-[#dcf8c6] p-3 font-sans text-sm leading-relaxed text-charcoal shadow-sm">
                  {preview}
                </pre>
              </div>
            </div>
          </section>
        </div>

        {/* ---------------- Recipients + send ---------------- */}
        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <section className="card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display font-bold">Recipients</h2>
              <span className="text-sm font-bold text-brand-600">
                {chosen.length} selected
              </span>
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs">
              <button onClick={() => selectAll(true)} className="font-semibold text-brand-600 hover:underline">
                Select all
              </button>
              <button onClick={() => selectAll(false)} className="font-semibold text-charcoal/50 hover:underline">
                Clear
              </button>
            </div>

            {skippedGuests > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                {skippedGuests} guest customer{skippedGuests > 1 ? 's' : ''} hidden — a private
                coupon needs an account. Pick a public code (or no coupon) to include them.
              </p>
            )}

            <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {eligible.length === 0 && (
                <p className="py-6 text-center text-sm text-charcoal/45">
                  No customer phone numbers yet.
                </p>
              )}
              {eligible.map((r) => {
                const on = selected === null || !!selected[r.key]
                return (
                  <div
                    key={r.key}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${
                      sent[r.key] ? 'bg-emerald-50' : 'bg-black/[0.03]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(r.key)}
                      className="h-4 w-4 flex-none accent-brand-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {r.name}
                        {r.guest && (
                          <span className="ml-1.5 chip bg-black/5 text-charcoal/45">Guest</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-charcoal/45">
                        +{r.wa}
                        {issued[r.key] && ` · ${issued[r.key]}`}
                      </p>
                    </div>
                    {sent[r.key] ? (
                      <span className="chip bg-emerald-100 text-emerald-700">Sent</span>
                    ) : (
                      <button
                        onClick={() => sendTo(r)}
                        className="flex-none rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-bold text-white hover:brightness-95"
                      >
                        Send
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ---- One click, everyone at once ---- */}
          <section
            className={`card p-5 ${auto.configured ? 'ring-2 ring-[#25D366]/40' : ''}`}
          >
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold">Send to all at once</h2>
              <span
                className={`chip ${
                  auto.configured
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {auto.configured ? 'Ready' : 'Not set up'}
              </span>
            </div>

            {auto.configured ? (
              <>
                <p className="mt-1 text-xs text-charcoal/50">
                  Delivered by the WhatsApp Cloud API — no tapping, no tabs.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="label">Message type</label>
                    <select
                      className="input"
                      value={autoMode}
                      onChange={(e) => setAutoMode(e.target.value)}
                    >
                      <option value="template">Approved template (works any time)</option>
                      <option value="text">Plain text (only within 24h of their message)</option>
                    </select>
                  </div>

                  {autoMode === 'template' ? (
                    <div className="grid grid-cols-[1fr_110px] gap-2">
                      <div>
                        <label className="label">Template name</label>
                        <input
                          className="input"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="snack_hut_offer"
                        />
                      </div>
                      <div>
                        <label className="label">Language</label>
                        <input
                          className="input"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          placeholder="en_US"
                        />
                      </div>
                      <p className="col-span-2 text-xs text-charcoal/45">
                        Your approved template's body must use{' '}
                        <code className="rounded bg-black/5 px-1">{'{{1}}'}</code> name,{' '}
                        <code className="rounded bg-black/5 px-1">{'{{2}}'}</code> offer,{' '}
                        <code className="rounded bg-black/5 px-1">{'{{3}}'}</code> code — the message
                        box above is used for the manual flow.
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                      WhatsApp only delivers free-form text to people who messaged you in the last
                      24 hours. Good for testing on your own number; use a template for a real
                      campaign.
                    </p>
                  )}

                  <button
                    onClick={blastAll}
                    disabled={blasting || !chosen.length}
                    className="btn w-full bg-[#25D366] text-white hover:brightness-95 disabled:opacity-50"
                  >
                    <Whatsapp className="h-5 w-5" />
                    {blasting
                      ? 'Sending…'
                      : `Send to all ${chosen.length} now`}
                  </button>
                </div>

                {report && (
                  <div className="mt-4 rounded-xl bg-black/[0.03] p-3">
                    <p className="text-sm font-bold">
                      {report.sent} sent
                      {report.failed ? ` · ${report.failed} failed` : ''}
                    </p>
                    {report.failed > 0 && (
                      <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-red-600">
                        {report.results
                          .filter((x) => !x.ok)
                          .map((x) => (
                            <li key={x.wa}>
                              +{x.wa} — {x.error}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2 space-y-2 text-xs leading-relaxed text-charcoal/60">
                <p>
                  One-click sending to everyone needs WhatsApp's official Cloud API. Once set up,
                  this button sends the whole list without any tapping.
                </p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>Create a Meta Business + WhatsApp Business account (free)</li>
                  <li>Add a sender number and get its “Phone number ID”</li>
                  <li>Create a permanent access token</li>
                  <li>
                    Add <code className="rounded bg-black/5 px-1">WHATSAPP_TOKEN</code> and{' '}
                    <code className="rounded bg-black/5 px-1">WHATSAPP_PHONE_ID</code> in Vercel →
                    Environment Variables, then redeploy
                  </li>
                  <li>Get one marketing template approved (usually a few minutes)</li>
                </ol>
                <p className="text-charcoal/45">
                  Meta charges per marketing message. Until then, the one-tap-per-customer flow
                  below works with no setup and no cost.
                </p>
              </div>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-charcoal/60">
                {auto.configured ? 'Manual send (backup)' : 'Progress'}
              </span>
              <span className="font-bold">
                {chosen.length - pending.length} / {chosen.length} sent
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{
                  width: `${chosen.length ? ((chosen.length - pending.length) / chosen.length) * 100 : 0}%`,
                }}
              />
            </div>

            <button
              onClick={sendNext}
              disabled={!pending.length}
              className="btn mt-4 w-full bg-[#25D366] text-white hover:brightness-95 disabled:opacity-50"
            >
              <Whatsapp className="h-5 w-5" />
              {pending.length
                ? `Send to ${pending[0].name.split(' ')[0]} (${pending.length} left)`
                : 'All messaged 🎉'}
            </button>
            <p className="mt-2 text-center text-xs text-charcoal/45">
              Opens each chat with the message ready — press send in WhatsApp, come back, repeat.
            </p>

            {Object.keys(sent).length > 0 && (
              <button
                onClick={() => setSent({})}
                className="mt-3 w-full text-xs font-semibold text-charcoal/45 hover:text-charcoal"
              >
                Reset progress
              </button>
            )}
          </section>

          <section className="card space-y-2 p-5">
            <h2 className="font-display font-bold">Prefer a broadcast list?</h2>
            <p className="text-xs text-charcoal/50">
              Copy the numbers into a WhatsApp broadcast list, then paste the message. Note that
              personal codes can't be used this way — everyone gets the same text.
            </p>
            <button
              onClick={() => copy(chosen.map((r) => `+${r.wa}`).join('\n'), `${chosen.length} numbers`)}
              className="btn-outline w-full py-2 text-sm"
            >
              Copy {chosen.length} phone numbers
            </button>
            <button
              onClick={() =>
                copy(
                  render({ name: 'there', id: null }, couponMode === 'existing' ? activeCoupon?.code : ''),
                  'Message',
                )
              }
              className="btn-dark w-full py-2 text-sm"
            >
              Copy message text
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
