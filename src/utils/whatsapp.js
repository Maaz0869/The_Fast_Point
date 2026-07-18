import { rs } from './format.js'

// Build a click-to-chat WhatsApp link with a pre-filled message.
export const buildWhatsappLink = (phone, message) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

// Send a message straight to the shop's WhatsApp via CallMeBot — no backend
// and no action from the customer. Requires a one-time API key (tied to the
// shop's own number) configured in Admin → Settings.
// `mode: 'no-cors'` lets the request go through from the browser (we can't read
// the response, but the message is delivered).
export const sendOrderToWhatsapp = (phone, apiKey, message) => {
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`
  return fetch(url, { mode: 'no-cors' })
}

// Compose a nicely formatted order message from cart contents + totals.
export const buildOrderMessage = ({
  items,
  orderType,
  customer,
  subtotal,
  deliveryFee,
  discount,
  total,
  payment,
  orderId,
  shopName = 'The Snack Hut',
}) => {
  const lines = [`*New Order — ${shopName}* 🍔`, '']
  if (orderId) lines.push(`Order #: ${orderId}`, '')
  items.forEach((l) => {
    lines.push(`• ${l.qty}× ${l.name} — ${rs(l.unitPrice * l.qty)}`)
    if (l.extras?.length) lines.push(`   + ${l.extras.map((e) => e.name).join(', ')}`)
    if (l.spiceLabel) lines.push(`   Spice: ${l.spiceLabel}`)
  })
  lines.push('')
  lines.push(`Order type: ${orderType}`)
  if (payment) lines.push(`Payment: ${payment}`)
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
