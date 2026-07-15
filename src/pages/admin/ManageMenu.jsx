import { useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Modal from '../../components/Modal.jsx'
import { rs } from '../../utils/format.js'
import { Plus, Trash } from '../../components/Icons.jsx'

const blank = {
  name: '',
  category: 'burgers',
  price: '',
  description: '',
  image: '',
  bestSeller: false,
}

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

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required')
      return
    }
    const payload = {
      ...form,
      price: Number(form.price),
      image:
        form.image ||
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
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
                  <td className="px-4 py-3 font-semibold">{rs(item.price)}</td>
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
                  {catName(item.category)} · {rs(item.price)}
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
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
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
                <label className="label">Image URL</label>
                <input
                  className="input"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://…  (leave blank for a placeholder)"
                />
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
              <img
                src={form.image}
                alt="preview"
                className="h-32 w-full rounded-xl object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
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
