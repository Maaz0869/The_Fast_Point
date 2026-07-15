import { useState } from 'react'
import SectionHeading from '../components/SectionHeading.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Clock, MapPin, Phone, Whatsapp } from '../components/Icons.jsx'
import { buildWhatsappLink } from '../utils/whatsapp.js'

export default function Contact() {
  const { restaurant } = useStore()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const submit = (e) => {
    e.preventDefault()
    toast.success("Thanks! We'll get back to you shortly.")
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="section py-12">
      <SectionHeading
        eyebrow="Contact Us"
        title="We'd Love to Hear From You"
        subtitle="Questions, feedback, or bulk orders? Reach out any time."
      />

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-2">
        {/* Info */}
        <div className="space-y-4">
          <InfoCard icon={<MapPin className="h-5 w-5" />} title="Visit Us" text={restaurant.address} />
          <InfoCard
            icon={<Phone className="h-5 w-5" />}
            title="Call Us"
            text={restaurant.phone}
            href={`tel:${restaurant.phone}`}
          />
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            title="Opening Hours"
            text={restaurant.hours.map((h) => `${h.day}: ${h.time}`).join(' · ')}
          />
          <a
            href={buildWhatsappLink(restaurant.whatsapp, 'Hi! I have a question about The Snack Hut.')}
            target="_blank"
            rel="noreferrer"
            className="btn w-full bg-[#25D366] text-white hover:brightness-95"
          >
            <Whatsapp className="h-5 w-5" /> Chat on WhatsApp
          </a>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="label">Your Name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[120px] resize-y"
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="How can we help?"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, text, href }) {
  const inner = (
    <div className="card flex items-start gap-4 p-5 transition hover:shadow-card-hover">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div>
        <p className="font-display font-bold">{title}</p>
        <p className="mt-0.5 text-sm text-charcoal/55">{text}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  )
}
