import { usePermissions } from '@/features/permissions/PermissionsContext'

/**
 * Conditionally renders children based on the current user's permissions.
 *
 * Usage:
 *   <PermissionGate permission="admin:team_members:write">
 *     <Button>New Member</Button>
 *   </PermissionGate>
 *
 * Props:
 *   - permission:  a single required permission string
 *   - anyOf:       array; render if the user has ANY of these
 *   - allOf:       array; render if the user has ALL of these
 *   - fallback:    what to render when access is denied (default: nothing)
 *
 * With no permission props it renders children unconditionally. Super admins
 * pass every gate because the server grants them every permission string.
 */
const PermissionGate = ({ permission, anyOf, allOf, fallback = null, children }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  let allowed = true
  if (permission) allowed = allowed && hasPermission(permission)
  if (anyOf?.length) allowed = allowed && hasAnyPermission(anyOf)
  if (allOf?.length) allowed = allowed && hasAllPermissions(allOf)

  if (!allowed) return fallback
  return children
}

export default PermissionGate
