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

  // ---- Menu CRUD ----------------------------------------------------------
  const addMenuItem = useCallback((item) => {
    setMenu((m) => [{ ...item, id: genId('m') }, ...m])
  }, [])
  const updateMenuItem = useCallback((id, patch) => {
    setMenu((m) => m.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])
  const deleteMenuItem = useCallback((id) => {
    setMenu((m) => m.filter((it) => it.id !== id))
  }, [])

  // ---- Deals CRUD ---------------------------------------------------------
  const addDeal = useCallback((deal) => setDeals((d) => [{ ...deal, id: genId('d') }, ...d]), [])
  const updateDeal = useCallback(
    (id, patch) => setDeals((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [],
  )
  const deleteDeal = useCallback((id) => setDeals((d) => d.filter((x) => x.id !== id)), [])

  // ---- Slider CRUD --------------------------------------------------------
  const addSlide = useCallback((slide) => setSlides((s) => [...s, { ...slide, id: genId('s') }]), [])
  const updateSlide = useCallback(
    (id, patch) => setSlides((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [],
  )
  const deleteSlide = useCallback((id) => setSlides((s) => s.filter((x) => x.id !== id)), [])

  // ---- Discount codes -----------------------------------------------------
  const addDiscount = useCallback((code) => setDiscounts((d) => [...d, code]), [])
  const deleteDiscount = useCallback(
    (code) => setDiscounts((d) => d.filter((x) => x.code !== code)),
    [],
  )
  const findDiscount = useCallback(
    (code) => discounts.find((d) => d.code.toLowerCase() === String(code).trim().toLowerCase()),
    [discounts],
  )

  // ---- Delivery fee calculation ------------------------------------------
  const calcDeliveryFee = useCallback(
    (subtotal, orderType = 'Delivery', distanceKm = 0) => {
      if (orderType !== 'Delivery') return 0
      if (subtotal <= 0) return 0
      // Free-delivery threshold overrides everything.
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
      setOrderCounter((c) => c + 1)
      const record = {
        ...order,
        id,
        createdAt: new Date().toISOString(),
        status: 'Pending',
      }
      setOrders((o) => [record, ...o])
      return record
    },
    [orderCounter],
  )
  const updateOrderStatus = useCallback((id, status) => {
    setOrders((o) => o.map((ord) => (ord.id === id ? { ...ord, status } : ord)))
  }, [])
  const findOrder = useCallback(
    (id) => orders.find((o) => o.id.toLowerCase() === String(id).trim().toLowerCase()),
    [orders],
  )

  // ---- Restaurant settings ------------------------------------------------
  const toggleOpen = useCallback(() => {
    setRestaurant((r) => ({ ...r, isOpen: !r.isOpen }))
  }, [])
  const updateRestaurant = useCallback((patch) => setRestaurant((r) => ({ ...r, ...patch })), [])

  // ---- Expenses -----------------------------------------------------------
  const addExpense = useCallback(
    (exp) => setExpenses((e) => [{ ...exp, id: genId('exp'), amount: Number(exp.amount) || 0 }, ...e]),
    [],
  )
  const updateExpense = useCallback(
    (id, patch) =>
      setExpenses((e) =>
        e.map((x) =>
          x.id === id ? { ...x, ...patch, amount: Number(patch.amount ?? x.amount) || 0 } : x,
        ),
      ),
    [],
  )
  const deleteExpense = useCallback((id) => setExpenses((e) => e.filter((x) => x.id !== id)), [])

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
    return record
  }, [])
  const updateSupplier = useCallback(
    (id, patch) => setSuppliers((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    [],
  )
  const deleteSupplier = useCallback(
    (id) => setSuppliers((list) => list.filter((s) => s.id !== id)),
    [],
  )
  // Add a ledger entry (type: 'purchase' = udhaar liya, 'payment' = paisay diye).
  const addSupplierTxn = useCallback((supplierId, txn) => {
    const entry = { ...txn, id: genId('txn'), amount: Number(txn.amount) || 0 }
    setSuppliers((list) =>
      list.map((s) => (s.id === supplierId ? { ...s, ledger: [...s.ledger, entry] } : s)),
    )
    return entry
  }, [])
  const deleteSupplierTxn = useCallback((supplierId, txnId) => {
    setSuppliers((list) =>
      list.map((s) =>
        s.id === supplierId ? { ...s, ledger: s.ledger.filter((t) => t.id !== txnId) } : s,
      ),
    )
  }, [])
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
    return record
  }, [])
  const updateBusiness = useCallback(
    (id, patch) => setBusinesses((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    [],
  )
  const deleteBusiness = useCallback(
    (id) => setBusinesses((list) => list.filter((b) => b.id !== id)),
    [],
  )
  // Add an income/expense entry to a business ledger.
  const addBusinessEntry = useCallback((businessId, entry) => {
    const rec = { ...entry, id: genId('be'), amount: Number(entry.amount) || 0 }
    setBusinesses((list) =>
      list.map((b) => (b.id === businessId ? { ...b, entries: [...b.entries, rec] } : b)),
    )
    return rec
  }, [])
  const deleteBusinessEntry = useCallback((businessId, entryId) => {
    setBusinesses((list) =>
      list.map((b) =>
        b.id === businessId ? { ...b, entries: b.entries.filter((e) => e.id !== entryId) } : b,
      ),
    )
  }, [])
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
      setDeliveryRules,
      setOfferBanner,
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
