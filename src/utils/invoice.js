// ---------------------------------------------------------------------------
// Builds a printable supplier account statement / invoice and opens it in a new
// window with the print dialog. From there the user can pick "Save as PDF" to
// download it. No external PDF library needed — works in every browser.
// ---------------------------------------------------------------------------

const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d || ''
  }
}

const fmtDateTime = (d) => {
  try {
    return new Date(d).toLocaleString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return d || ''
  }
}

// Opens a print window for the given HTML, then triggers the print dialog so
// the user can "Save as PDF". Shared by every invoice type.
function openPrintWindow(html) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('Please allow pop-ups to download the invoice.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

// Shared <style> + print button used by all invoices.
const INVOICE_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2430; margin: 0; padding: 36px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 3px solid #e8622a; padding-bottom: 18px; }
  .biz h1 { margin: 0; font-size: 22px; color: #e8622a; }
  .biz p { margin: 2px 0; font-size: 12px; color: #555; }
  .doc { text-align: right; }
  .doc h2 { margin: 0; font-size: 26px; letter-spacing: 1px; color: #1f2430; }
  .doc p { margin: 2px 0; font-size: 12px; color: #555; }
  .parties { margin: 24px 0; }
  .parties .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; }
  .parties .name { font-size: 16px; font-weight: 700; margin: 3px 0; }
  .parties p { margin: 1px 0; font-size: 12px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1f2430; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; padding: 9px 10px; text-align: left; }
  th.num, td.num { text-align: right; }
  th.mid, td.mid { text-align: center; }
  td { padding: 9px 10px; font-size: 13px; border-bottom: 1px solid #eee; }
  .ref { display: block; font-size: 10px; color: #999; }
  tfoot td { font-weight: 700; border-top: 2px solid #1f2430; border-bottom: none; }
  .summary { margin-top: 22px; margin-left: auto; width: 300px; font-size: 13px; }
  .summary div { display: flex; justify-content: space-between; padding: 5px 0; }
  .summary .bal { font-size: 17px; font-weight: 800; border-top: 2px solid #1f2430; margin-top: 6px; padding-top: 10px; }
  .chip { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: #fdece4; color: #e8622a; }
  .note { margin-top: 34px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 12px; } .noprint { display: none; } }
  .noprint { text-align: center; margin-bottom: 20px; }
  .btn { background: #e8622a; color: #fff; border: 0; padding: 10px 22px; border-radius: 8px; font-size: 14px; cursor: pointer; }
`

const printButton = `
  <div class="noprint">
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>`

const autoPrint = `
  <script>
    window.onload = function () { setTimeout(function () { window.print(); }, 350); };
  </script>`

const bizBlock = (restaurant) => `
    <div class="biz">
      <h1>${esc(restaurant.name)}</h1>
      ${restaurant.address ? `<p>${esc(restaurant.address)}</p>` : ''}
      ${restaurant.phone ? `<p>Ph: ${esc(restaurant.phone)}</p>` : ''}
      ${restaurant.email ? `<p>${esc(restaurant.email)}</p>` : ''}
    </div>`

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// supplier: { name, company, phone, address, openingBalance, ledger[] }
// restaurant: { name, address, phone, email }
// balance: current outstanding amount (positive = we owe the supplier)
export function printSupplierInvoice(supplier, restaurant, balance) {
  const rows = [...supplier.ledger].sort((a, b) => new Date(a.date) - new Date(b.date))

  const totalPurchases = rows
    .filter((t) => t.type === 'purchase')
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalPayments = rows
    .filter((t) => t.type === 'payment')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const ledgerRows =
    rows.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#888;padding:18px">No transactions yet.</td></tr>`
      : rows
          .map(
            (t) => `
        <tr>
          <td>${fmtDate(t.date)}</td>
          <td>${esc(t.description) || (t.type === 'payment' ? 'Payment' : 'Purchase')}${
            t.invoiceNo ? `<span class="ref">Inv# ${esc(t.invoiceNo)}</span>` : ''
          }</td>
          <td class="num">${t.type === 'purchase' ? money(t.amount) : '—'}</td>
          <td class="num">${t.type === 'payment' ? money(t.amount) : '—'}</td>
        </tr>`,
          )
          .join('')

  const owed = balance >= 0
  const invoiceNo = `STMT-${(supplier.id || '').replace(/\D/g, '').slice(-6) || '000000'}`

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Statement - ${esc(supplier.name)}</title>
<style>${INVOICE_STYLE}
  .summary .bal { color: ${owed ? '#c0392b' : '#1e8449'}; }
</style>
</head>
<body>
  ${printButton}

  <div class="top">
    ${bizBlock(restaurant)}
    <div class="doc">
      <h2>STATEMENT</h2>
      <p>#${invoiceNo}</p>
      <p>Date: ${fmtDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="parties">
    <div class="lbl">Supplier</div>
    <div class="name">${esc(supplier.name)}</div>
    ${supplier.company ? `<p>${esc(supplier.company)}</p>` : ''}
    ${supplier.phone ? `<p>Ph: ${esc(supplier.phone)}</p>` : ''}
    ${supplier.address ? `<p>${esc(supplier.address)}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:110px">Date</th>
        <th>Description</th>
        <th class="num">Purchase (Udhaar)</th>
        <th class="num">Payment</th>
      </tr>
    </thead>
    <tbody>
      ${ledgerRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Totals</td>
        <td class="num">${money(totalPurchases)}</td>
        <td class="num">${money(totalPayments)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="summary">
    <div><span>Opening Balance</span><span>${money(supplier.openingBalance)}</span></div>
    <div><span>Total Purchases</span><span>${money(totalPurchases)}</span></div>
    <div><span>Total Payments</span><span>− ${money(totalPayments)}</span></div>
    <div class="bal">
      <span>${owed ? 'Balance Due' : 'Advance / Credit'}</span>
      <span>${money(Math.abs(balance))}</span>
    </div>
  </div>

  <p class="note">This is a computer-generated statement — ${esc(restaurant.name)}.</p>
  ${autoPrint}
</body>
</html>`

  openPrintWindow(html)
}

// ---------------------------------------------------------------------------
// Customer order invoice / receipt.
// order: { id, createdAt, orderType, customer{name,phone,address}, items[],
//          subtotal, deliveryFee, discount, total, payment, status }
// ---------------------------------------------------------------------------
export function printOrderInvoice(order, restaurant) {
  const itemRows = order.items
    .map(
      (it, i) => `
        <tr>
          <td class="mid">${i + 1}</td>
          <td>${esc(it.name)}</td>
          <td class="mid">${it.qty}</td>
          <td class="num">${money(it.price)}</td>
          <td class="num">${money(it.lineTotal)}</td>
        </tr>`,
    )
    .join('')

  const isDelivery = order.orderType === 'Delivery'

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice - ${esc(order.id)}</title>
<style>${INVOICE_STYLE}
  .summary .bal { color: #e8622a; }
</style>
</head>
<body>
  ${printButton}

  <div class="top">
    ${bizBlock(restaurant)}
    <div class="doc">
      <h2>INVOICE</h2>
      <p>#${esc(order.id)}</p>
      <p>${fmtDateTime(order.createdAt)}</p>
      <p><span class="chip">${esc(order.status)}</span></p>
    </div>
  </div>

  <div class="parties">
    <div class="lbl">Billed To</div>
    <div class="name">${esc(order.customer?.name) || 'Walk-in Customer'}</div>
    ${order.customer?.phone ? `<p>Ph: ${esc(order.customer.phone)}</p>` : ''}
    ${order.customer?.address ? `<p>${esc(order.customer.address)}</p>` : ''}
    <p>Order Type: ${esc(order.orderType)} &nbsp;·&nbsp; Payment: ${esc(order.payment)}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th class="mid" style="width:40px">#</th>
        <th>Item</th>
        <th class="mid" style="width:60px">Qty</th>
        <th class="num" style="width:110px">Price</th>
        <th class="num" style="width:120px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="summary">
    <div><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
    ${order.discount > 0 ? `<div><span>Discount</span><span>− ${money(order.discount)}</span></div>` : ''}
    ${isDelivery ? `<div><span>Delivery Fee</span><span>${order.deliveryFee === 0 ? 'Free' : money(order.deliveryFee)}</span></div>` : ''}
    <div class="bal">
      <span>Grand Total</span>
      <span>${money(order.total)}</span>
    </div>
  </div>

  <p class="note">Thank you for your order! — ${esc(restaurant.name)}</p>
  ${autoPrint}
</body>
</html>`

  openPrintWindow(html)
}

// ---------------------------------------------------------------------------
// Business profit/loss report with a day-by-day breakdown.
// business: { name, note }
// entries: the (already period-filtered) list of {date,type,amount} rows
// periodLabel: e.g. "Daily — 16 Jul 2026" or "Weekly — 14–20 Jul 2026"
// ---------------------------------------------------------------------------
export function printBusinessReport(business, restaurant, entries, periodLabel = 'All Time') {
  // Group entries by date so each day lists its individual transactions
  // (with description) followed by a day subtotal.
  const byDay = {}
  entries.forEach((e) => {
    const d = e.date || ''
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(e)
  })
  const days = Object.keys(byDay).sort((a, b) => new Date(b) - new Date(a))

  // Totals computed from the filtered entries.
  const totals = entries.reduce(
    (acc, e) => {
      if (e.type === 'income') acc.income += Number(e.amount || 0)
      else acc.expense += Number(e.amount || 0)
      return acc
    },
    { income: 0, expense: 0 },
  )
  totals.net = totals.income - totals.expense

  const detail = (e) => {
    const cat = esc(e.category) || (e.type === 'income' ? 'Income' : 'Expense')
    const desc = esc(e.description)
    return desc ? `<b>${cat}</b><span class="ref">${desc}</span>` : `<b>${cat}</b>`
  }

  const dayRows =
    days.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#888;padding:18px">No entries in this period.</td></tr>`
      : days
          .map((d) => {
            const rows = byDay[d]
            let dayIn = 0
            let dayOut = 0
            const lines = rows
              .map((e, i) => {
                const amt = Number(e.amount || 0)
                if (e.type === 'income') dayIn += amt
                else dayOut += amt
                return `
        <tr>
          <td>${i === 0 ? fmtDate(d) : ''}</td>
          <td>${detail(e)}</td>
          <td class="num">${e.type === 'income' ? money(amt) : '—'}</td>
          <td class="num">${e.type === 'expense' ? money(amt) : '—'}</td>
        </tr>`
              })
              .join('')
            const net = dayIn - dayOut
            const subtotal = `
        <tr class="daysub">
          <td></td>
          <td style="text-align:right">Day total — Net ${money(net)}</td>
          <td class="num">${money(dayIn)}</td>
          <td class="num">${money(dayOut)}</td>
        </tr>`
            return lines + subtotal
          })
          .join('')

  const profit = totals.net >= 0

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>P&L - ${esc(business.name)}</title>
<style>${INVOICE_STYLE}
  .summary .bal { color: ${profit ? '#1e8449' : '#c0392b'}; }
  tr.daysub td { background: #f5f6f8; font-weight: 700; font-size: 12px; border-top: 1px solid #ddd; }
</style>
</head>
<body>
  ${printButton}

  <div class="top">
    ${bizBlock(restaurant)}
    <div class="doc">
      <h2>P&amp;L REPORT</h2>
      <p><span class="chip">${esc(periodLabel)}</span></p>
      <p>Generated: ${fmtDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="parties">
    <div class="lbl">Business Account</div>
    <div class="name">${esc(business.name)}</div>
    ${business.note ? `<p>${esc(business.note)}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:110px">Date</th>
        <th>Description</th>
        <th class="num">Income</th>
        <th class="num">Expense</th>
      </tr>
    </thead>
    <tbody>
      ${dayRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Grand Totals</td>
        <td class="num">${money(totals.income)}</td>
        <td class="num">${money(totals.expense)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="summary">
    <div><span>Total Income</span><span>${money(totals.income)}</span></div>
    <div><span>Total Expenses</span><span>− ${money(totals.expense)}</span></div>
    <div class="bal">
      <span>${profit ? 'Net Profit' : 'Net Loss'}</span>
      <span>${money(Math.abs(totals.net))}</span>
    </div>
  </div>

  <p class="note">Computer-generated profit &amp; loss report — ${esc(restaurant.name)}.</p>
  ${autoPrint}
</body>
</html>`

  openPrintWindow(html)
}

// ---------------------------------------------------------------------------
// Expenses report for a period, with a per-category summary.
// expenses: [{ date, category, description, paidTo, method, amount }]
// ---------------------------------------------------------------------------
export function printExpenseReport(expenses, restaurant, periodLabel = 'All Time') {
  const rows = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))
  const total = rows.reduce((s, e) => s + Number(e.amount || 0), 0)

  // Totals by category.
  const catMap = {}
  rows.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0)
  })
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  const bodyRows =
    rows.length === 0
      ? `<tr><td colspan="5" style="text-align:center;color:#888;padding:18px">No expenses in this period.</td></tr>`
      : rows
          .map(
            (e) => `
        <tr>
          <td>${fmtDate(e.date)}</td>
          <td>${esc(e.category)}</td>
          <td>${esc(e.description) || '—'}</td>
          <td>${esc(e.paidTo) || '—'}</td>
          <td class="num">${money(e.amount)}</td>
        </tr>`,
          )
          .join('')

  const catRows = cats
    .map(
      ([c, amt]) => `<div><span>${esc(c)}</span><span>${money(amt)}</span></div>`,
    )
    .join('')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Expense Report</title>
<style>${INVOICE_STYLE}
  .summary .bal { color: #c0392b; }
</style>
</head>
<body>
  ${printButton}

  <div class="top">
    ${bizBlock(restaurant)}
    <div class="doc">
      <h2>EXPENSE REPORT</h2>
      <p><span class="chip">${esc(periodLabel)}</span></p>
      <p>Generated: ${fmtDate(new Date().toISOString())}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:110px">Date</th>
        <th>Category</th>
        <th>Description</th>
        <th>Paid To</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">Total</td>
        <td class="num">${money(total)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="summary">
    ${catRows || ''}
    <div class="bal">
      <span>Total Expenses</span>
      <span>${money(total)}</span>
    </div>
  </div>

  <p class="note">Computer-generated expense report — ${esc(restaurant.name)}.</p>
  ${autoPrint}
</body>
</html>`

  openPrintWindow(html)
}

// ---------------------------------------------------------------------------
// Orders / sales report for a period.
// orders: [{ id, createdAt, customer{name}, orderType, status, total, payment }]
// ---------------------------------------------------------------------------
export function printOrdersReport(orders, restaurant, periodLabel = 'All Time') {
  const rows = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const total = rows.reduce((s, o) => s + Number(o.total || 0), 0)

  const bodyRows =
    rows.length === 0
      ? `<tr><td colspan="5" style="text-align:center;color:#888;padding:18px">No orders in this period.</td></tr>`
      : rows
          .map(
            (o) => `
        <tr>
          <td>${esc(o.id)}<span class="ref">${fmtDateTime(o.createdAt)}</span></td>
          <td>${esc(o.customer?.name) || 'Walk-in'}</td>
          <td>${esc(o.orderType)}</td>
          <td>${esc(o.status)}</td>
          <td class="num">${money(o.total)}</td>
        </tr>`,
          )
          .join('')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Sales Report</title>
<style>${INVOICE_STYLE}
  .summary .bal { color: #e8622a; }
</style>
</head>
<body>
  ${printButton}

  <div class="top">
    ${bizBlock(restaurant)}
    <div class="doc">
      <h2>SALES REPORT</h2>
      <p><span class="chip">${esc(periodLabel)}</span></p>
      <p>Generated: ${fmtDate(new Date().toISOString())}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Order</th>
        <th>Customer</th>
        <th>Type</th>
        <th>Status</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">Total (${rows.length} orders)</td>
        <td class="num">${money(total)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="summary">
    <div><span>Total Orders</span><span>${rows.length}</span></div>
    <div class="bal">
      <span>Total Sales</span>
      <span>${money(total)}</span>
    </div>
  </div>

  <p class="note">Computer-generated sales report — ${esc(restaurant.name)}.</p>
  ${autoPrint}
</body>
</html>`

  openPrintWindow(html)
}
