import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES,
  DEALS,
  DELIVERY_RULES,
  DISCOUNT_CODES,
  MENU_ITEMS,
  OFFER_BANNER,
  ORDER_STATUSES,
  RESTAURANT,
  SEED_ORDERS,
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

export function StoreProvider({ children }) {
  const saved = loadSaved()

  const [menu, setMenu] = useState(saved?.menu ?? MENU_ITEMS)
  const [deals, setDeals] = useState(saved?.deals ?? DEALS)
  const [slides, setSlides] = useState(saved?.slides ?? SLIDES)
  const [orders, setOrders] = useState(saved?.orders ?? SEED_ORDERS)
  const [discounts, setDiscounts] = useState(saved?.discounts ?? DISCOUNT_CODES)
  const [deliveryRules, setDeliveryRules] = useState(saved?.deliveryRules ?? DELIVERY_RULES)
  const [restaurant, setRestaurant] = useState(saved?.restaurant ?? RESTAURANT)
  const [offerBanner, setOfferBanner] = useState(saved?.offerBanner ?? OFFER_BANNER)
  const [orderCounter, setOrderCounter] = useState(saved?.orderCounter ?? 1044)

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
        }),
      )
    } catch {
      /* storage unavailable or over quota — keep running in-memory */
    }
  }, [menu, deals, slides, orders, discounts, deliveryRules, restaurant, offerBanner, orderCounter])

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
    (subtotal, orderType = 'Delivery') => {
      if (orderType !== 'Delivery') return 0
      if (subtotal <= 0) return 0
      if (subtotal >= deliveryRules.freeAbove) return 0
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
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
