import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORIES,
  DEALS,
  DELIVERY_RULES,
  DISCOUNT_CODES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  MENU_ITEMS,
  OFFER_BANNER,
  ORDER_STATUSES,
  RESTAURANT,
  SEED_BUSINESSES,
  SEED_EXPENSES,
  SEED_SUPPLIERS,
  SLIDES,
} from '../data/mockData.js'
import { db, fetchAdmin, fetchPublic, seedIfEmpty } from '../lib/db.js'
import { useAuth } from './AuthContext.jsx'

// Fire-and-forget a Supabase write; log (don't crash) if it fails so the
// optimistic local update still stands and the UI stays responsive.
const save = (promise) => {
  if (promise && typeof promise.catch === 'function') {
    promise.catch((e) => console.error('[store] Supabase save failed:', e))
  }
}

// ---------------------------------------------------------------------------
// StoreContext holds all "shared/backend" data: menu, deals, slider, orders,
// discount codes, delivery rules and restaurant settings. The admin panel
// mutates this state; the customer site reads from it.
//
// Supabase is the source of truth. The public catalogue (menu, deals, slides,
// discount codes, shop settings) is cached in localStorage for an instant first
// paint; orders, finances and contact messages are admin-only under RLS, so
// they are always fetched fresh after sign-in and never cached on disk.
// ---------------------------------------------------------------------------

const StoreContext = createContext(null)

export const useStore = () => useContext(StoreContext)

const genId = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 8)}`

// Bump the version suffix if the saved shape ever changes incompatibly.
// v2 dropped orders/finances from the cache — they are admin-only server data.
const STORAGE_KEY = 'snackhut_store_v2'

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// A customer's own orders, kept for this tab only, so the confirmation page
// still works after a refresh (they can't read the orders table under RLS).
const MY_ORDERS_KEY = 'snackhut_my_orders'

const rememberMyOrder = (order) => {
  try {
    const all = JSON.parse(sessionStorage.getItem(MY_ORDERS_KEY) || '[]')
    sessionStorage.setItem(MY_ORDERS_KEY, JSON.stringify([order, ...all].slice(0, 10)))
  } catch {
    /* storage unavailable — the confirmation page still has the order in state */
  }
}

const readMyOrder = (lowerId) => {
  try {
    const all = JSON.parse(sessionStorage.getItem(MY_ORDERS_KEY) || '[]')
    return all.find((o) => String(o.id).toLowerCase() === lowerId)
  } catch {
    return undefined
  }
}

// Use the saved value only when it's an array; otherwise fall back to the seed.
// Guards against corrupt/tampered localStorage (a non-array would crash .map).
const arr = (val, fallback) => (Array.isArray(val) ? val : fallback)

// Non-destructive size migration for saved menus that predate the sizes feature
// (or an earlier version of it, e.g. before "Medium" existed).
const seedSizesById = Object.fromEntries(
  MENU_ITEMS.filter((m) => m.sizes).map((m) => [m.id, m.sizes]),
)

// Merge seed sizes into one item: keep existing size prices & any custom sizes,
// and append any seed sizes that are missing (e.g. a newly added "Medium").
const mergeItemSizes = (item) => {
  const seed = seedSizesById[item.id]
  if (!seed) return item
  if (!Array.isArray(item.sizes) || item.sizes.length === 0) return { ...item, sizes: seed }
  const seedIds = new Set(seed.map((s) => s.id))
  const ordered = seed.map((s) => item.sizes.find((x) => x.id === s.id) || s) // keep saved prices
  const custom = item.sizes.filter((s) => !seedIds.has(s.id)) // preserve admin-added sizes
  return { ...item, sizes: [...ordered, ...custom] }
}

// Runs on every load so seed items (pizzas) always carry the full set of seed
// sizes — including newly added ones like "Medium". Saved prices and any
// admin-added custom sizes are preserved; only genuinely missing seed sizes are
// added, so this reliably fixes older saved menus without a one-time flag.
const initMenu = (items) => items.map(mergeItemSizes)

// Replace any known legacy address with the current one. This runs every load
// but only rewrites addresses that were shipped as defaults — so once it becomes
// "The Snack Hut Barikot" (or the admin sets a new address in Settings), it is
// left untouched. No localStorage flag needed, so it can't get "stuck".
const LEGACY_ADDRESSES = new Set([
  'Barikot, Swat — near Daewoo Adda',
  'The Snack Hut, Barikot, Swat',
])
const applyLocationMigration = (rest) => {
  if (rest && LEGACY_ADDRESSES.has(rest.address)) {
    return { ...rest, address: RESTAURANT.address, mapUrl: RESTAURANT.mapUrl }
  }
  return rest
}

// Replace the old shipped-default phone/WhatsApp with the current one, and make
// sure the secondary contact number exists. Like the address migration above,
// this runs every load but only rewrites values that match a known legacy
// default — so once the admin sets custom numbers in Settings they're kept.
const LEGACY_PHONES = new Set(['+92 344 999 0869', '923449990869'])
const applyContactMigration = (rest) => {
  if (!rest) return rest
  let next = rest
  if (LEGACY_PHONES.has(rest.phone) || LEGACY_PHONES.has(rest.whatsapp)) {
    next = { ...next, phone: RESTAURANT.phone, whatsapp: RESTAURANT.whatsapp }
  }
  if (next.phone2 == null) {
    next = { ...next, phone2: RESTAURANT.phone2 }
  }
  return next
}

// Run all restaurant-settings migrations in one place.
const migrateRestaurant = (rest) => applyContactMigration(applyLocationMigration(rest))

export function StoreProvider({ children }) {
  const { isAdmin } = useAuth()

  // Read localStorage exactly once (not on every render). Each useState reads
  // this the first time it mounts and never again.
  const saved = useRef(loadSaved()).current

  const [menu, setMenu] = useState(() => initMenu(arr(saved?.menu, MENU_ITEMS)))
  const [deals, setDeals] = useState(() => arr(saved?.deals, DEALS))
  const [slides, setSlides] = useState(() => arr(saved?.slides, SLIDES))
  const [discounts, setDiscounts] = useState(() => arr(saved?.discounts, DISCOUNT_CODES))
  // Merge so any saved rules that predate the distance fields still get them.
  const [deliveryRules, setDeliveryRules] = useState(() => ({
    ...DELIVERY_RULES,
    ...(saved?.deliveryRules && typeof saved.deliveryRules === 'object' ? saved.deliveryRules : {}),
  }))
  const [restaurant, setRestaurant] = useState(() =>
    migrateRestaurant(saved?.restaurant ?? RESTAURANT),
  )
  const [offerBanner, setOfferBanner] = useState(() => saved?.offerBanner ?? OFFER_BANNER)

  // Admin-only data: never read from the cache, always loaded after sign-in.
  const [orders, setOrders] = useState([])
  const [expenses, setExpenses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [messages, setMessages] = useState([])

  // Cache the public catalogue for a fast first paint. Wrapped in try/catch so
  // a full storage quota never crashes the app.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          menu,
          deals,
          slides,
          discounts,
          deliveryRules,
          restaurant,
          offerBanner,
        }),
      )
    } catch {
      /* storage unavailable or over quota — keep running in-memory */
    }
  }, [menu, deals, slides, discounts, deliveryRules, restaurant, offerBanner])

  const SEEDS = {
    menu: MENU_ITEMS,
    deals: DEALS,
    slides: SLIDES,
    discounts: DISCOUNT_CODES,
    expenses: SEED_EXPENSES,
    suppliers: SEED_SUPPLIERS,
    businesses: SEED_BUSINESSES,
    restaurant: RESTAURANT,
    deliveryRules: DELIVERY_RULES,
    offerBanner: OFFER_BANNER,
  }

  // Applies a public payload to state. Kept separate so both the initial load
  // and the post-seed reload go through exactly the same path.
  const applyPublic = useCallback((data) => {
    setMenu(initMenu(data.menu))
    setDeals(data.deals)
    setSlides(data.slides)
    setDiscounts(data.discounts)
    if (data.settings.restaurant) setRestaurant(migrateRestaurant(data.settings.restaurant))
    if (data.settings.delivery_rules)
      setDeliveryRules((r) => ({ ...r, ...data.settings.delivery_rules }))
    if (data.settings.offer_banner) setOfferBanner(data.settings.offer_banner)
  }, [])

  // ---- Load the public catalogue on mount ---------------------------------
  // localStorage above gives an instant first paint from the last session; this
  // then pulls the authoritative catalogue from Supabase so every device sees
  // the same menu, prices, delivery charges and shop settings.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchPublic()
        if (cancelled) return
        applyPublic(data)
      } catch (e) {
        console.error('[store] Supabase load failed — running on local cache:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applyPublic])

  // ---- Load admin data once signed in -------------------------------------
  // Orders, finances and contact messages are admin-only under RLS, so they can
  // only be fetched with an admin session — and are dropped again on logout.
  useEffect(() => {
    if (!isAdmin) {
      setOrders([])
      setExpenses([])
      setSuppliers([])
      setBusinesses([])
      setMessages([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        let [pub, data] = await Promise.all([fetchPublic(), fetchAdmin()])
        // First run of a fresh project: only an admin can write, so this is
        // where the demo content gets seeded (exactly once, ever — guarded by
        // the `seeded` settings flag).
        if (await seedIfEmpty({ ...pub, ...data }, SEEDS)) {
          ;[pub, data] = await Promise.all([fetchPublic(), fetchAdmin()])
          if (cancelled) return
          applyPublic(pub)
        }
        if (cancelled) return
        setOrders(data.orders)
        setExpenses(data.expenses)
        setSuppliers(data.suppliers)
        setBusinesses(data.businesses)
        setMessages(data.messages)
      } catch (e) {
        console.error('[store] admin data load failed:', e)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, applyPublic])

  // ---- Menu CRUD ----------------------------------------------------------
  const addMenuItem = useCallback((item) => {
    const record = { ...item, id: genId('m') }
    setMenu((m) => [record, ...m])
    save(db.menu.upsert(record))
  }, [])
  const updateMenuItem = useCallback((id, patch) => {
    setMenu((m) => m.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    save(db.menu.upsert({ id, ...patch }))
  }, [])
  const deleteMenuItem = useCallback((id) => {
    setMenu((m) => m.filter((it) => it.id !== id))
    save(db.menu.remove(id))
  }, [])

  // ---- Deals CRUD ---------------------------------------------------------
  const addDeal = useCallback((deal) => {
    const record = { ...deal, id: genId('d') }
    setDeals((d) => [record, ...d])
    save(db.deals.upsert(record))
  }, [])
  const updateDeal = useCallback((id, patch) => {
    setDeals((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    save(db.deals.upsert({ id, ...patch }))
  }, [])
  const deleteDeal = useCallback((id) => {
    setDeals((d) => d.filter((x) => x.id !== id))
    save(db.deals.remove(id))
  }, [])

  // ---- Slider CRUD --------------------------------------------------------
  const addSlide = useCallback((slide) => {
    const record = { ...slide, id: genId('s') }
    setSlides((s) => [...s, record])
    save(db.slides.upsert(record))
  }, [])
  const updateSlide = useCallback((id, patch) => {
    setSlides((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    save(db.slides.upsert({ id, ...patch }))
  }, [])
  const deleteSlide = useCallback((id) => {
    setSlides((s) => s.filter((x) => x.id !== id))
    save(db.slides.remove(id))
  }, [])

  // ---- Discount codes -----------------------------------------------------
  const addDiscount = useCallback((code) => {
    setDiscounts((d) => [...d, code])
    save(db.discounts.upsert(code))
  }, [])
  const deleteDiscount = useCallback((code) => {
    setDiscounts((d) => d.filter((x) => x.code !== code))
    save(db.discounts.remove(code))
  }, [])
  const findDiscount = useCallback(
    (code) => discounts.find((d) => d.code.toLowerCase() === String(code).trim().toLowerCase()),
    [discounts],
  )

  // ---- Delivery fee calculation ------------------------------------------
  const calcDeliveryFee = useCallback(
    (subtotal, orderType = 'Delivery', distanceKm = 0, areaId = null) => {
      if (orderType !== 'Delivery') return 0
      if (subtotal <= 0) return 0

      // Area/zone-based charging: each place has its own charge, and it ALWAYS
      // applies (no free-delivery threshold) — the picked area's charge is
      // simply added to the total.
      if (deliveryRules.mode === 'zone') {
        const areas = deliveryRules.areas
        if (areas?.length && areaId) {
          const area = areas.find((a) => a.id === areaId)
          if (area) return Number(area.charge) || 0
        }
        return deliveryRules.charge
      }

      // Free-delivery threshold (applies to distance / order-total modes only).
      if (deliveryRules.freeAbove && subtotal >= deliveryRules.freeAbove) return 0

      // Distance-based charging.
      if (deliveryRules.mode === 'distance') {
        const km = Number(distanceKm) || 0
        const tiers = deliveryRules.distanceTiers
        if (tiers?.length) {
          const tier = tiers.find((t) => km <= t.uptoKm)
          if (tier) return tier.charge
          return deliveryRules.distanceBeyond ?? deliveryRules.charge
        }
        return deliveryRules.charge
      }

      // Order-total based charging.
      if (deliveryRules.tiers?.length) {
        const tier = deliveryRules.tiers.find((t) => subtotal < t.upTo)
        if (tier) return tier.charge
      }
      return deliveryRules.charge
    },
    [deliveryRules],
  )

  // ---- Orders -------------------------------------------------------------
  // Goes through the place_order RPC: the order number is assigned server-side
  // and the row is written before we resolve, so an order is never "placed"
  // locally without landing in the database. Throws if the write fails.
  const placeOrder = useCallback(async (order) => {
    const record = await db.orders.place(order)
    setOrders((o) => [record, ...o])
    rememberMyOrder(record)
    return record
  }, [])
  // Public status lookup for the tracking page (no customer details exposed).
  const trackOrder = useCallback((id) => db.orders.track(id), [])
  const updateOrderStatus = useCallback((id, status) => {
    setOrders((o) => o.map((ord) => (ord.id === id ? { ...ord, status } : ord)))
    save(db.orders.upsert({ id, status }))
  }, [])
  const deleteOrder = useCallback((id) => {
    setOrders((o) => o.filter((ord) => ord.id !== id))
    save(db.orders.remove(id))
  }, [])
  // Admins match against the loaded order list; a customer only ever has their
  // own just-placed orders (kept in sessionStorage) — enough for the
  // confirmation page to survive a refresh without exposing anyone else's.
  const findOrder = useCallback(
    (id) => {
      const key = String(id).trim().toLowerCase()
      return orders.find((o) => o.id.toLowerCase() === key) || readMyOrder(key)
    },
    [orders],
  )

  // ---- Restaurant settings ------------------------------------------------
  const toggleOpen = useCallback(() => {
    const next = { ...restaurant, isOpen: !restaurant.isOpen }
    setRestaurant(next)
    save(db.settings.set('restaurant', next))
  }, [restaurant])
  const updateRestaurant = useCallback(
    (patch) => {
      const next = { ...restaurant, ...patch }
      setRestaurant(next)
      save(db.settings.set('restaurant', next))
    },
    [restaurant],
  )

  // Delivery rules + offer banner are edited as whole objects in admin; wrap
  // the raw setters so each save also lands in Supabase.
  const saveDeliveryRules = useCallback((rules) => {
    setDeliveryRules(rules)
    save(db.settings.set('delivery_rules', rules))
  }, [])
  const saveOfferBanner = useCallback((banner) => {
    setOfferBanner(banner)
    save(db.settings.set('offer_banner', banner))
  }, [])

  // ---- Contact messages ---------------------------------------------------
  // Sending is open to any visitor (insert-only policy); reading and managing
  // requires an admin session, so those go through the optimistic `save` path.
  const sendMessage = useCallback((msg) => db.messages.send(msg), [])
  const setMessageRead = useCallback((id, read = true) => {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, read } : m)))
    save(db.messages.setRead(id, read))
  }, [])
  const deleteMessage = useCallback((id) => {
    setMessages((list) => list.filter((m) => m.id !== id))
    save(db.messages.remove(id))
  }, [])

  // ---- Expenses -----------------------------------------------------------
  const addExpense = useCallback((exp) => {
    const record = { ...exp, id: genId('exp'), amount: Number(exp.amount) || 0 }
    setExpenses((e) => [record, ...e])
    save(db.expenses.upsert(record))
  }, [])
  const updateExpense = useCallback((id, patch) => {
    setExpenses((e) =>
      e.map((x) =>
        x.id === id ? { ...x, ...patch, amount: Number(patch.amount ?? x.amount) || 0 } : x,
      ),
    )
    const amountPatch =
      patch.amount !== undefined ? { amount: Number(patch.amount) || 0 } : {}
    save(db.expenses.upsert({ id, ...patch, ...amountPatch }))
  }, [])
  const deleteExpense = useCallback((id) => {
    setExpenses((e) => e.filter((x) => x.id !== id))
    save(db.expenses.remove(id))
  }, [])

  // ---- Suppliers ----------------------------------------------------------
  const addSupplier = useCallback((s) => {
    const record = {
      ...s,
      id: genId('sup'),
      openingBalance: Number(s.openingBalance) || 0,
      createdAt: new Date().toISOString(),
      ledger: [],
    }
    setSuppliers((list) => [record, ...list])
    save(db.suppliers.upsert(record))
    return record
  }, [])
  const updateSupplier = useCallback((id, patch) => {
    setSuppliers((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    save(db.suppliers.upsert({ id, ...patch }))
  }, [])
  const deleteSupplier = useCallback((id) => {
    setSuppliers((list) => list.filter((s) => s.id !== id))
    save(db.suppliers.remove(id))
  }, [])
  // Add a ledger entry (type: 'purchase' = udhaar liya, 'payment' = paisay diye).
  // The ledger is a JSONB column, so we persist the whole supplier row.
  const addSupplierTxn = useCallback(
    (supplierId, txn) => {
      const entry = { ...txn, id: genId('txn'), amount: Number(txn.amount) || 0 }
      setSuppliers((list) =>
        list.map((s) => (s.id === supplierId ? { ...s, ledger: [...s.ledger, entry] } : s)),
      )
      const s = suppliers.find((x) => x.id === supplierId)
      if (s) save(db.suppliers.upsert({ id: supplierId, ledger: [...s.ledger, entry] }))
      return entry
    },
    [suppliers],
  )
  const deleteSupplierTxn = useCallback(
    (supplierId, txnId) => {
      setSuppliers((list) =>
        list.map((s) =>
          s.id === supplierId ? { ...s, ledger: s.ledger.filter((t) => t.id !== txnId) } : s,
        ),
      )
      const s = suppliers.find((x) => x.id === supplierId)
      if (s) save(db.suppliers.upsert({ id: supplierId, ledger: s.ledger.filter((t) => t.id !== txnId) }))
    },
    [suppliers],
  )
  // Current outstanding balance for a supplier (positive = we owe them).
  const supplierBalance = useCallback((s) => {
    if (!s) return 0
    return s.ledger.reduce(
      (bal, t) => (t.type === 'payment' ? bal - Number(t.amount || 0) : bal + Number(t.amount || 0)),
      Number(s.openingBalance) || 0,
    )
  }, [])

  // ---- Business accounts (profit/loss per venture) ------------------------
  const addBusiness = useCallback((b) => {
    const record = { ...b, id: genId('biz'), createdAt: new Date().toISOString(), entries: [] }
    setBusinesses((list) => [record, ...list])
    save(db.businesses.upsert(record))
    return record
  }, [])
  const updateBusiness = useCallback((id, patch) => {
    setBusinesses((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    save(db.businesses.upsert({ id, ...patch }))
  }, [])
  const deleteBusiness = useCallback((id) => {
    setBusinesses((list) => list.filter((b) => b.id !== id))
    save(db.businesses.remove(id))
  }, [])
  // Add an income/expense entry to a business ledger (entries is a JSONB column).
  const addBusinessEntry = useCallback(
    (businessId, entry) => {
      const rec = { ...entry, id: genId('be'), amount: Number(entry.amount) || 0 }
      setBusinesses((list) =>
        list.map((b) => (b.id === businessId ? { ...b, entries: [...b.entries, rec] } : b)),
      )
      const b = businesses.find((x) => x.id === businessId)
      if (b) save(db.businesses.upsert({ id: businessId, entries: [...b.entries, rec] }))
      return rec
    },
    [businesses],
  )
  const deleteBusinessEntry = useCallback(
    (businessId, entryId) => {
      setBusinesses((list) =>
        list.map((b) =>
          b.id === businessId ? { ...b, entries: b.entries.filter((e) => e.id !== entryId) } : b,
        ),
      )
      const b = businesses.find((x) => x.id === businessId)
      if (b)
        save(db.businesses.upsert({ id: businessId, entries: b.entries.filter((e) => e.id !== entryId) }))
    },
    [businesses],
  )
  // Totals for a business: { income, expense, net }.
  const businessTotals = useCallback((b) => {
    if (!b) return { income: 0, expense: 0, net: 0 }
    const income = b.entries
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    const expense = b.entries
      .filter((e) => e.type === 'expense')
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    return { income, expense, net: income - expense }
  }, [])

  const value = useMemo(
    () => ({
      categories: CATEGORIES,
      orderStatuses: ORDER_STATUSES,
      menu,
      deals,
      slides,
      orders,
      discounts,
      deliveryRules,
      restaurant,
      offerBanner,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addDeal,
      updateDeal,
      deleteDeal,
      addSlide,
      updateSlide,
      deleteSlide,
      addDiscount,
      deleteDiscount,
      findDiscount,
      calcDeliveryFee,
      placeOrder,
      trackOrder,
      updateOrderStatus,
      deleteOrder,
      findOrder,
      messages,
      sendMessage,
      setMessageRead,
      deleteMessage,
      setDeliveryRules: saveDeliveryRules,
      setOfferBanner: saveOfferBanner,
      toggleOpen,
      updateRestaurant,
      expenses,
      suppliers,
      businesses,
      expenseCategories: EXPENSE_CATEGORIES,
      incomeCategories: INCOME_CATEGORIES,
      addExpense,
      updateExpense,
      deleteExpense,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addSupplierTxn,
      deleteSupplierTxn,
      supplierBalance,
      addBusiness,
      updateBusiness,
      deleteBusiness,
      addBusinessEntry,
      deleteBusinessEntry,
      businessTotals,
    }),
    [
      menu,
      deals,
      slides,
      orders,
      discounts,
      deliveryRules,
      restaurant,
      offerBanner,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addDeal,
      updateDeal,
      deleteDeal,
      addSlide,
      updateSlide,
      deleteSlide,
      addDiscount,
      deleteDiscount,
      findDiscount,
      calcDeliveryFee,
      placeOrder,
      trackOrder,
      updateOrderStatus,
      deleteOrder,
      findOrder,
      messages,
      sendMessage,
      setMessageRead,
      deleteMessage,
      toggleOpen,
      updateRestaurant,
      expenses,
      suppliers,
      businesses,
      addExpense,
      updateExpense,
      deleteExpense,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addSupplierTxn,
      deleteSupplierTxn,
      supplierBalance,
      addBusiness,
      updateBusiness,
      deleteBusiness,
      addBusinessEntry,
      deleteBusinessEntry,
      businessTotals,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
