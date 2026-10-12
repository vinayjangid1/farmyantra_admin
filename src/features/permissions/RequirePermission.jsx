import { Box, Button, Typography } from '@mui/material'
import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { usePermissions } from '@/features/permissions/PermissionsContext'
import { landingPathForAccess } from '@/core/config/app.config'

/**
 * Full-page "no access" state shown when an operator opens a route they are not
 * permitted to see (e.g. via a bookmarked URL). Nav already hides the link, but
 * routes still need their own guard because URLs can be typed directly.
 */
const Forbidden = () => {
  const navigate = useNavigate()
  const home = landingPathForAccess()
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
        px: 2,
      }}
    >
      <ShieldAlert size={44} />
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        You don’t have access to this page
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        Your account doesn’t include permission for this area. Ask a workspace
        administrator if you think you should have access.
      </Typography>
      <Button variant="contained" onClick={() => navigate(home)} sx={{ mt: 1 }}>
        Back to Dashboard
      </Button>
    </Box>
  )
}

/**
 * Route guard: renders `children` only when the user holds the required
 * permission, otherwise shows the Forbidden page. Routes without a `permission`
 * are open to any authenticated user.
 */
const RequirePermission = ({ permission, children }) => {
  const { hasPermission } = usePermissions()
  if (permission && !hasPermission(permission)) return <Forbidden />
  return children
}

export default RequirePermission
