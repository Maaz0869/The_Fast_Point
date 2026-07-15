import { useStore } from '../context/StoreContext.jsx'

// Thin marquee-style banner shown site-wide when an offer is active.
export default function OfferBanner() {
  const { offerBanner } = useStore()
  if (!offerBanner.active) return null

  return (
    <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-crimson-500 text-white">
      <div className="section flex items-center justify-center gap-2 py-2 text-center text-sm font-semibold">
        <span className="animate-pulse">✦</span>
        <span>{offerBanner.text}</span>
      </div>
    </div>
  )
}
