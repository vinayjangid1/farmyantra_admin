import { useState } from 'react'
import { alpha, Box } from '@mui/material'
import { useLocation } from 'react-router-dom'
import Sidebar from '@/app/layout/Sidebar'
import Navbar from '@/app/layout/Navbar'
import ApiLogDrawer from '@/shared/components/ApiLogDrawer'
import { usePermissions } from '@/features/permissions'

/** Routes that render full-screen without sidebar/padding */
const FULL_SCREEN_ROUTES = []

const Layout = ({ children, toggleTheme, mode }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [apiLogOpen, setApiLogOpen] = useState(false)
  const location = useLocation()
  const { isSuperAdmin } = usePermissions()

  // The API log drawer is a super-admin-only debugging tool.
  const canUseApiLog = Boolean(isSuperAdmin)

  const isFullScreen = FULL_SCREEN_ROUTES.some(
    (route) => location.pathname === route || location.pathname.startsWith(`${route}/`),
  )

  if (isFullScreen) {
    return (
      <Box sx={{ height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
        {children}
        {canUseApiLog && <ApiLogDrawer open={apiLogOpen} onClose={() => setApiLogOpen(false)} />}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((current) => !current)}
      />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          toggleTheme={toggleTheme}
          mode={mode}
          onMenuClick={() => setMobileOpen((current) => !current)}
          onToggleApiLog={canUseApiLog ? () => setApiLogOpen((current) => !current) : undefined}
        />

        <Box
          component="main"
          sx={{
            position: 'relative',
            flexGrow: 1,
            overflow: 'auto',
            isolation: 'isolate',
            p: { xs: 1.5, sm: 2.5, lg: 3 },
            '&::before': {
              content: '""',
              position: 'fixed',
              zIndex: -1,
              inset: 0,
              pointerEvents: 'none',
              background: (theme) =>
                `radial-gradient(circle at 82% 8%, ${alpha(theme.palette.custom.accent, theme.palette.mode === 'light' ? 0.12 : 0.07)}, transparent 28%), radial-gradient(circle at 15% 85%, ${alpha(theme.palette.info.main, 0.055)}, transparent 25%)`,
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              minHeight: '100%',
              animation: 'page-enter 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {canUseApiLog && <ApiLogDrawer open={apiLogOpen} onClose={() => setApiLogOpen(false)} />}
    </Box>
  )
}

export default Layout
