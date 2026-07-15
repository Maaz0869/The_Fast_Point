import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Plus, Trash } from '../../components/Icons.jsx'

export default function Settings() {
  const { restaurant, updateRestaurant, toggleOpen } = useStore()
  const toast = useToast()
  const [form, setForm] = useState(() => ({
    ...restaurant,
    hours: restaurant.hours.map((h) => ({ ...h })),
  }))

  const updateHour = (i, key, val) => {
    setForm((f) => {
      const hours = [...f.hours]
      hours[i] = { ...hours[i], [key]: val }
      return { ...f, hours }
    })
  }
  const addHour = () => setForm((f) => ({ ...f, hours: [...f.hours, { day: '', time: '' }] }))
  const removeHour = (i) => setForm((f) => ({ ...f, hours: f.hours.filter((_, idx) => idx !== i) }))

  const save = (e) => {
    e.preventDefault()
    updateRestaurant({
      ...form,
      hours: form.hours.filter((h) => h.day.trim() && h.time.trim()),
    })
    toast.success('Settings saved')
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Settings</h1>
        <p className="text-sm text-charcoal/55">Restaurant status, timings and contact details.</p>
      </div>

      {/* Open/close */}
      <div className="card mb-6 flex items-center justify-between p-6">
        <div>
          <h2 className="font-display font-bold">Restaurant Status</h2>
          <p className="text-sm text-charcoal/55">
            When closed, customers can browse but cannot place orders.
          </p>
        </div>
        <button
          onClick={toggleOpen}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
            restaurant.isOpen
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${restaurant.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {restaurant.isOpen ? 'Open — accepting orders' : 'Closed'}
        </button>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Info */}
        <div className="card space-y-4 p-6">
          <h2 className="font-display font-bold">Restaurant Info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input
                className="input"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">WhatsApp (digits only)</label>
              <input
                className="input"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="923001234567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">WhatsApp Auto-Send API Key (CallMeBot)</label>
              <input
                className="input"
                value={form.callmebotApiKey || ''}
                onChange={(e) => setForm({ ...form, callmebotApiKey: e.target.value })}
                placeholder="Paste your CallMeBot API key"
              />
              <p className="mt-1 text-xs text-charcoal/45">
                When set, new orders are sent straight to your WhatsApp — customers stay on the site.
                Get a free key: from your phone, WhatsApp{' '}
                <span className="font-semibold">“I allow callmebot to send me messages”</span> to{' '}
                <span className="font-semibold">+34 644 44 21 07</span>; it replies with your API key.
              </p>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="card space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">Opening Hours</h2>
            <button type="button" onClick={addHour} className="btn-ghost px-3 py-1.5 text-sm">
              <Plus className="h-4 w-4" /> Add Row
            </button>
          </div>
          {form.hours.map((h, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input sm:flex-1"
                value={h.day}
                onChange={(e) => updateHour(i, 'day', e.target.value)}
                placeholder="e.g. Monday – Friday"
              />
              <input
                className="input sm:flex-1"
                value={h.time}
                onChange={(e) => updateHour(i, 'time', e.target.value)}
                placeholder="e.g. 12:00 PM – 12:00 AM"
              />
              <button
                type="button"
                onClick={() => removeHour(i)}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                aria-label="Remove"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="btn-primary">
          Save Settings
        </button>
      </form>
    </div>
  )
}
