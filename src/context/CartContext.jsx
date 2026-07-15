import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// CartContext manages the shopping cart. Each line item carries its base item
// plus chosen extras + spice level, and a pre-computed unit price so quantity
// maths stays simple.
// ---------------------------------------------------------------------------

const CartContext = createContext(null)

export const useCart = () => useContext(CartContext)

const lineId = () => Math.random().toString(36).slice(2, 10)

// Two lines are "the same" if the underlying item, extras and spice match, so
// re-adding an identical config just bumps the quantity.
const sameConfig = (a, b) =>
  a.itemId === b.itemId &&
  a.spice === b.spice &&
  a.extras.map((e) => e.id).sort().join(',') === b.extras.map((e) => e.id).sort().join(',')

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

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
