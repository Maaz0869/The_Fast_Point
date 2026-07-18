import { rs, hasDiscount, hasSizes, startingPrice, discountPercent } from '../utils/format.js'
import { Plus, Star } from './Icons.jsx'

// A single menu item card. Clicking "Add" opens the customization modal
// (handled by the parent via onCustomize).
export default function MenuItemCard({ item, onCustomize }) {
  return (
    <div className="card group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {item.bestSeller && (
          <span className="chip absolute left-3 top-3 bg-white/95 text-brand-600 shadow">
            <Star className="h-3 w-3" /> Best Seller
          </span>
        )}
        {hasDiscount(item) && (
          <span className="chip absolute right-3 top-3 bg-emerald-500 text-white shadow">
            -{discountPercent(item)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold leading-tight">{item.name}</h3>
        </div>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-charcoal/55">{item.description}</p>
        <div className="mt-4 flex items-center justify-between">
          {hasSizes(item) ? (
            <span className="flex items-baseline gap-1">
              <span className="text-xs text-charcoal/40">From</span>
              <span className="font-display text-lg font-bold text-brand-600">
                {rs(startingPrice(item))}
              </span>
            </span>
          ) : hasDiscount(item) ? (
            <span className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-brand-600">
                {rs(item.salePrice)}
              </span>
              <span className="text-sm text-charcoal/40 line-through">{rs(item.price)}</span>
            </span>
          ) : (
            <span className="font-display text-lg font-bold text-brand-600">{rs(item.price)}</span>
          )}
          <button
            onClick={() => onCustomize(item)}
            className="btn-primary h-10 px-4 py-0 text-sm"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  )
}
