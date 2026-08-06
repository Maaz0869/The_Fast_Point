import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'

// ---------------------------------------------------------------------------
// "Create an account" invitation. Renders nothing once the visitor is signed in,
// so the same component can be dropped anywhere without a guard at the call site.
//
//   variant="section" — full-width block for the home page
//   variant="inline"  — one-line strip for the cart / deals pages
//
// The current location travels with the link, so after signing up the customer
// lands back where they were instead of on a dashboard they didn't ask for.
// ---------------------------------------------------------------------------

const PERKS = [
  {
    icon: '🎟️',
    title: 'Your own coupons',
    text: 'We send private discount codes to account holders — nobody else can use them.',
  },
  {
    icon: '⚡',
    title: 'One-tap checkout',
    text: 'Your name, phone and address are filled in for you every time.',
  },
  {
    icon: '🔁',
    title: 'Reorder in seconds',
    text: 'Every past order is saved — repeat a favourite with a single tap.',
  },
]

export default function JoinCta({ variant = 'section' }) {
  const { user, loading } = useAuth()
  const { restaurant } = useStore()
  const location = useLocation()

  // Stay quiet while the session is being restored, so the banner never flashes
  // in front of a customer who is in fact already signed in.
  if (loading || user) return null

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/70 px-5 py-4">
        <span className="text-2xl">🎟️</span>
        <p className="min-w-0 flex-1 text-sm font-medium text-brand-700">
          <b>Create a free account</b> and get your own discount coupons — plus saved details and
          one-tap reordering.
        </p>
        <div className="flex gap-2">
          <Link to="/signup" state={{ from: location }} className="btn-primary px-4 py-2 text-sm">
            Sign Up
          </Link>
          <Link to="/login" state={{ from: location }} className="btn-ghost px-4 py-2 text-sm">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className="section py-14">
      <div className="overflow-hidden rounded-3xl bg-night text-white">
        <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-400">
              Free to join
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              Get your own discount coupons
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Make a {restaurant.name} account in under a minute — just your name, phone, email and a
              password. No card needed, and you can still order as a guest whenever you like.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {PERKS.map((p) => (
                <div key={p.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">
                    {p.icon}
                  </span>
                  <p className="mt-3 font-display font-bold">{p.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sign-up card */}
          <div className="flex flex-col justify-center rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <p className="font-display text-lg font-bold">Ready in 3 steps</p>
            <ol className="mt-4 space-y-3 text-sm text-white/70">
              {['Tap Create Account', 'Enter your name, phone & email', 'Start collecting coupons'].map(
                (step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
            <Link
              to="/signup"
              state={{ from: location }}
              className="btn mt-6 w-full bg-brand-500 text-white hover:bg-brand-600"
            >
              Create Free Account →
            </Link>
            <p className="mt-3 text-center text-xs text-white/50">
              Already have one?{' '}
              <Link
                to="/login"
                state={{ from: location }}
                className="font-bold text-white hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
