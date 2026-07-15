// Currency formatting — everything is shown in PKR (Rs.).
export const rs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`

export const formatDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-PK', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso
  }
}
