import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { rs } from '../../utils/format.js'

export default function ProfileSettings() {
  const { user, profile, updateProfile, changePassword } = useAuth()
  const { deliveryRules } = useStore()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', phone: '', address: '', areaId: '' })
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [pwBusy, setPwBusy] = useState(false)

  // Fill the form once the profile arrives (it loads with the session).
  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      areaId: profile.areaId || '',
    })
  }, [profile])

  const areas = deliveryRules.areas || []

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Please enter your name.')
    setSaving(true)
    const res = await updateProfile(form)
    setSaving(false)
    if (res.ok) toast.success('Details saved — checkout will use these next time.')
    else toast.error(res.error)
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pw.next.length < 6) return toast.error('Password must be at least 6 characters.')
    if (pw.next !== pw.confirm) return toast.error('Both passwords must match.')
    setPwBusy(true)
    const res = await changePassword(pw.next)
    setPwBusy(false)
    if (res.ok) {
      toast.success('Password updated.')
      setPw({ next: '', confirm: '' })
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="card h-fit space-y-4 p-6">
        <div>
          <h2 className="font-display text-lg font-bold">Your Details</h2>
          <p className="text-sm text-charcoal/55">
            We'll use these to fill in checkout automatically.
          </p>
        </div>

        <label className="block">
          <span className="label">Full Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ali Raza"
          />
        </label>

        <label className="block">
          <span className="label">Phone Number</span>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 0300 1234567"
          />
        </label>

        <label className="block">
          <span className="label">Delivery Address</span>
          <textarea
            className="input min-h-[90px] resize-y"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="House #, street, area, city"
          />
        </label>

        {areas.length > 0 && (
          <label className="block">
            <span className="label">Usual Delivery Area</span>
            <select
              className="input"
              value={form.areaId}
              onChange={(e) => setForm({ ...form, areaId: e.target.value })}
            >
              <option value="">Not set</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.charge === 0 ? 'Free' : rs(a.charge)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="label">Email</span>
          <input className="input bg-black/5" value={user?.email || ''} disabled />
          <span className="mt-1 block text-xs text-charcoal/45">
            Your email is your sign-in — contact us if it needs changing.
          </span>
        </label>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : 'Save Details'}
        </button>
      </form>

      <form onSubmit={savePassword} className="card h-fit space-y-4 p-6">
        <div>
          <h2 className="font-display text-lg font-bold">Change Password</h2>
          <p className="text-sm text-charcoal/55">Pick something at least 6 characters long.</p>
        </div>

        <label className="block">
          <span className="label">New Password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
            placeholder="••••••••"
          />
        </label>

        <label className="block">
          <span className="label">Confirm New Password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={pwBusy} className="btn-dark w-full">
          {pwBusy ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
