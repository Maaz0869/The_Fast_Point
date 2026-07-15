import { rs } from '../utils/format.js'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// Deal / combo card with old price strike-through and an add-to-cart action.
export default function DealCard({ deal }) {
  const { addItem } = useCart()
  const toast = useToast()

  const discount = deal.oldPrice
    ? Math.round(((deal.oldPrice - deal.price) / deal.oldPrice) * 100)
    : 0

  const add = () => {
    addItem({
      itemId: deal.id,
      name: deal.name,
      image: deal.image,
      basePrice: deal.price,
      extras: [],
      spice: null,
      spiceLabel: null,
      unitPrice: deal.price,
      qty: 1,
    })
    toast.success(`${deal.name} added to cart`)
  }

  return (
    <div className="card group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={deal.image}
          alt={deal.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {deal.tag && (
          <span className="chip absolute left-3 top-3 bg-crimson-500 text-white shadow">
            {deal.tag}
          </span>
        )}
        {discount > 0 && (
          <span className="chip absolute right-3 top-3 bg-white text-brand-600 shadow">
            {discount}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold">{deal.name}</h3>
        <p className="mt-1 flex-1 text-sm text-charcoal/55">{deal.description}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="font-display text-2xl font-extrabold text-brand-600">
              {rs(deal.price)}
            </span>
            {deal.oldPrice && (
              <span className="ml-2 text-sm text-charcoal/40 line-through">{rs(deal.oldPrice)}</span>
            )}
          </div>
          <button onClick={add} className="btn-primary h-10 px-4 py-0 text-sm">
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
