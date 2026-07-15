import { useState } from 'react'
import { Link } from 'react-router-dom'
import HeroSlider from '../components/HeroSlider.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import MenuItemCard from '../components/MenuItemCard.jsx'
import DealCard from '../components/DealCard.jsx'
import ItemModal from '../components/ItemModal.jsx'
import { useStore } from '../context/StoreContext.jsx'

export default function Home() {
  const { menu, deals, categories, restaurant } = useStore()
  const [modalItem, setModalItem] = useState(null)

  const bestSellers = menu.filter((m) => m.bestSeller).slice(0, 4)
  const topDeals = deals.slice(0, 3)

  return (
    <div>
      <HeroSlider />

      {/* Feature strip */}
      <div className="bg-white">
        <div className="section grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
          {[
            { icon: '🚀', title: 'Fast Delivery', text: '30 min or less' },
            { icon: '🔥', title: 'Made Fresh', text: 'Cooked to order' },
            { icon: '💳', title: 'Easy Payment', text: 'Cash, card & wallet' },
            { icon: '⭐', title: 'Top Rated', text: '4.8 / 5 by foodies' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                {f.icon}
              </span>
              <div>
                <p className="font-display text-sm font-bold">{f.title}</p>
                <p className="text-xs text-charcoal/50">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="section py-14">
        <SectionHeading
          eyebrow="Explore"
          title="Browse by Category"
          subtitle="From sizzling burgers to cheesy pizzas — find your craving."
        />
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/menu?cat=${c.id}`}
              className="card flex flex-col items-center gap-2 p-4 text-center hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-semibold sm:text-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="section pb-14">
        <div className="mb-8 flex items-end justify-between">
          <SectionHeading
            eyebrow="Fan Favourites"
            title="Best Sellers"
            align="left"
          />
          <Link to="/menu" className="hidden text-sm font-semibold text-brand-600 hover:underline sm:block">
            View full menu →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bestSellers.map((item) => (
            <MenuItemCard key={item.id} item={item} onCustomize={setModalItem} />
          ))}
        </div>
      </section>

      {/* Deals CTA */}
      <section className="bg-white py-14">
        <div className="section">
          <div className="mb-8 flex items-end justify-between">
            <SectionHeading eyebrow="Save More" title="Hot Deals & Combos" align="left" />
            <Link to="/deals" className="hidden text-sm font-semibold text-brand-600 hover:underline sm:block">
              All deals →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {topDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="section py-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-crimson-600 px-8 py-14 text-center text-white sm:px-14">
          <div className="pointer-events-none absolute -right-10 -top-10 text-[10rem] opacity-10">🍟</div>
          <div className="pointer-events-none absolute -bottom-12 -left-6 text-[9rem] opacity-10">🍔</div>
          <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">
            Hungry? We've got you covered.
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/85">
            {restaurant.isOpen
              ? 'Order online now for delivery, take away, or dine-in. Fresh food, delivered fast.'
              : "We're closed right now, but browse the menu and come back soon!"}
          </p>
          <Link to="/menu" className="btn mt-7 bg-white text-brand-600 hover:bg-white/90">
            Start Your Order →
          </Link>
        </div>
      </section>

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  )
}
