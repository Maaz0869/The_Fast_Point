// ---------------------------------------------------------------------------
// Shared date-period filtering for reports (daily / weekly / monthly / custom).
// Works for any list — pass a getDate accessor returning a 'yyyy-mm-dd' string
// or an ISO datetime (only the date part is used).
// ---------------------------------------------------------------------------

// Local yyyy-mm-dd (avoids the UTC off-by-one that toISOString can cause).
export const isoLocal = (d) => d.toLocaleDateString('en-CA')
export const todayLocal = () => isoLocal(new Date())

export const fmtShort = (d) =>
  new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })

// Returns { items, label } for the chosen period.
export function filterByPeriod(items, getDate, period, custom) {
  // A plain 'yyyy-mm-dd' string is already a local calendar date — use as-is.
  // An ISO datetime (e.g. order.createdAt, stored in UTC) is converted to the
  // LOCAL date so post-midnight entries aren't bucketed into the previous day.
  const d10 = (it) => {
    const v = String(getDate(it))
    return v.includes('T') ? isoLocal(new Date(v)) : v.slice(0, 10)
  }
  const now = new Date()

  if (period === 'today') {
    const t = isoLocal(now)
    return { items: items.filter((it) => d10(it) === t), label: `Daily — ${fmtShort(t)}` }
  }
  if (period === 'week') {
    const dow = (now.getDay() + 6) % 7 // 0 = Monday
    const monday = new Date(now)
    monday.setDate(now.getDate() - dow)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const from = isoLocal(monday)
    const to = isoLocal(sunday)
    return {
      items: items.filter((it) => d10(it) >= from && d10(it) <= to),
      label: `Weekly — ${fmtShort(from)} to ${fmtShort(to)}`,
    }
  }
  if (period === 'month') {
    const ym = isoLocal(now).slice(0, 7)
    return {
      items: items.filter((it) => d10(it).startsWith(ym)),
      label: `Monthly — ${now.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}`,
    }
  }
  if (period === 'custom' && custom?.from && custom?.to) {
    return {
      items: items.filter((it) => d10(it) >= custom.from && d10(it) <= custom.to),
      label: `${fmtShort(custom.from)} to ${fmtShort(custom.to)}`,
    }
  }
  return { items, label: 'All Time' }
}
