import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Guards admin routes — redirects to the login page when not authenticated.
export default function ProtectedRoute({ children }) {
  const { isAdmin } = useAuth()
  const location = useLocation()

  if (!isAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />
  }
  return children
}
