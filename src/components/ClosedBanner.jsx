import { useStore } from '../context/StoreContext.jsx'
import { Clock } from './Icons.jsx'

// Site-wide notice shown when the restaurant is toggled closed.
export default function ClosedBanner() {
  const { restaurant } = useStore()
  if (restaurant.isOpen) return null

  return (
    <div className="border-b border-red-200 bg-red-50 text-red-700">
      <div className="section flex items-center justify-center gap-2 py-2.5 text-center text-sm font-semibold">
        <Clock className="h-4 w-4" />
        We're currently closed — ordering is disabled. Please check back during our opening hours.
      </div>
    </div>
  )
}
