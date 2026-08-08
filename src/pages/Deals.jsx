import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import DealCard from '../components/DealCard.jsx'
import JoinCta from '../components/JoinCta.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { useStore } from '../context/StoreContext.jsx'

export default function Deals() {
  const { deals, offerBanner } = useStore()
  const [searchParams] = useSearchParams()

  // A shared promo link (?deal=…) points at one specific deal. Float it to the
  // top and ring it, so the customer sees the thing they were messaged about
  // instead of having to hunt for it in the grid.
  const sharedId = searchParams.get('deal') || ''
  const shared = deals.find((d) => String(d.id) === sharedId) || null
  const sharedRef = useRef(null)

  const ordered = useMemo(
    () => (shared ? [shared, ...deals.filter((d) => d !== shared)] : deals),
    [deals, shared],
  )

  // Deals arrive asynchronously, so scroll once the card is actually mounted.
  useEffect(() => {
    if (!shared || !sharedRef.current) return
    sharedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [shared])

  return (
    <div className="section py-10">
      {/* Offer hero banner */}
      {offerBanner.active && (
        <div className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-crimson-600 via-brand-600 to-brand-500 px-8 py-10 text-center text-white shadow-card">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-white/80">
            Limited Time
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{offerBanner.text}</h1>
        </div>
      )}

      <SectionHeading
        eyebrow="Deals & Combos"
        title="More Food, Less Money"
        subtitle="Bundled up and marked down — the tastiest way to save."
      />

      <div className="mt-8">
        <JoinCta variant="inline" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((deal) => {
          const isShared = deal === shared
          return (
            <div
              key={deal.id}
              ref={isShared ? sharedRef : null}
              className={
                isShared
                  ? 'animate-scale-in rounded-3xl ring-4 ring-brand-400 ring-offset-4 ring-offset-cream'
                  : undefined
              }
            >
              {isShared && (
                <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-brand-600">
                  ✨ Your offer
                </p>
              )}
              <DealCard deal={deal} />
            </div>
          )
        })}
      </div>

      {deals.length === 0 && (
        <p className="py-20 text-center text-charcoal/50">No active deals right now — check back soon!</p>
      )}
    </div>
  )
}
