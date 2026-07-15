import DealCard from '../components/DealCard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { useStore } from '../context/StoreContext.jsx'

export default function Deals() {
  const { deals, offerBanner } = useStore()

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

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {deals.length === 0 && (
        <p className="py-20 text-center text-charcoal/50">No active deals right now — check back soon!</p>
      )}
    </div>
  )
}
