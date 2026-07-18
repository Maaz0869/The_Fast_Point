import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// CartContext manages the shopping cart. Each line item carries its base item
// plus chosen extras + spice level, and a pre-computed unit price so quantity
// maths stays simple. The cart is persisted to localStorage so it survives a
// page refresh or WhatsApp/tab switch during checkout.
// ---------------------------------------------------------------------------

const CartContext = createContext(null)

export const useCart = () => useContext(CartContext)

const CART_KEY = 'snackhut_cart_v1'

const loadCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const lineId = () => Math.random().toString(36).slice(2, 10)

// Two lines are "the same" if the underlying item, extras and spice match, so
// re-adding an identical config just bumps the quantity.
const sameConfig = (a, b) =>
  a.itemId === b.itemId &&
  a.sizeId === b.sizeId &&
  a.spice === b.spice &&
  a.extras.map((e) => e.id).sort().join(',') === b.extras.map((e) => e.id).sort().join(',')

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  // Persist on every change (wrapped so storage quota/privacy mode can't crash).
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable — cart stays in-memory */
    }
  }, [items])

  const addItem = useCallback((config) => {
    // config: { itemId, name, image, basePrice, extras:[{id,name,price}], spice, spiceLabel, unitPrice, qty }
    setItems((prev) => {
      const existing = prev.find((l) => sameConfig(l, config))
      if (existing) {
        return prev.map((l) =>
          l.id === existing.id ? { ...l, qty: l.qty + (config.qty || 1) } : l,
        )
      }
      return [...prev, { ...config, id: lineId(), qty: config.qty || 1 }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.reduce((n, l) => n + l.qty, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),
    [items],
  )

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQty, clearCart, count, subtotal }),
    [items, addItem, removeItem, setQty, clearCart, count, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
