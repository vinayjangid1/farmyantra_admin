/**
 * Drivers & vehicles (§27.2). ID photo and licence are private: only members
 * with driver_identity permissions see or upload them, and every view is audited.
 */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Chip, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { Plus, ShieldCheck } from 'lucide-react'

import { CustomTable, CustomTextField, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, Toolbar } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { showToast } from '@/lib/toast'
import { DRIVERS, DRIVER, SAVE_DRIVER, SET_DRIVER_STATUS, UPLOAD_DRIVER_IDENTITY } from '@/services/admin.api'
import { driverIdentityUrl } from '@/services/files'
import { formatDate } from '@/utils/dateFormatter'

const IdentityFiles = ({ driver, canWrite, onChanged }) => {
  const { run, loading } = useAction()
  const [kind, setKind] = useState('licence')
  const [number, setNumber] = useState('')
  const [file, setFile] = useState(null)
  const view = async (id) => {
    try { window.open(await driverIdentityUrl(id), '_blank', 'noopener') } catch (e) { showToast(e.message, { severity: 'error' }) }
  }
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><ShieldCheck size={18} /><Typography variant="subtitle2">Private identity files</Typography></Stack>
      {(driver.identity_files || []).map((f) => (
        <Stack key={f.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ flex: 1 }}>{f.kind === 'licence' ? 'Driving licence' : 'ID photo'}{f.licence_number ? ` · ${f.licence_number}` : ''} · {formatDate(f.created_at, 'short')}</Typography>
          {f.purged_at ? <Chip size="small" label="Purged" /> : f.mime && <Button size="small" onClick={() => view(f.id)}>View (logged)</Button>}
        </Stack>
      ))}
      {canWrite && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1}>
            <TextField select size="small" value={kind} onChange={(e) => setKind(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="licence">Licence</MenuItem><MenuItem value="id_photo">ID photo</MenuItem>
            </TextField>
            {kind === 'licence' && <TextField size="small" label="Licence number" value={number} onChange={(e) => setNumber(e.target.value)} />}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component="label" size="small" variant="outlined">{file ? file.name : 'Choose photo'}<input hidden type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button>
            <Button size="small" variant="contained" disabled={loading || !file} onClick={async () => { if (await run(UPLOAD_DRIVER_IDENTITY, { driverId: driver.id, kind, licenceNumber: number || null, file })) { setFile(null); setNumber(''); onChanged() } }}>Upload</Button>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}

const Drivers = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:drivers:write')
  const [search, setSearch] = useState('')
  const variables = useMemo(() => ({ search: search || undefined }), [search])
  const { data, refetch } = useQuery(DRIVERS, { variables, fetchPolicy: 'cache-and-network' })
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(null)
  const [photo, setPhoto] = useState(null)
  const { data: detail, refetch: refetchDetail } = useQuery(DRIVER, { variables: { id: editId }, skip: !editId, fetchPolicy: 'network-only' })
  useEffect(() => { if (detail?.driver && editId) setForm(detail.driver) }, [detail, editId])
  const { run, loading } = useAction()
  const close = () => { setEditId(null); setForm(null); setPhoto(null) }
  const save = async () => {
    const input = { name: form.name, mobile: form.mobile, email: form.email || null, address: form.address || null, vehicle_registration: form.vehicle_registration || null, vehicle_type: form.vehicle_type || null, notes: form.notes || null, consent_recorded: Boolean(form.consent_recorded) }
    if (await run(SAVE_DRIVER, { id: form.id || null, input, vehiclePhoto: photo })) { close(); refetch() }
  }
  return (
    <PageContainer>
      <PageHeader title="Drivers & vehicles" subtitle="Customers only see the vehicle number, type and driver first name (Settings → Shipping)." />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Name, mobile, vehicle…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
        {canWrite && <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setForm({ name: '', mobile: '+91', consent_recorded: false })}>Add driver</Button>}
      </Toolbar>
      <CustomTable tableId="drivers" rows={data?.drivers || []} onRowClick={(r) => setEditId(r.id)} columns={[
        { id: 'name', label: 'Driver', format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 700 }}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.mobile}</Typography></> },
        { id: 'vehicle_registration', label: 'Vehicle', format: (v, r) => [v, r.vehicle_type].filter(Boolean).join(' · ') || '—' },
        { id: 'shipment_count', label: 'Trips', align: 'right' },
        { id: 'last_shipment_at', label: 'Last trip', format: (v) => (v ? formatDate(v, 'short') : '—') },
        { id: 'has_licence', label: 'Documents', format: (v, r) => <Stack direction="row" spacing={0.5}>{v && <Chip size="small" label="Licence" />}{r.has_id_photo && <Chip size="small" label="ID" />}{r.has_vehicle_photo && <Chip size="small" label="Vehicle photo" />}</Stack> },
        { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
      ]} />
      <SidebarPanel open={Boolean(form)} onClose={close} title={form?.id ? form.name : 'New driver'} onSave={canWrite ? save : undefined} loading={loading}>
        {form && (
          <Stack spacing={2}>
            {['name', 'mobile', 'email', 'vehicle_registration', 'vehicle_type', 'address', 'notes'].map((k) => (
              <TextField key={k} size="small" label={k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())} value={form[k] || ''} disabled={!canWrite} multiline={['address', 'notes'].includes(k)}
                placeholder={k === 'vehicle_registration' ? 'MP09 AB 1234' : undefined} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            ))}
            {form.vehicle_photo_url && <Box component="img" src={form.vehicle_photo_url} alt="Vehicle" sx={{ maxWidth: 220, borderRadius: 1 }} />}
            {canWrite && <Button component="label" size="small" variant="outlined">{photo ? photo.name : 'Vehicle photo'}<input hidden type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></Button>}
            {!form.id && <FormControlLabel control={<Switch checked={Boolean(form.consent_recorded)} onChange={(e) => setForm({ ...form, consent_recorded: e.target.checked })} />} label="Driver agreed to their details being stored and shared with customers" />}
            {form.id && canWrite && (
              <Button size="small" color={form.status === 'active' ? 'warning' : 'success'} onClick={async () => { if (await run(SET_DRIVER_STATUS, { id: form.id, status: form.status === 'active' ? 'inactive' : 'active' })) { refetchDetail(); refetch() } }}>
                {form.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            )}
            {form.id && hasPermission('admin:driver_identity:read') && detail?.driver && <IdentityFiles driver={detail.driver} canWrite={hasPermission('admin:driver_identity:write')} onChanged={refetchDetail} />}
            {form.id && !hasPermission('admin:driver_identity:read') && <Alert severity="info">Identity files are visible only to members with driver identity access.</Alert>}
          </Stack>
        )}
      </SidebarPanel>
    </PageContainer>
  )
}

export default Drivers
