/**
 * Team & roles (§14.6, §22.2). Same model as the Raddiwalla admin:
 * a role grants a permission set; per-member overrides can add or remove
 * access to a single feature. Privileged permissions (team, settings,
 * pricing write) can only be granted by the Super Admin.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  Alert, Box, Button, Checkbox, Chip, FormControlLabel, MenuItem, Stack, Switch, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material'
import { Plus, ShieldCheck } from 'lucide-react'

import { ConfirmDialog, CustomTable, ErrorState, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, Toolbar } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import {
  TEAM_MEMBERS, TEAM_MEMBER, ROLES, PERMISSION_CATALOG, CREATE_TEAM_MEMBER, UPDATE_TEAM_MEMBER, RESET_MEMBER_PASSWORD, DELETE_TEAM_MEMBER, SAVE_ROLE, DELETE_ROLE,
} from '@/services/admin.api'
import { formatRelativeTime } from '@/utils/dateFormatter'

const PASSWORD_HINT = 'At least 10 characters with upper- and lower-case letters and a number'

/** Role permission matrix: one row per feature, read / write checkboxes. */
const RoleMatrix = ({ features, privileged, value, onChange, isSuperAdmin }) => {
  const has = (p) => value.includes(p)
  const toggle = (feature, action, checked) => {
    const read = `admin:${feature}:read`
    const write = `admin:${feature}:write`
    const next = value.filter((p) => p !== read && p !== write)
    if (action === 'read' && checked) next.push(read, ...(has(write) ? [write] : []))
    if (action === 'write' && checked) next.push(read, write)
    if (action === 'write' && !checked && has(read)) next.push(read)
    onChange([...new Set(next)])
  }
  return (
    <Table size="small">
      <TableHead><TableRow><TableCell>Area</TableCell><TableCell align="center">View</TableCell><TableCell align="center">Change</TableCell></TableRow></TableHead>
      <TableBody>
        {features.map((f) => {
          const writeLocked = privileged.includes(`admin:${f.key}:write`) && !isSuperAdmin
          return (
            <TableRow key={f.key}>
              <TableCell>{f.label}{privileged.includes(`admin:${f.key}:write`) && <Chip size="small" label="privileged" sx={{ ml: 1 }} />}</TableCell>
              <TableCell align="center"><Checkbox size="small" checked={has(`admin:${f.key}:read`)} onChange={(e) => toggle(f.key, 'read', e.target.checked)} /></TableCell>
              <TableCell align="center">
                {f.supports_write ? <Checkbox size="small" checked={has(`admin:${f.key}:write`)} disabled={writeLocked} onChange={(e) => toggle(f.key, 'write', e.target.checked)} /> : '—'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

/** Per-member overrides on top of the role. */
const AccessOverrides = ({ features, privileged, rolePermissions, value, onChange, isSuperAdmin }) => {
  const current = (key) => {
    const row = value.find((a) => a.feature === key)
    if (!row) return 'inherit'
    if (row.can_write) return 'write'
    return row.can_read ? 'read' : 'none'
  }
  const set = (key, mode) => {
    const rest = value.filter((a) => a.feature !== key)
    if (mode === 'inherit') return onChange(rest)
    onChange([...rest, { feature: key, can_read: mode !== 'none', can_write: mode === 'write' }])
  }
  const roleLabel = (key) => (rolePermissions.includes(`admin:${key}:write`) ? 'change' : rolePermissions.includes(`admin:${key}:read`) ? 'view' : 'none')
  return (
    <Table size="small">
      <TableHead><TableRow><TableCell>Area</TableCell><TableCell>From role</TableCell><TableCell>Override</TableCell></TableRow></TableHead>
      <TableBody>
        {features.map((f) => (
          <TableRow key={f.key}>
            <TableCell>{f.label}</TableCell>
            <TableCell><Typography variant="caption">{roleLabel(f.key)}</Typography></TableCell>
            <TableCell>
              <TextField select size="small" value={current(f.key)} onChange={(e) => set(f.key, e.target.value)} sx={{ minWidth: 140 }}>
                <MenuItem value="inherit">Same as role</MenuItem>
                <MenuItem value="none">No access</MenuItem>
                <MenuItem value="read">View only</MenuItem>
                {f.supports_write && <MenuItem value="write" disabled={privileged.includes(`admin:${f.key}:write`) && !isSuperAdmin}>View & change</MenuItem>}
              </TextField>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const MemberPanel = ({ id, onClose, onSaved, roles, features, privileged }) => {
  const { me, isSuperAdmin, hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:team_members:write')
  const isNew = id === 'new'
  const { data, refetch } = useQuery(TEAM_MEMBER, { variables: { id }, skip: !id || isNew, fetchPolicy: 'network-only' })
  const { run, loading } = useAction()
  const [draft, setDraft] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const m = data?.teamMember
  const form = draft || (isNew
    ? { name: '', email: '', phone: '', designation: '', role_id: roles.find((r) => r.key === 'sales_representative')?.id || '', is_super_admin: false, status: 'active', access: [] }
    : m && { name: m.name, email: m.email, phone: m.phone || '', designation: m.designation || '', role_id: m.role_id || '', is_super_admin: m.is_super_admin, status: m.status, access: m.access })
  const patch = (p) => setDraft({ ...form, ...p })
  const rolePermissions = roles.find((r) => r.id === form?.role_id)?.permissions || []

  const save = async () => {
    const input = { ...form, role_id: form.role_id || null, phone: form.phone || null, designation: form.designation || null }
    const res = isNew ? await run(CREATE_TEAM_MEMBER, { input: { ...input, password } }) : await run(UPDATE_TEAM_MEMBER, { id, input })
    if (res) { setDraft(null); setPassword(''); onSaved(); if (!isNew) refetch() }
  }
  return (
    <SidebarPanel open={Boolean(id)} onClose={() => { setDraft(null); onClose() }} title={isNew ? 'Add team member' : form?.name || 'Team member'} onSave={canWrite ? save : undefined} loading={loading}
      headerActions={!isNew && canWrite && m && m.id !== me?.id && <Button size="small" color="error" onClick={() => setConfirmDelete(true)}>Remove</Button>}>
      {form && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField size="small" fullWidth label="Name" value={form.name} onChange={(e) => patch({ name: e.target.value })} required />
            <TextField size="small" fullWidth label="Designation" value={form.designation} onChange={(e) => patch({ designation: e.target.value })} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField size="small" fullWidth label="Email (login)" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} required />
            <TextField size="small" fullWidth label="Phone" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </Stack>
          {isNew && <TextField size="small" label="Initial password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} helperText={PASSWORD_HINT} required />}
          <Stack direction="row" spacing={2}>
            <TextField select size="small" fullWidth label="Role" value={form.role_id} onChange={(e) => patch({ role_id: e.target.value })}>
              <MenuItem value="">No role (overrides only)</MenuItem>
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" fullWidth label="Status" value={form.status} onChange={(e) => patch({ status: e.target.value })}>
              <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem><MenuItem value="suspended">Suspended</MenuItem>
            </TextField>
          </Stack>
          {isSuperAdmin && <FormControlLabel control={<Switch checked={form.is_super_admin} onChange={(e) => patch({ is_super_admin: e.target.checked })} />} label="Super Admin (full access, can grant privileged permissions)" />}
          {form.is_super_admin ? <Alert severity="info" icon={<ShieldCheck size={18} />}>Super Admins have every permission.</Alert> : (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Access</Typography>
              <AccessOverrides features={features} privileged={privileged} rolePermissions={rolePermissions} value={form.access || []} onChange={(access) => patch({ access })} isSuperAdmin={isSuperAdmin} />
            </Box>
          )}
          {!isNew && canWrite && (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField size="small" type="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} helperText={`${PASSWORD_HINT}. Signs the member out everywhere.`} sx={{ flex: 1 }} />
              <Button variant="outlined" disabled={loading || !password} onClick={async () => { if (await run(RESET_MEMBER_PASSWORD, { id, password })) setPassword('') }}>Reset</Button>
            </Stack>
          )}
          {m && <Typography variant="caption" color="text.secondary">Last login {m.last_login_at ? formatRelativeTime(m.last_login_at) : 'never'}</Typography>}
        </Stack>
      )}
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} loading={loading} title="Remove team member?" message="They are signed out immediately. Their past actions stay in the audit log."
        onConfirm={async () => { if (await run(DELETE_TEAM_MEMBER, { id })) { setConfirmDelete(false); onSaved(); onClose() } }} />
    </SidebarPanel>
  )
}

const RolePanel = ({ role, onClose, onSaved, features, privileged }) => {
  const { isSuperAdmin, hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:team_members:write')
  const { run, loading } = useAction()
  const [draft, setDraft] = useState(null)
  const form = draft || (role && { name: role.name || '', description: role.description || '', permissions: role.permissions || [] })
  const patch = (p) => setDraft({ ...form, ...p })
  const save = async () => { if (await run(SAVE_ROLE, { id: role.id || null, input: form })) { setDraft(null); onSaved() } }
  const remove = async () => { if (await run(DELETE_ROLE, { id: role.id })) { setDraft(null); onSaved() } }
  return (
    <SidebarPanel open={Boolean(role)} onClose={() => { setDraft(null); onClose() }} title={role?.id ? `Role: ${role.name}` : 'New role'} onSave={canWrite ? save : undefined} loading={loading}
      headerActions={role?.id && !role.is_system && canWrite && <Button size="small" color="error" onClick={remove}>Delete</Button>}>
      {form && (
        <Stack spacing={2}>
          <TextField size="small" label="Role name" value={form.name} onChange={(e) => patch({ name: e.target.value })} required />
          <TextField size="small" label="Description" value={form.description} onChange={(e) => patch({ description: e.target.value })} multiline />
          {role?.is_system && <Alert severity="info">System role — it can be edited but not deleted.</Alert>}
          <Alert severity="warning">Saving signs out every member with this role so the new permissions apply immediately.</Alert>
          <RoleMatrix features={features} privileged={privileged} value={form.permissions} onChange={(permissions) => patch({ permissions })} isSuperAdmin={isSuperAdmin} />
        </Stack>
      )}
    </SidebarPanel>
  )
}

const TeamMembers = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:team_members:write')
  const [tab, setTab] = useState('members')
  const [search, setSearch] = useState('')
  const [memberId, setMemberId] = useState(null)
  const [role, setRole] = useState(null)
  const members = useQuery(TEAM_MEMBERS, { variables: { search: search || undefined }, fetchPolicy: 'cache-and-network' })
  const rolesQ = useQuery(ROLES, { fetchPolicy: 'cache-and-network' })
  const { data: catalogData } = useQuery(PERMISSION_CATALOG)
  const features = useMemo(() => catalogData?.permissionCatalog?.catalog?.[0]?.features || [], [catalogData])
  const privileged = catalogData?.permissionCatalog?.privileged || []
  const roles = rolesQ.data?.roles || []

  const memberColumns = [
    { id: 'name', label: 'Name', minWidth: 200, format: (v, r) => <><Typography variant="body2" component="div" sx={{ fontWeight: 800 }}>{v} {r.is_super_admin && <Chip size="small" color="primary" label="Super Admin" sx={{ ml: 0.5 }} />}</Typography><Typography variant="caption" color="text.secondary">{r.email}</Typography></> },
    { id: 'designation', label: 'Designation' },
    { id: 'role_name', label: 'Role', format: (v) => v || '—' },
    { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
    { id: 'last_login_at', label: 'Last login', format: (v) => (v ? formatRelativeTime(v) : 'Never') },
  ]
  const roleColumns = [
    { id: 'name', label: 'Role', minWidth: 200, format: (v, r) => <><Typography variant="body2" component="div" sx={{ fontWeight: 800 }}>{v} {r.is_system && <Chip size="small" label="system" sx={{ ml: 0.5 }} />}</Typography><Typography variant="caption" color="text.secondary">{r.description}</Typography></> },
    { id: 'permissions', label: 'Permissions', format: (v) => `${v.length} granted` },
    { id: 'member_count', label: 'Members', align: 'right' },
  ]
  const refetchAll = () => { members.refetch(); rolesQ.refetch() }

  return (
    <PageContainer>
      <PageHeader title="Team & roles" subtitle="Who can sign in to this admin panel and what they can do"
        actionLabel={canWrite ? (tab === 'members' ? 'Add member' : 'New role') : undefined} actionIcon={<Plus size={18} />}
        onAction={canWrite ? () => (tab === 'members' ? setMemberId('new') : setRole({ permissions: [] })) : undefined} />
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="members" label={`Members (${members.data?.teamMembers?.length ?? 0})`} />
        <Tab value="roles" label={`Roles (${roles.length})`} />
      </Tabs>
      {tab === 'members' ? (
        <>
          <Toolbar><TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} /></Toolbar>
          {members.error ? <ErrorState message={members.error.message} /> : <CustomTable tableId="team" columns={memberColumns} rows={members.data?.teamMembers || []} onRowClick={(r) => setMemberId(r.id)} />}
        </>
      ) : (
        rolesQ.error ? <ErrorState message={rolesQ.error.message} /> : <CustomTable tableId="roles" columns={roleColumns} rows={roles} onRowClick={setRole} />
      )}
      <MemberPanel id={memberId} onClose={() => setMemberId(null)} onSaved={refetchAll} roles={roles} features={features} privileged={privileged} />
      <RolePanel role={role} onClose={() => setRole(null)} onSaved={() => { setRole(null); refetchAll() }} features={features} privileged={privileged} />
    </PageContainer>
  )
}

export default TeamMembers
