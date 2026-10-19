/** Navbar bell: admin notifications (new call-backs, accepted quotations, contact messages…). */
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { Badge, Box, IconButton, List, ListItemButton, ListItemText, Popover, Typography, Button } from '@mui/material'
import { Bell, BellRing } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ADMIN_NOTIFICATIONS, MARK_ADMIN_NOTIFICATIONS_READ, REGISTER_PUSH_TOKEN } from '@/services/admin.api'
import { getPushToken, pushPermission, requestPushPermission } from '@/services/push.service'
import { formatRelativeTime } from '@/utils/dateFormatter'

const NotificationBell = () => {
  const [anchor, setAnchor] = useState(null)
  const navigate = useNavigate()
  const { data, refetch } = useQuery(ADMIN_NOTIFICATIONS, { pollInterval: 60_000, fetchPolicy: 'cache-and-network' })
  const [markRead] = useMutation(MARK_ADMIN_NOTIFICATIONS_READ)
  const [registerPush] = useMutation(REGISTER_PUSH_TOKEN)
  const [pushState, setPushState] = useState(pushPermission)

  const subscribePush = async () => {
    const token = await getPushToken().catch(() => null)
    if (token) await registerPush({ variables: { token } }).catch(() => {})
  }

  // Tokens rotate: re-register on every load once alerts are allowed.
  useEffect(() => {
    if (pushPermission() === 'granted') subscribePush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enablePush = async () => {
    const permission = await requestPushPermission()
    setPushState(permission)
    if (permission === 'granted') await subscribePush()
  }
  const items = data?.adminNotifications || []
  const unread = items.filter((n) => !n.is_read)

  const open = async (n) => {
    setAnchor(null)
    if (!n.is_read) await markRead({ variables: { ids: [n.id] } })
    refetch()
    if (n.link) navigate(n.link)
  }

  return (
    <>
      <IconButton aria-label={`Notifications (${unread.length} unread)`} onClick={(e) => setAnchor(e.currentTarget)} sx={{ width: 38, height: 38, border: '1px solid', borderColor: 'divider' }}>
        <Badge color="warning" badgeContent={unread.length} max={99}>
          <Bell size={17} />
        </Badge>
      </IconButton>
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ width: 360, maxHeight: 460, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 800 }}>Notifications</Typography>
            {unread.length > 0 && (
              <Button size="small" onClick={async () => { await markRead({ variables: { ids: unread.map((n) => n.id) } }); refetch() }}>Mark all read</Button>
            )}
          </Box>
          {pushState === 'default' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <BellRing size={16} />
              <Typography variant="caption" sx={{ flex: 1 }}>Get desktop alerts for new enquiries, orders and messages.</Typography>
              <Button size="small" variant="contained" onClick={enablePush}>Turn on</Button>
            </Box>
          )}
          {pushState === 'denied' && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              Desktop alerts are blocked for this site in your browser settings.
            </Typography>
          )}
          <List dense sx={{ overflowY: 'auto' }}>
            {items.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>You’re all caught up.</Typography>}
            {items.map((n) => (
              <ListItemButton key={n.id} onClick={() => open(n)} sx={{ alignItems: 'flex-start', bgcolor: n.is_read ? 'transparent' : 'action.hover' }}>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: n.is_read ? 500 : 800 }}>{n.title}</Typography>}
                  secondary={<>{n.body && <Typography variant="caption" component="span" sx={{ display: 'block' }}>{n.body}</Typography>}<Typography variant="caption" color="text.disabled">{formatRelativeTime(n.created_at)}</Typography></>}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  )
}

export default NotificationBell
