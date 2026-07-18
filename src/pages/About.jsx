import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading.jsx'
import { useStore } from '../context/StoreContext.jsx'

export default function About() {
  const { restaurant } = useStore()
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-night text-white">
        <img
          src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80"
          alt="Our kitchen"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="section relative py-20 text-center">
          <span className="chip mb-3 bg-brand-500 text-white">Our Story</span>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Fresh. Fast. Delicious.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            {restaurant.name} started with one simple idea — serve seriously good fast food made from
            quality ingredients, at prices everyone can enjoy.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="section grid items-center gap-10 py-16 md:grid-cols-2">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          alt="Our restaurant"
          className="rounded-3xl shadow-card"
        />
        <div>
          <SectionHeading eyebrow="Since Day One" title="Made With Love, Served With Speed" align="left" />
          <p className="mt-4 text-charcoal/60">
            From our juicy hand-pressed burgers to our wood-fired pizzas, every dish is crafted fresh
            to order. We believe fast food shouldn't mean cutting corners — so we don't.
          </p>
          <p className="mt-3 text-charcoal/60">
            Whether you're grabbing a quick bite, ordering a family feast, or dining in with friends,
            we're here to make it delicious and effortless.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { n: '50k+', l: 'Orders Served' },
              { n: '4.8★', l: 'Avg. Rating' },
              { n: '30min', l: 'Avg. Delivery' },
            ].map((s) => (
              <div key={s.l} className="card p-4">
                <p className="font-display text-2xl font-extrabold text-brand-600">{s.n}</p>
                <p className="text-xs text-charcoal/50">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="band py-16">
        <div className="section">
          <SectionHeading eyebrow="Why Us" title="What Makes Us Different" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: '🥩', title: 'Premium Ingredients', text: 'Locally sourced, always fresh — never frozen patties or stale buns.' },
              { icon: '👨‍🍳', title: 'Cooked to Order', text: 'Nothing sits under a heat lamp. Your food is made when you order it.' },
              { icon: '⚡', title: 'Lightning Delivery', text: 'Hot food at your door in 30 minutes or less, guaranteed fresh.' },
            ].map((v) => (
              <div key={v.title} className="card p-6 text-center hover:-translate-y-1 hover:shadow-card-hover">
                <span className="text-4xl">{v.icon}</span>
                <h3 className="mt-4 font-display text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-charcoal/55">{v.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/menu" className="btn-primary">Explore Our Menu →</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
