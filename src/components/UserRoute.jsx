import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Guards the customer account area — sends visitors to the sign-in page and
// remembers where they were headed so they land there afterwards.
export default function UserRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Wait for the stored Supabase session to be restored; redirecting during
  // this window would sign a customer out on every page refresh.
  if (loading) {
    return (
      <div className="section flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-charcoal/50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Loading your account…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
