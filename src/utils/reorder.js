import { SPICE_LEVELS } from '../data/mockData.js'
import { effectivePrice } from './format.js'

// ---------------------------------------------------------------------------
// Rebuild cart lines from a past order ("Order Again").
//
// Prices are taken from the *current* menu, never from the old order, so a
// customer is never charged last month's price. Items that have since been
// removed from the menu are reported back so the UI can say so.
// ---------------------------------------------------------------------------

// Orders placed before this feature don't carry the menu item id, so fall back
// to the name. Stored names can have the size and extras appended, e.g.
// "Chicken Tikka Pizza (Large) (Extra Cheese)" — hence the prefix match.
const matchByName = (menu, name) => {
  const clean = String(name || '')
    .replace(/\s*\([^()]*\)\s*$/, '')
    .trim()
    .toLowerCase()
  return (
    menu.find((m) => m.name.toLowerCase() === clean) ||
    menu.find((m) => clean.startsWith(m.name.toLowerCase()))
  )
}

export function reorderLines(order, menu) {
  const lines = []
  const missing = []

  for (const it of order?.items || []) {
    const base = (it.itemId && menu.find((m) => m.id === it.itemId)) || matchByName(menu, it.name)
    if (!base) {
      missing.push(it.name)
      continue
    }

    const size = it.sizeId && base.sizes ? base.sizes.find((s) => s.id === it.sizeId) : null
    const basePrice = size ? Number(size.price) || 0 : effectivePrice(base)
    const extras = Array.isArray(it.extras) ? it.extras : []
    const extrasTotal = extras.reduce((sum, e) => sum + (Number(e.price) || 0), 0)
    const spice = SPICE_LEVELS.find((s) => s.name === it.spiceLabel) || null

    lines.push({
      itemId: base.id,
      name: size ? `${base.name} (${size.name})` : base.name,
      image: base.image,
      basePrice,
      sizeId: size?.id ?? null,
      sizeLabel: size?.name,
      extras,
      spice: spice?.id ?? 'medium',
      spiceLabel: spice?.name,
      unitPrice: basePrice + extrasTotal + (spice?.price || 0),
      qty: Number(it.qty) || 1,
    })
  }

  return { lines, missing }
}
