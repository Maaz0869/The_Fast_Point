import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext.jsx'
import { rs } from '../../utils/format.js'

const expiryLabel = (iso) => {
  if (!iso) return null
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `${days} days left`
}

export default function MyCoupons() {
  const { discounts, myCoupons, isCouponUsable } = useStore()
  const publicCodes = discounts.filter((d) => !d.userId && isCouponUsable(d))

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-lg font-bold">Just for you</h2>
        <p className="mb-4 text-sm text-charcoal/55">
          Private coupons the shop has issued to your account.
        </p>
        {myCoupons.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-4xl">🎟️</p>
            <p className="mt-3 text-sm text-charcoal/55">
              No personal coupons yet — keep ordering and we'll send some your way.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myCoupons.map((c) => (
              <Coupon key={c.code} coupon={c} usable={isCouponUsable(c)} personal />
            ))}
          </div>
        )}
      </section>

      {publicCodes.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold">Everyone's offers</h2>
          <p className="mb-4 text-sm text-charcoal/55">Open promo codes anyone can use.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {publicCodes.map((c) => (
              <Coupon key={c.code} coupon={c} usable />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Coupon({ coupon, usable, personal = false }) {
  const expiry = expiryLabel(coupon.expiresAt)
  const usesLeft = coupon.maxUses != null ? Math.max(0, coupon.maxUses - coupon.usedCount) : null

  const copy = () => {
    navigator.clipboard?.writeText(coupon.code).catch(() => {})
  }

  return (
    <div
      className={`card relative overflow-hidden p-5 ${usable ? '' : 'opacity-55 saturate-0'}`}
    >
      {personal && (
        <span className="absolute right-4 top-4 chip bg-brand-50 text-brand-600">Yours</span>
      )}
      <p className="font-display text-2xl font-extrabold tracking-wide text-brand-600">
        {coupon.type === 'percent' ? `${coupon.value}% OFF` : `${rs(coupon.value)} OFF`}
      </p>
      <p className="mt-1 text-sm text-charcoal/60">{coupon.description}</p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/60 px-3 py-2">
        <code className="flex-1 font-display text-base font-bold tracking-widest">
          {coupon.code}
        </code>
        <button
          onClick={copy}
          className="text-xs font-bold uppercase tracking-wide text-brand-600 hover:underline"
        >
          Copy
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-charcoal/50">
        {coupon.minOrder ? <span>Min. order {rs(coupon.minOrder)}</span> : null}
        {expiry && (
          <span className={expiry === 'Expired' ? 'font-semibold text-red-500' : ''}>{expiry}</span>
        )}
        {usesLeft != null && (
          <span className={usesLeft === 0 ? 'font-semibold text-red-500' : ''}>
            {usesLeft === 0 ? 'Already used' : `${usesLeft} use${usesLeft > 1 ? 's' : ''} left`}
          </span>
        )}
      </div>

      {usable && (
        <Link to="/menu" className="btn-primary mt-4 w-full py-2 text-sm">
          Use it — Order Now
        </Link>
      )}
    </div>
  )
}
