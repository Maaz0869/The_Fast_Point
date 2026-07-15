import { rs } from './format.js'

// Build a click-to-chat WhatsApp link with a pre-filled message.
export const buildWhatsappLink = (phone, message) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

// Compose a nicely formatted order message from cart contents + totals.
export const buildOrderMessage = ({ items, orderType, customer, subtotal, deliveryFee, discount, total }) => {
  const lines = ['*New Order — The Snack Hut* 🍔', '']
  items.forEach((l) => {
    lines.push(`• ${l.qty}× ${l.name} — ${rs(l.unitPrice * l.qty)}`)
    if (l.extras?.length) lines.push(`   + ${l.extras.map((e) => e.name).join(', ')}`)
    if (l.spiceLabel) lines.push(`   Spice: ${l.spiceLabel}`)
  })
  lines.push('')
  lines.push(`Order type: ${orderType}`)
  if (customer?.name) lines.push(`Name: ${customer.name}`)
  if (customer?.phone) lines.push(`Phone: ${customer.phone}`)
  if (customer?.address) lines.push(`Address: ${customer.address}`)
  lines.push('')
  lines.push(`Subtotal: ${rs(subtotal)}`)
  if (discount) lines.push(`Discount: -${rs(discount)}`)
  if (deliveryFee) lines.push(`Delivery: ${rs(deliveryFee)}`)
  lines.push(`*Total: ${rs(total)}*`)
  return lines.join('\n')
}
