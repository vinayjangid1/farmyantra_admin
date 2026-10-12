import { createContext, useContext, useMemo } from 'react'
import { Box, CircularProgress } from '@mui/material'

import { useMe } from '@/services/teamMembers.service'

/**
 * Permission context for the authenticated area.
 *
 * Loads the current staff member once (via the `me` query) and exposes their
 * effective permission strings plus small helpers for gating nav, routes and
 * buttons. All gating is presentation-only — the API remains the authority and
 * rejects any request the caller is not allowed to make.
 *
 * Super admin needs no special-casing: for a super admin the server returns
 * every permission string, so `hasPermission` passes every gate automatically.
 * `isSuperAdmin` is still exposed for badges / hiding the "make super admin"
 * toggle.
 */
const PermissionsContext = createContext({
  me: null,
  loading: true,
  permissions: new Set(),
  isSuperAdmin: false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refetchMe: () => {},
})

/**
 * Provider that bootstraps RBAC. Mount it inside the authenticated area so it
 * only runs the `me` query for logged-in operators.
 *
 * While `me` is loading for the first time it shows a lightweight spinner so no
 * screen flashes with the wrong (empty) permission set.
 */
export const PermissionsProvider = ({ children }) => {
  const { data, loading, refetch } = useMe()

  const me = data?.me || null

  const value = useMemo(() => {
    const permissions = new Set(me?.permissions || [])
    const hasPermission = (permission) => {
      if (!permission) return true
      return permissions.has(permission)
    }
    const hasAnyPermission = (list = []) =>
      list.length === 0 || list.some((permission) => permissions.has(permission))
    const hasAllPermissions = (list = []) =>
      list.every((permission) => permissions.has(permission))

    return {
      me,
      loading,
      permissions,
      isSuperAdmin: Boolean(me?.is_super_admin),
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refetchMe: refetch,
    }
  }, [me, loading, refetch])

  // Only block the first paint — once `me` is cached, background refetches must
  // not blank the whole app.
  if (loading && !me) {
    return (
      <Box
        sx={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

/** Access the current permission context. */
export const usePermissions = () => useContext(PermissionsContext)

export default PermissionsContext
