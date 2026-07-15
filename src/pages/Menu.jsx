import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MenuItemCard from '../components/MenuItemCard.jsx'
import ItemModal from '../components/ItemModal.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { Search } from '../components/Icons.jsx'

export default function Menu() {
  const { menu, categories } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCat = searchParams.get('cat') || 'all'
  const [query, setQuery] = useState('')
  const [modalItem, setModalItem] = useState(null)

  const setCat = (cat) => {
    if (cat === 'all') setSearchParams({})
    else setSearchParams({ cat })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return menu.filter((item) => {
      const matchesCat = activeCat === 'all' || item.category === activeCat
      const matchesQuery =
        !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      return matchesCat && matchesQuery
    })
  }, [menu, activeCat, query])

  return (
    <div className="section py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="chip mb-3 bg-brand-100 text-brand-600">Our Menu</span>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Pick Your Favourites</h1>
        <p className="mt-2 text-charcoal/55">Fresh ingredients, bold flavours — made just for you.</p>
      </div>

      {/* Search */}
      <div className="mx-auto mb-6 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for burgers, pizza, fries…"
            className="input pl-12"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2">
        <CatChip active={activeCat === 'all'} onClick={() => setCat('all')}>
          🍽️ All
        </CatChip>
        {categories.map((c) => (
          <CatChip key={c.id} active={activeCat === c.id} onClick={() => setCat(c.id)}>
            {c.icon} {c.name}
          </CatChip>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} onCustomize={setModalItem} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-5xl">🔍</p>
          <p className="mt-4 font-display text-lg font-bold">No items found</p>
          <p className="text-charcoal/50">Try a different search or category.</p>
        </div>
      )}

      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  )
}

function CatChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-none whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
          : 'bg-white text-charcoal/70 ring-1 ring-black/5 hover:bg-brand-50 hover:text-brand-600'
      }`}
    >
      {children}
    </button>
  )
}
