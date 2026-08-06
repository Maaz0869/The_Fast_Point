// Order status pill, shared by the admin screens and the customer's account
// pages so a status never looks different depending on who is looking at it.
const STYLES = {
  Pending: 'bg-gray-100 text-gray-600',
  Preparing: 'bg-amber-100 text-amber-700',
  'Out for Delivery': 'bg-blue-100 text-blue-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
}

export default function StatusBadge({ status }) {
  return <span className={`chip ${STYLES[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}
