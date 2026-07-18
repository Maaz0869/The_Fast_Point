import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { Clock, MapPin, Phone, Whatsapp } from './Icons.jsx'
import { buildWhatsappLink } from '../utils/whatsapp.js'

export default function Footer() {
  const { restaurant } = useStore()

  return (
    <footer className="mt-20 bg-night text-white/80">
      <div className="section grid gap-10 py-14 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 text-white">
            <img
              src="/logo.png"
              alt={restaurant.name}
              className="h-9 w-9 rounded-xl object-cover"
            />
            <span className="font-display text-lg font-bold">{restaurant.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {restaurant.tagline} Serving up the tastiest burgers, pizzas and more — made fresh,
            delivered fast.
          </p>
          <div className="mt-5 flex gap-3">
            {Object.entries(restaurant.socials).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm capitalize transition hover:bg-brand-500"
                title={name}
              >
                {name[0].toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { to: '/menu', label: 'Menu' },
              { to: '/deals', label: 'Deals & Offers' },
              { to: '/track', label: 'Track Order' },
              { to: '/about', label: 'About Us' },
              { to: '/admin', label: 'Admin Login' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition hover:text-brand-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">
            Get In Touch
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-none text-brand-400" />
              <a
                href={restaurant.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-brand-400"
              >
                {restaurant.address}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 flex-none text-brand-400" />
              <a href={`tel:${restaurant.phone}`} className="hover:text-brand-400">
                {restaurant.phone}
              </a>
            </li>
          </ul>
        </div>

        {/* Hours + WhatsApp */}
        <div>
          <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">
            Opening Hours
          </h4>
          <ul className="space-y-2 text-sm">
            {restaurant.hours.map((h) => (
              <li key={h.day} className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-none text-brand-400" />
                <span>
                  <span className="block text-white/90">{h.day}</span>
                  <span className="text-white/50">{h.time}</span>
                </span>
              </li>
            ))}
          </ul>
          <a
            href={buildWhatsappLink(restaurant.whatsapp, 'Hi! I would like to place an order.')}
            target="_blank"
            rel="noreferrer"
            className="btn mt-5 w-full bg-[#25D366] text-white hover:brightness-95"
          >
            <Whatsapp className="h-5 w-5" /> Order on WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          <p>Made with 🧡 for food lovers.</p>
        </div>
      </div>
    </footer>
  )
}
