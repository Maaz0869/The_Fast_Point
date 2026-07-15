import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { Plus, Trash } from '../../components/Icons.jsx'

const blank = {
  heading: '',
  text: '',
  buttonText: 'Order Now',
  buttonLink: '/menu',
  image: '',
}

export default function ManageSlider() {
  const { slides, addSlide, updateSlide, deleteSlide } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)

  const openNew = () => {
    setForm(blank)
    setEditing('new')
  }
  const openEdit = (slide) => {
    setForm({ ...slide })
    setEditing(slide.id)
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.heading.trim() || !form.image.trim()) {
      toast.error('Heading and image are required')
      return
    }
    if (editing === 'new') {
      addSlide(form)
      toast.success('Slide added')
    } else {
      updateSlide(editing, form)
      toast.success('Slide updated')
    }
    setEditing(null)
  }

  const remove = (slide) => {
    if (slides.length <= 1) {
      toast.error('Keep at least one slide')
      return
    }
    if (window.confirm('Delete this slide?')) {
      deleteSlide(slide.id)
      toast.success('Slide deleted')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Hero Slider</h1>
          <p className="text-sm text-charcoal/55">{slides.length} slides on the homepage carousel.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Slide
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {slides.map((slide, i) => (
          <div key={slide.id} className="card overflow-hidden">
            <div className="relative h-40">
              <img src={slide.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute left-3 top-3 chip bg-white/90 text-charcoal">
                Slide {i + 1}
              </span>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <p className="font-display text-lg font-bold leading-tight">{slide.heading}</p>
                <p className="line-clamp-1 text-xs text-white/80">{slide.text}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="chip bg-brand-50 text-brand-600">
                {slide.buttonText} → {slide.buttonLink}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(slide)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(slide)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Slide' : 'Edit Slide'}
          onClose={() => setEditing(null)}
          wide
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={save} className="btn-primary" type="submit" form="slide-form">
                Save Slide
              </button>
            </div>
          }
        >
          <form id="slide-form" onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Heading</label>
              <input
                className="input"
                value={form.heading}
                onChange={(e) => setForm({ ...form, heading: e.target.value })}
                placeholder="Big Flavours, Bigger Cravings"
              />
            </div>
            <div>
              <label className="label">Sub-text</label>
              <textarea
                className="input min-h-[70px] resize-y"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Short supporting line…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Button Text</label>
                <input
                  className="input"
                  value={form.buttonText}
                  onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                  placeholder="Order Now"
                />
              </div>
              <div>
                <label className="label">Button Link</label>
                <input
                  className="input"
                  value={form.buttonLink}
                  onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
                  placeholder="/menu"
                />
              </div>
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
            {form.image && (
              <img
                src={form.image}
                alt="preview"
                className="h-36 w-full rounded-xl object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </form>
        </Modal>
      )}
    </div>
  )
}
