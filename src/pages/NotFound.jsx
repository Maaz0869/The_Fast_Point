import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="section flex flex-col items-center py-28 text-center">
      <span className="text-7xl">🍔</span>
      <h1 className="mt-6 font-display text-5xl font-extrabold text-brand-600">404</h1>
      <p className="mt-2 font-display text-xl font-bold">Oops! This page is off the menu.</p>
      <p className="mt-1 text-charcoal/55">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </div>
  )
}
