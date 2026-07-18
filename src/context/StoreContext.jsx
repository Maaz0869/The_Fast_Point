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
  SEED_ORDERS,
  SEED_SUPPLIERS,
  SLIDES,
} from '../data/mockData.js'
import { db, fetchAll, seedIfEmpty } from '../lib/db.js'

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
// State is persisted to localStorage so orders and admin changes survive page
// refreshes and show up in the admin panel (on the same browser/device). Seed
// data is only used the first time, before anything is saved.
// ---------------------------------------------------------------------------

const StoreContext = createContext(null)

export const useStore = () => useContext(StoreContext)

const genId = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 8)}`

// Bump the version suffix if the saved shape ever changes incompatibly.
const STORAGE_KEY = 'snackhut_store_v1'

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
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

export function StoreProvider({ children }) {
  // Read localStorage exactly once (not on every render). Each useState reads
  // this the first time it mounts and never again.
  const saved = useRef(loadSaved()).current

  const [menu, setMenu] = useState(() => initMenu(arr(saved?.menu, MENU_ITEMS)))
  const [deals, setDeals] = useState(() => arr(saved?.deals, DEALS))
  const [slides, setSlides] = useState(() => arr(saved?.slides, SLIDES))
  const [orders, setOrders] = useState(() => arr(saved?.orders, SEED_ORDERS))
  const [discounts, setDiscounts] = useState(() => arr(saved?.discounts, DISCOUNT_CODES))
  // Merge so any saved rules that predate the distance fields still get them.
  const [deliveryRules, setDeliveryRules] = useState(() => ({
    ...DELIVERY_RULES,
    ...(saved?.deliveryRules && typeof saved.deliveryRules === 'object' ? saved.deliveryRules : {}),
  }))
  const [restaurant, setRestaurant] = useState(() =>
    applyLocationMigration(saved?.restaurant ?? RESTAURANT),
  )
  const [offerBanner, setOfferBanner] = useState(() => saved?.offerBanner ?? OFFER_BANNER)
  const [orderCounter, setOrderCounter] = useState(() =>
    Number.isFinite(saved?.orderCounter) ? saved.orderCounter : 1044,
  )
  const [expenses, setExpenses] = useState(() => arr(saved?.expenses, SEED_EXPENSES))
  const [suppliers, setSuppliers] = useState(() => arr(saved?.suppliers, SEED_SUPPLIERS))
  const [businesses, setBusinesses] = useState(() => arr(saved?.businesses, SEED_BUSINESSES))

  // Persist everything whenever it changes. Wrapped in try/catch so a full
  // storage quota (e.g. many large uploaded images) never crashes the app.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          menu,
          deals,
          slides,
          orders,
          discounts,
          deliveryRules,
          restaurant,
          offerBanner,
          orderCounter,
          expenses,
          suppliers,
          businesses,
        }),
      )
    } catch {
      /* storage unavailable or over quota — keep running in-memory */
    }
  }, [
    menu,
    deals,
    slides,
    orders,
    discounts,
    deliveryRules,
    restaurant,
    offerBanner,
    orderCounter,
    expenses,
    suppliers,
    businesses,
  ])

  // ---- Load from Supabase on mount ---------------------------------------
  // localStorage above gives an instant first paint from the last session;
  // this then pulls the authoritative data from Supabase (seeding it on the
  // very first run) so admin changes and orders are shared across devices.
  useEffect(() => {
    let cancelled = false
    const seeds = {
      menu: MENU_ITEMS,
      deals: DEALS,
      slides: SLIDES,
      discounts: DISCOUNT_CODES,
      orders: SEED_ORDERS,
      expenses: SEED_EXPENSES,
      suppliers: SEED_SUPPLIERS,
      businesses: SEED_BUSINESSES,
      restaurant: RESTAURANT,
      deliveryRules: DELIVERY_RULES,
      offerBanner: OFFER_BANNER,
      orderCounter: 1044,
    }
    ;(async () => {
      try {
        let data = await fetchAll()
        const didSeed = await seedIfEmpty(data, seeds)
        if (didSeed) data = await fetchAll()
        if (cancelled) return
        setMenu(initMenu(data.menu))
        setDeals(data.deals)
        setSlides(data.slides)
        setOrders(data.orders)
        setDiscounts(data.discounts)
        setExpenses(data.expenses)
        setSuppliers(data.suppliers)
        setBusinesses(data.businesses)
        if (data.settings.restaurant)
          setRestaurant(applyLocationMigration(data.settings.restaurant))
        if (data.settings.delivery_rules)
          setDeliveryRules((r) => ({ ...r, ...data.settings.delivery_rules }))
        if (data.settings.offer_banner) setOfferBanner(data.settings.offer_banner)
        if (Number.isFinite(data.settings.order_counter))
          setOrderCounter(data.settings.order_counter)
      } catch (e) {
        console.error('[store] Supabase load failed — running on local cache:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
  const placeOrder = useCallback(
    (order) => {
      const id = `SH-${orderCounter}`
      const nextCounter = orderCounter + 1
      const record = {
        ...order,
        id,
        createdAt: new Date().toISOString(),
        status: 'Pending',
      }
      setOrderCounter(nextCounter)
      setOrders((o) => [record, ...o])
      save(db.orders.upsert(record))
      save(db.settings.set('order_counter', nextCounter))
      return record
    },
    [orderCounter],
  )
  const updateOrderStatus = useCallback((id, status) => {
    setOrders((o) => o.map((ord) => (ord.id === id ? { ...ord, status } : ord)))
    save(db.orders.upsert({ id, status }))
  }, [])
  const findOrder = useCallback(
    (id) => orders.find((o) => o.id.toLowerCase() === String(id).trim().toLowerCase()),
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
      updateOrderStatus,
      findOrder,
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
      updateOrderStatus,
      findOrder,
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
