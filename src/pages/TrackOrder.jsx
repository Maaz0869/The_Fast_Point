import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { rs, formatDateTime } from '../utils/format.js'
import { Check } from '../components/Icons.jsx'

export default function TrackOrder() {
  const { findOrder, orderStatuses } = useStore()
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState(searchParams.get('order') || '')
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)

  const doSearch = (id) => {
    const order = findOrder(id)
    setResult(order || null)
    setSearched(true)
  }

  // Auto-search if an order id came in via the query string.
  useEffect(() => {
    const q = searchParams.get('order')
    if (q) doSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e) => {
    e.preventDefault()
    if (input.trim()) doSearch(input)
  }

  const currentStep = result ? orderStatuses.indexOf(result.status) : -1

  return (
    <div className="section max-w-2xl py-12">
      <div className="text-center">
        <span className="chip mb-3 bg-brand-100 text-brand-600">Order Tracking</span>
        <h1 className="font-display text-3xl font-extrabold">Track Your Order</h1>
        <p className="mt-2 text-charcoal/55">Enter your order number to see its live status.</p>
      </div>

      <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md gap-2">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. SH-1044"
        />
        <button type="submit" className="btn-primary flex-none">
          Track
        </button>
      </form>

      {searched && !result && (
        <div className="mt-10 rounded-2xl bg-red-50 p-6 text-center">
          <p className="text-3xl">😕</p>
          <p className="mt-2 font-display font-bold text-red-700">Order not found</p>
          <p className="text-sm text-red-600/80">
            Double-check your order number (e.g. SH-1044) and try again.
          </p>
        </div>
      )}

      {result && (
        <div className="card mt-10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-4">
            <div>
              <p className="text-xs text-charcoal/50">Order</p>
              <p className="font-display text-xl font-extrabold text-brand-600">{result.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-charcoal/50">Placed</p>
              <p className="text-sm font-semibold">{formatDateTime(result.createdAt)}</p>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="py-8">
            <ol className="relative ml-3 border-l-2 border-dashed border-black/10">
              {orderStatuses.map((status, i) => {
                const done = i <= currentStep
                const active = i === currentStep
                return (
                  <li key={status} className="mb-8 ml-6 last:mb-0">
                    <span
                      className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-cream ${
                        done ? 'bg-brand-500 text-white' : 'bg-white text-charcoal/30 ring-cream'
                      } ${active ? 'animate-pulse' : ''}`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <p className={`font-display font-bold ${done ? 'text-charcoal' : 'text-charcoal/40'}`}>
                      {status}
                    </p>
                    <p className="text-xs text-charcoal/45">{stepHint(status)}</p>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="border-t border-black/5 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-charcoal/60">{result.orderType}</span>
              <span className="font-display font-bold text-brand-600">{rs(result.total)}</span>
            </div>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-charcoal/50">
        Placed an order?{' '}
        <Link to="/menu" className="font-semibold text-brand-600 hover:underline">
          Order again
        </Link>
      </p>
    </div>
  )
}

function stepHint(status) {
  return {
    Pending: 'We’ve received your order.',
    Preparing: 'Our chefs are cooking it up.',
    'Out for Delivery': 'Your food is on the way.',
    Delivered: 'Enjoy your meal!',
  }[status]
}
