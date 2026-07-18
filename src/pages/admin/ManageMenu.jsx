import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { rs, hasDiscount, hasSizes, discountPercent } from '../../utils/format.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blank = {
  name: '',
  category: 'burgers',
  price: '',
  salePrice: '',
  description: '',
  image: '',
  bestSeller: false,
}

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Default rows offered when turning sizes on (e.g. pizza).
const DEFAULT_SIZES = [
  { id: 'small', name: 'Small', price: '' },
  { id: 'medium', name: 'Medium', price: '' },
  { id: 'large', name: 'Large', price: '' },
  { id: 'xl', name: 'Extra Large', price: '' },
]

export default function ManageMenu() {
  const { menu, categories, addMenuItem, updateMenuItem, deleteMenuItem } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState(null) // item or {} for new
  const [form, setForm] = useState(blank)
  const [filter, setFilter] = useState('all')

  const openNew = () => {
    setForm(blank)
    setEditing('new')
  }
  const openEdit = (item) => {
    setForm({ ...item })
    setEditing(item.id)
  }

  // ---- Size rows (for pizza etc.) ----
  const sizesOn = Array.isArray(form.sizes)
  // Selecting the Pizza category auto-enables size options (Small → XL).
  const onCategoryChange = (category) =>
    setForm((f) => ({
      ...f,
      category,
      sizes:
        category === 'pizza' && !Array.isArray(f.sizes)
          ? DEFAULT_SIZES.map((s) => ({ ...s }))
          : f.sizes,
    }))
  const toggleSizes = (on) =>
    setForm((f) => ({ ...f, sizes: on ? f.sizes || DEFAULT_SIZES.map((s) => ({ ...s })) : null }))
  const updateSize = (i, patch) =>
    setForm((f) => ({ ...f, sizes: f.sizes.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }))
  const addSize = () =>
    setForm((f) => ({ ...f, sizes: [...(f.sizes || []), { id: '', name: '', price: '' }] }))
  const removeSize = (i) =>
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }))

  // Read a chosen image file into a base64 data URL so it can be stored inline
  // (no backend). Works everywhere <img src> is used.
  const onImageFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image is too large (max 3 MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }))
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting the same file
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    const fallbackImage =
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'

    let payload
    if (Array.isArray(form.sizes)) {
      // Sized item (e.g. pizza) — prices come from the size rows.
      const cleanSizes = form.sizes
        .filter((s) => s.name.trim() && Number(s.price) > 0)
        .map((s, i) => ({
          id: s.id || slug(s.name) || `s${i}`,
          name: s.name.trim(),
          price: Number(s.price),
        }))
      if (cleanSizes.length === 0) {
        toast.error('Add at least one size with a price')
        return
      }
      payload = {
        ...form,
        sizes: cleanSizes,
        price: Math.min(...cleanSizes.map((s) => s.price)), // smallest = "from" price
        salePrice: null, // discounts not used with sizes
        image: form.image || fallbackImage,
      }
    } else {
      if (!form.price) {
        toast.error('Price is required')
        return
      }
      const price = Number(form.price)
      // Discount price is optional; when given it must be a positive number
      // below the regular price.
      const sale = form.salePrice === '' || form.salePrice == null ? null : Number(form.salePrice)
      if (sale != null && (sale <= 0 || sale >= price)) {
        toast.error('Discount price must be greater than 0 and less than the price')
        return
      }
      payload = {
        ...form,
        price,
        salePrice: sale, // null = no discount
        sizes: null,
        image: form.image || fallbackImage,
      }
    }

    if (editing === 'new') {
      addMenuItem(payload)
      toast.success('Menu item added')
    } else {
      updateMenuItem(editing, payload)
      toast.success('Menu item updated')
    }
    setEditing(null)
  }

  const remove = (item) => {
    if (window.confirm(`Delete "${item.name}"?`)) {
      deleteMenuItem(item.id)
      toast.success('Item deleted')
    }
  }

  const filtered = filter === 'all' ? menu : menu.filter((m) => m.category === filter)
  const catName = (id) => categories.find((c) => c.id === id)?.name || id

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Menu Items</h1>
          <p className="text-sm text-charcoal/55">{menu.length} items on the menu.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Filter */}
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterChip>
        {categories.map((c) => (
          <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.icon} {c.name}
          </FilterChip>
        ))}
      </div>

      {/* Table (desktop) / cards (mobile) */}
      <div className="card overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="line-clamp-1 max-w-xs text-xs text-charcoal/50">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip bg-gray-100 text-charcoal/70">{catName(item.category)}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {hasSizes(item) ? (
                      <span>
                        <span className="text-xs font-normal text-charcoal/40">From </span>
                        {rs(item.price)}
                        <span className="ml-1 chip bg-gray-100 text-charcoal/60">
                          {item.sizes.length} sizes
                        </span>
                      </span>
                    ) : hasDiscount(item) ? (
                      <span className="flex items-center gap-2">
                        <span className="text-green-600">{rs(item.salePrice)}</span>
                        <span className="text-xs font-normal text-charcoal/40 line-through">
                          {rs(item.price)}
                        </span>
                        <span className="chip bg-green-100 text-green-700">
                          -{discountPercent(item)}%
                        </span>
                      </span>
                    ) : (
                      rs(item.price)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-black/5 md:hidden">
          {filtered.map((item) => (
            <div key={item.id} className="flex gap-3 p-3">
              <img src={item.image} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-charcoal/50">
                  {catName(item.category)} ·{' '}
                  {hasDiscount(item) ? (
                    <>
                      <span className="font-semibold text-green-600">{rs(item.salePrice)}</span>{' '}
                      <span className="line-through">{rs(item.price)}</span>
                    </>
                  ) : (
                    rs(item.price)
                  )}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-red-500 ring-1 ring-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-charcoal/50">No items in this category.</p>
        )}
      </div>

      {/* Add/Edit modal */}
      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Menu Item' : 'Edit Menu Item'}
          onClose={() => setEditing(null)}
          wide
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={save} className="btn-primary" type="submit" form="menu-form">
                Save Item
              </button>
            </div>
          }
        >
          <form id="menu-form" onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Classic Beef Burger"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => onCategoryChange(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Sizes toggle */}
              <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
                <input
                  type="checkbox"
                  checked={sizesOn}
                  onChange={(e) => toggleSizes(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-500"
                />
                This item has sizes (e.g. pizza — Small / Large / Extra Large)
              </label>

              {!sizesOn && (
                <>
                  <div>
                    <label className="label">Price (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="550"
                    />
                  </div>
                  <div>
                    <label className="label">
                      Discount Price (Rs.){' '}
                      <span className="font-normal text-charcoal/40">— optional</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={form.salePrice ?? ''}
                      onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                      placeholder="e.g. 450"
                    />
                    {hasDiscount({ price: Number(form.price), salePrice: Number(form.salePrice) }) && (
                      <p className="mt-1 text-xs font-semibold text-green-600">
                        {discountPercent({
                          price: Number(form.price),
                          salePrice: Number(form.salePrice),
                        })}
                        % off
                      </p>
                    )}
                  </div>
                </>
              )}

              {sizesOn && (
                <div className="sm:col-span-2">
                  <label className="label">Sizes & Prices</label>
                  <div className="space-y-2">
                    {form.sizes.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className="input flex-1"
                          value={s.name}
                          onChange={(e) => updateSize(i, { name: e.target.value })}
                          placeholder="Size name (e.g. Large)"
                        />
                        <input
                          type="number"
                          min="0"
                          className="input w-28"
                          value={s.price}
                          onChange={(e) => updateSize(i, { price: e.target.value })}
                          placeholder="Price"
                        />
                        <button
                          type="button"
                          onClick={() => removeSize(i)}
                          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                          aria-label="Remove size"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addSize}
                    className="btn-ghost mt-2 text-sm"
                  >
                    <Plus className="h-4 w-4" /> Add Size
                  </button>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short, appetizing description…"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Image</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="btn-outline flex-none cursor-pointer whitespace-nowrap px-4 py-3 text-sm">
                    <Plus className="h-4 w-4" /> Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={onImageFile} />
                  </label>
                  <input
                    className="input"
                    value={form.image?.startsWith('data:') ? '' : form.image || ''}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="…or paste an image URL"
                  />
                </div>
                <p className="mt-1 text-xs text-charcoal/40">
                  Upload from your device or paste a URL. Leave blank for a placeholder.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.bestSeller}
                onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })}
                className="h-4 w-4 rounded accent-brand-500"
              />
              Mark as Best Seller
            </label>
            {form.image && (
              <div className="relative">
                <img
                  src={form.image}
                  alt="preview"
                  className="h-36 w-full rounded-xl object-cover ring-1 ring-black/5"
                  onLoad={(e) => (e.currentTarget.style.display = 'block')}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: '' })}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow ring-1 ring-black/5 transition hover:bg-red-50"
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-none whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-brand-500 text-white' : 'bg-white text-charcoal/60 ring-1 ring-black/5 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}
