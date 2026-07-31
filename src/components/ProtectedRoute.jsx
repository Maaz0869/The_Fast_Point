import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Guards admin routes — redirects to the login page when not authenticated.
export default function ProtectedRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  const location = useLocation()

  // Wait for the stored Supabase session to be restored; redirecting during
  // this window would kick a signed-in admin out on every page refresh.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-semibold text-charcoal/50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Checking your session…
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />
  }
  return children
}
