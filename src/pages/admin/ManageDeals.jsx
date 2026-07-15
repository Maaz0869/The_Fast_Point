import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { rs } from '../../utils/format.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blank = { name: '', description: '', price: '', oldPrice: '', image: '', tag: '' }

export default function ManageDeals() {
  const { deals, offerBanner, setOfferBanner, addDeal, updateDeal, deleteDeal } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [banner, setBanner] = useState(offerBanner)

  const openNew = () => {
    setForm(blank)
    setEditing('new')
  }
  const openEdit = (deal) => {
    setForm({ ...deal, oldPrice: deal.oldPrice || '' })
    setEditing(deal.id)
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required')
      return
    }
    const payload = {
      ...form,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      image:
        form.image ||
        'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80',
    }
    if (editing === 'new') {
      addDeal(payload)
      toast.success('Deal created')
    } else {
      updateDeal(editing, payload)
      toast.success('Deal updated')
    }
    setEditing(null)
  }

  const remove = (deal) => {
    if (window.confirm(`Delete deal "${deal.name}"?`)) {
      deleteDeal(deal.id)
      toast.success('Deal deleted')
    }
  }

  const saveBanner = () => {
    setOfferBanner(banner)
    toast.success('Offer banner updated')
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Deals & Offers</h1>
          <p className="text-sm text-charcoal/55">{deals.length} active deals.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Deal
        </button>
      </div>

      {/* Offer banner editor */}
      <div className="card mb-6 p-5">
        <h2 className="mb-3 font-display font-bold">Offer Banner</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="input flex-1"
            value={banner.text}
            onChange={(e) => setBanner({ ...banner, text: e.target.value })}
            placeholder="e.g. 20% OFF this week!"
          />
          <label className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
            <input
              type="checkbox"
              checked={banner.active}
              onChange={(e) => setBanner({ ...banner, active: e.target.checked })}
              className="h-4 w-4 rounded accent-brand-500"
            />
            Show banner
          </label>
          <button onClick={saveBanner} className="btn-dark">
            Save Banner
          </button>
        </div>
      </div>

      {/* Deals grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => (
          <div key={deal.id} className="card overflow-hidden">
            <img src={deal.image} alt="" className="h-32 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-bold">{deal.name}</h3>
                {deal.tag && <span className="chip bg-brand-50 text-brand-600">{deal.tag}</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-charcoal/55">{deal.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-display font-bold text-brand-600">{rs(deal.price)}</span>
                {deal.oldPrice && (
                  <span className="text-sm text-charcoal/40 line-through">{rs(deal.oldPrice)}</span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(deal)}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(deal)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deals.length === 0 && (
        <p className="card p-10 text-center text-sm text-charcoal/50">No deals yet — add one!</p>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Deal' : 'Edit Deal'}
          onClose={() => setEditing(null)}
          wide
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={save} className="btn-primary" type="submit" form="deal-form">
                Save Deal
              </button>
            </div>
          }
        >
          <form id="deal-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Deal Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Family Feast"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[70px] resize-y"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What's included…"
              />
            </div>
            <div>
              <label className="label">Price (Rs.)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="2499"
              />
            </div>
            <div>
              <label className="label">Old Price (optional)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                placeholder="3200"
              />
            </div>
            <div>
              <label className="label">Tag (optional)</label>
              <input
                className="input"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                placeholder="e.g. Best Value"
              />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input
                className="input"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
