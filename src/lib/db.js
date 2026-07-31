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
  messages: {
    table: 'contact_messages',
    order: { column: 'created_at', ascending: false },
    fields: {
      id: 'id', name: 'name', email: 'email', message: 'message', read: 'read',
      createdAt: 'created_at',
    },
    from: (r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      message: r.message,
      read: !!r.read,
      createdAt: r.created_at,
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

const num = (v) => (v == null ? 0 : Number(v))

export const db = {
  menu: makeRepo(map.menu),
  deals: makeRepo(map.deals),
  slides: makeRepo(map.slides),
  discounts: makeRepo(map.discounts),
  expenses: makeRepo(map.expenses),
  suppliers: makeRepo(map.suppliers),
  businesses: makeRepo(map.businesses),
  orders: {
    ...makeRepo(map.orders),
    // Customers have no write access to `orders` at all — checkout goes through
    // this definer function, which also claims the next order number
    // atomically (so two simultaneous checkouts can't share an id).
    async place(order) {
      const { data, error } = await supabase.rpc('place_order', { p_order: order })
      if (error) throw error
      if (!data) throw new Error('Order could not be placed')
      return {
        ...data,
        subtotal: num(data.subtotal),
        deliveryFee: num(data.deliveryFee),
        discount: num(data.discount),
        total: num(data.total),
        items: data.items || [],
      }
    },
    // Public tracking: returns status/total only, never the customer's details.
    async track(id) {
      const { data, error } = await supabase.rpc('track_order', { p_id: id })
      if (error) throw error
      return data ? { ...data, total: num(data.total) } : null
    },
  },
  messages: {
    list: makeRepo(map.messages).list,
    // Anyone may send a message (insert-only policy), nobody but an admin can
    // read them back — so this is a plain insert, not an upsert.
    async send({ name, email, message }) {
      const { error } = await supabase
        .from('contact_messages')
        .insert({ name, email, message, read: false })
      if (error) throw error
    },
    async setRead(id, read) {
      const { error } = await supabase.from('contact_messages').update({ read }).eq('id', id)
      if (error) throw error
    },
    remove: makeRepo(map.messages).remove,
  },
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

// ---- Image uploads ---------------------------------------------------------
// Admin-uploaded images go to the public `images` Storage bucket and are
// referenced by URL, so a photo never bloats a table row (or localStorage).
export async function uploadImage(file, folder = 'menu') {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('images').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}

// ---- Initial load ----------------------------------------------------------
// Split in two because RLS is split in two: the catalogue is world-readable,
// while orders/finances/messages need an admin session.
export async function fetchPublic() {
  const [menu, deals, slides, discounts, settings] = await Promise.all([
    db.menu.list(),
    db.deals.list(),
    db.slides.list(),
    db.discounts.list(),
    db.settings.getAll(),
  ])
  return { menu, deals, slides, discounts, settings }
}

export async function fetchAdmin() {
  const [orders, expenses, suppliers, businesses, messages] = await Promise.all([
    db.orders.list(),
    db.expenses.list(),
    db.suppliers.list(),
    db.businesses.list(),
    db.messages.list(),
  ])
  return { orders, expenses, suppliers, businesses, messages }
}

// ---- First-run seeding -----------------------------------------------------
// Runs once per project, for an admin only (writes are admin-only now). The
// `seeded` settings flag makes it a genuine one-shot: clearing every expense or
// supplier afterwards can no longer bring the demo rows back.
// Engineered created_at timestamps preserve the seed display order (menus/deals
// sort newest-first, so earlier seeds get later timestamps).
const stamp = (base, i) => new Date(base - i * 60000).toISOString()

export async function seedIfEmpty(current, seeds) {
  const s = current.settings || {}
  if (s.seeded) return false

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
  if (!current.expenses.length && seeds.expenses.length)
    jobs.push(db.expenses.upsertMany(seeds.expenses))
  if (!current.suppliers.length && seeds.suppliers.length)
    jobs.push(db.suppliers.upsertMany(seeds.suppliers))
  if (!current.businesses.length && seeds.businesses.length)
    jobs.push(db.businesses.upsertMany(seeds.businesses))

  if (!s.restaurant) jobs.push(db.settings.set('restaurant', seeds.restaurant))
  if (!s.delivery_rules) jobs.push(db.settings.set('delivery_rules', seeds.deliveryRules))
  if (!s.offer_banner) jobs.push(db.settings.set('offer_banner', seeds.offerBanner))

  await Promise.all(jobs)
  await db.settings.set('seeded', true)
  return jobs.length > 0
}
