import { Navigate } from 'react-router-dom'
import { useMediaQuery } from '@mui/material'

import { ROUTES } from '@/core/config/app.config'
import { usePermissions } from '@/features/permissions'

/**
 * Root landing redirect: phones (workshop, dispatch) and members without the
 * dashboard start on "Today"; everyone else on the dashboard (§31.6).
 */
const LandingRedirect = () => {
  const { hasPermission } = usePermissions()
  const phone = useMediaQuery('(max-width: 600px)')
  return <Navigate to={phone || !hasPermission('admin:dashboard:read') ? '/today' : ROUTES.dashboard} replace />
}

export default LandingRedirect
