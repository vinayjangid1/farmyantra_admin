import { useState } from 'react'
import { alpha, Fab, Tooltip } from '@mui/material'
import { Terminal } from 'lucide-react'
import ApiLogDrawer from '@/shared/components/ApiLogDrawer'
import { useApiLogEnabled } from '@/lib/apiLog'

/**
 * Floating API-log launcher for screens that are OUTSIDE the authenticated
 * Layout (e.g. the Login page), so API calls like `login` can be inspected for
 * testing even before a session exists. The navbar toggle (super-admin only)
 * covers the authenticated app; this covers the public login screen.
 */
const ApiLogFab = () => {
  const [open, setOpen] = useState(false)
  const enabled = useApiLogEnabled()

  return (
    <>
      <Tooltip title="API log (testing)">
        <Fab
          size="small"
          aria-label="Open API log"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1300,
            color: '#9fe870',
            bgcolor: '#172337',
            border: `1px solid ${alpha('#9fe870', 0.4)}`,
            '&:hover': { bgcolor: '#1C5FD6' },
          }}
        >
          <Terminal size={18} />
          {enabled && (
            <span
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#9fe870',
                boxShadow: '0 0 6px #9fe870',
              }}
            />
          )}
        </Fab>
      </Tooltip>
      <ApiLogDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default ApiLogFab
