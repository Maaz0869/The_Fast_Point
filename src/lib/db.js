import { supabase } from './supabase.js'

// ---------------------------------------------------------------------------
// Data-access layer: maps The Snack Hut's camelCase app objects to/from the
// snake_case Supabase rows, and exposes small upsert/remove helpers per entity.
//
// Nested arrays/objects (sizes, customer, items, ledger, entries) live in JSONB
// columns, so each app entity is exactly one row — no join wrangling.
//
// `to` is field-map driven so it is PARTIAL-SAFE: passing only { id, ...patch }
// upserts just those columns and leaves the rest of the row untouched — which
// is exactly what the admin "update" callbacks need.
// ---------------------------------------------------------------------------

const map = {
  menu: {
    table: 'menu_items',
    order: { column: 'created_at', ascending: false },
    // camelCase (app) -> snake_case (column)
    fields: {
      id: 'id', name: 'name', category: 'category', price: 'price',
      salePrice: 'sale_price', description: 'description', image: 'image',
      bestSeller: 'best_seller', sizes: 'sizes', createdAt: 'created_at',
    },
    from: (r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: Number(r.price),
      ...(r.sale_price != null ? { salePrice: Number(r.sale_price) } : {}),
      description: r.description,
      image: r.image,
      ...(r.best_seller ? { bestSeller: true } : {}),
      ...(r.sizes ? { sizes: r.sizes } : {}),
    }),
  },
  deals: {
    table: 'deals',
    order: { column: 'created_at', ascending: false },
    fields: {
      id: 'id', name: 'name', description: 'description', price: 'price',
      oldPrice: 'old_price', image: 'image', tag: 'tag', createdAt: 'created_at',
    },
    from: (r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      ...(r.old_price != null ? { oldPrice: Number(r.old_price) } : {}),
      image: r.image,
      tag: r.tag,
    }),
  },
  slides: {
    table: 'slides',
    order: { column: 'created_at', ascending: true },
    fields: {
      id: 'id', heading: 'heading', text: 'text', buttonText: 'button_text',
      buttonLink: 'button_link', image: 'image', createdAt: 'created_at',
    },
    from: (r) => ({
      id: r.id,
      heading: r.heading,
      text: r.text,
      buttonText: r.button_text,
      buttonLink: r.button_link,
      image: r.image,
    }),
  },
  discounts: {
    table: 'discounts',
    key: 'code',
    order: { column: 'created_at', ascending: true },
    fields: {
      code: 'code', type: 'type', value: 'value', description: 'description',
      minOrder: 'min_order',
    },
    from: (r) => ({
      code: r.code,
      type: r.type,
      value: Number(r.value),
      description: r.description,
      ...(r.min_order != null ? { minOrder: Number(r.min_order) } : {}),
    }),
  },
  orders: {
    table: 'orders',
    order: { column: 'created_at', ascending: false },
    fields: {
      id: 'id', createdAt: 'created_at', orderType: 'order_type', customer: 'customer',
      items: 'items', subtotal: 'subtotal', deliveryFee: 'delivery_fee',
      discount: 'discount', total: 'total', payment: 'payment', status: 'status',
    },
    from: (r) => ({
      id: r.id,
      createdAt: r.created_at,
      orderType: r.order_type,
      customer: r.customer,
      items: r.items || [],
      subtotal: Number(r.subtotal),
      deliveryFee: Number(r.delivery_fee),
      discount: Number(r.discount),
      total: Number(r.total),
      payment: r.payment,
      status: r.status,
    }),
  },
  expenses: {
    table: 'expenses',
    order: { column: 'created_at', ascending: false },
    fields: {
      id: 'id', date: 'date', category: 'category', description: 'description',
      paidTo: 'paid_to', method: 'method', amount: 'amount',
    },
    from: (r) => ({
      id: r.id,
      date: r.date,
      category: r.category,
      description: r.description,
      paidTo: r.paid_to,
      method: r.method,
      amount: Number(r.amount),
    }),
  },
  suppliers: {
    table: 'suppliers',
    order: { column: 'created_at', ascending: false },
    fields: {
      id: 'id', name: 'name', company: 'company', phone: 'phone', address: 'address',
      note: 'note', openingBalance: 'opening_balance', createdAt: 'created_at',
      ledger: 'ledger',
    },
    from: (r) => ({
      id: r.id,
      name: r.name,
      company: r.company,
      phone: r.phone,
      address: r.address,
      note: r.note,
      openingBalance: Number(r.opening_balance),
      createdAt: r.created_at,
      ledger: r.ledger || [],
    }),
  },
  businesses: {
    table: 'businesses',
    order: { column: 'created_at', ascending: false },
    fields: {
      id: 'id', name: 'name', note: 'note', createdAt: 'created_at', entries: 'entries',
    },
    from: (r) => ({
      id: r.id,
      name: r.name,
      note: r.note,
      createdAt: r.created_at,
      entries: r.entries || [],
    }),
  },
}

// Map an app object to a row, including ONLY the keys present in the object.
// Omitted keys stay out of the upsert payload, so on conflict their columns are
// left unchanged (partial update) and on insert they take their column default.
const toRow = (m, obj) => {
  const row = {}
  for (const camel in m.fields) {
    if (obj[camel] !== undefined) row[m.fields[camel]] = obj[camel]
  }
  return row
}

const makeRepo = (m) => ({
  async list() {
    const { data, error } = await supabase
      .from(m.table)
      .select('*')
      .order(m.order.column, { ascending: m.order.ascending })
    if (error) throw error
    return (data || []).map(m.from)
  },
  async upsert(obj) {
    const { error } = await supabase.from(m.table).upsert(toRow(m, obj))
    if (error) throw error
  },
  async upsertMany(objs) {
    if (!objs.length) return
    const { error } = await supabase.from(m.table).upsert(objs.map((o) => toRow(m, o)))
    if (error) throw error
  },
  async remove(id) {
    const { error } = await supabase.from(m.table).delete().eq(m.key || 'id', id)
    if (error) throw error
  },
})

export const db = {
  menu: makeRepo(map.menu),
  deals: makeRepo(map.deals),
  slides: makeRepo(map.slides),
  discounts: makeRepo(map.discounts),
  orders: makeRepo(map.orders),
  expenses: makeRepo(map.expenses),
  suppliers: makeRepo(map.suppliers),
  businesses: makeRepo(map.businesses),
  settings: {
    async getAll() {
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error
      const out = {}
      for (const row of data || []) out[row.key] = row.value
      return out
    },
    async set(key, value) {
      const { error } = await supabase.from('settings').upsert({ key, value })
      if (error) throw error
    },
  },
}

// ---- Initial load: everything the store needs, in parallel -----------------
export async function fetchAll() {
  const [menu, deals, slides, discounts, orders, expenses, suppliers, businesses, settings] =
    await Promise.all([
      db.menu.list(),
      db.deals.list(),
      db.slides.list(),
      db.discounts.list(),
      db.orders.list(),
      db.expenses.list(),
      db.suppliers.list(),
      db.businesses.list(),
      db.settings.getAll(),
    ])
  return { menu, deals, slides, discounts, orders, expenses, suppliers, businesses, settings }
}

// ---- First-run seeding -----------------------------------------------------
// Seeds only the tables that are still empty, so it's safe to call on every
// load. Engineered created_at timestamps preserve the seed display order
// (menus/deals sort newest-first, so earlier seeds get later timestamps).
const stamp = (base, i) => new Date(base - i * 60000).toISOString()

export async function seedIfEmpty(current, seeds) {
  const jobs = []
  const base = Date.parse('2026-01-01T00:00:00Z')

  if (!current.menu.length && seeds.menu.length) {
    jobs.push(db.menu.upsertMany(seeds.menu.map((m, i) => ({ ...m, createdAt: stamp(base, i) }))))
  }
  if (!current.deals.length && seeds.deals.length) {
    jobs.push(db.deals.upsertMany(seeds.deals.map((d, i) => ({ ...d, createdAt: stamp(base, i) }))))
  }
  if (!current.slides.length && seeds.slides.length) jobs.push(db.slides.upsertMany(seeds.slides))
  if (!current.discounts.length && seeds.discounts.length)
    jobs.push(db.discounts.upsertMany(seeds.discounts))
  if (!current.orders.length && seeds.orders.length) jobs.push(db.orders.upsertMany(seeds.orders))
  if (!current.expenses.length && seeds.expenses.length)
    jobs.push(db.expenses.upsertMany(seeds.expenses))
  if (!current.suppliers.length && seeds.suppliers.length)
    jobs.push(db.suppliers.upsertMany(seeds.suppliers))
  if (!current.businesses.length && seeds.businesses.length)
    jobs.push(db.businesses.upsertMany(seeds.businesses))

  const s = current.settings || {}
  if (!s.restaurant) jobs.push(db.settings.set('restaurant', seeds.restaurant))
  if (!s.delivery_rules) jobs.push(db.settings.set('delivery_rules', seeds.deliveryRules))
  if (!s.offer_banner) jobs.push(db.settings.set('offer_banner', seeds.offerBanner))
  if (s.order_counter == null) jobs.push(db.settings.set('order_counter', seeds.orderCounter))

  if (jobs.length) await Promise.all(jobs)
  return jobs.length > 0
}
