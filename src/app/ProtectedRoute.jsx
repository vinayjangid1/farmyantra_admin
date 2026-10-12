import { Navigate, useLocation } from 'react-router-dom'

import { isAuthenticated } from '@/services/auth.service'
import { ROUTES } from '@/core/config/app.config'

/**
 * UX gate for the authenticated area (the API is the real authority and
 * rejects every unauthorised request). Remembers where the operator was going.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />
  }
  return children
}

export default ProtectedRoute
