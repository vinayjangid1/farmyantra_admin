import { useState } from 'react'
import {
  alpha,
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  ArrowLeft,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Sun,
  Terminal,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/services/auth.service'
import { usePermissions } from '@/features/permissions'
import { useApiLogEnabled } from '@/lib/apiLog'
import usePageTitle from '@/shared/hooks/usePageTitle'
import NotificationBell from '@/features/notifications/NotificationBell'

const Navbar = ({ toggleTheme, mode, onMenuClick, onToggleApiLog, minimal }) => {
  const pageTitle = usePageTitle()
  const theme = useTheme()
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const navigate = useNavigate()
  const { me, isSuperAdmin } = usePermissions()
  const apiLogOn = useApiLogEnabled()

  const displayName = me?.name || 'Administrator'
  const displayRole = isSuperAdmin
    ? 'Super admin'
    : me?.designation || me?.role?.name || 'Team member'
  const initial = displayName.trim()?.[0]?.toUpperCase() || 'A'

  /**
   * A full document navigation clears cached admin data and open connections.
   */
  const handleLogout = () => {
    setAnchorEl(null)
    logout()
  }

  if (minimal) {
    return (
      <AppBar position="static" elevation={0} sx={{ minHeight: 56 }}>
        <Toolbar sx={{ minHeight: '56px !important', gap: 1.25 }}>
          <IconButton
            aria-label="Back to dashboard"
            edge="start"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={19} />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {pageTitle}
          </Typography>
          <IconButton aria-label="Toggle color mode" onClick={toggleTheme} size="small">
            {mode === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </IconButton>
        </Toolbar>
      </AppBar>
    )
  }

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar
        sx={{
          minHeight: { xs: '58px !important', sm: '68px !important' },
          px: { xs: 1.5, sm: 2.5, lg: 3 },
          gap: 1.25,
        }}
      >
        {isTablet && onMenuClick && (
          <IconButton
            aria-label="Open navigation"
            edge="start"
            onClick={onMenuClick}
            sx={{
              mr: 0.25,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <MenuIcon size={19} />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography
              variant="caption"
              sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.disabled', fontWeight: 700 }}
            >
              Workspace
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.disabled' }}
            >
              /
            </Typography>
            <Typography variant="h6" noWrap sx={{ fontSize: { xs: '0.92rem', sm: '1rem' } }}>
              {pageTitle}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'none', lg: 'block' }, mt: 0.15 }}
          >
            Enquiries, quotations, catalogue and team
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 } }}>
          <Chip
            size="small"
            label="Admin mode"
            sx={{
              display: { xs: 'none', md: 'flex' },
              bgcolor: (currentTheme) => alpha(currentTheme.palette.custom.accent, 0.18),
              color: 'text.secondary',
            }}
          />

          <IconButton
            aria-label="Toggle color mode"
            onClick={toggleTheme}
            sx={{
              width: 38,
              height: 38,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: (currentTheme) => alpha(currentTheme.palette.background.paper, 0.72),
            }}
          >
            {mode === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </IconButton>

          {onToggleApiLog && isSuperAdmin && (
            <IconButton
              aria-label="Toggle API log"
              onClick={onToggleApiLog}
              sx={{
                position: 'relative',
                width: 38,
                height: 38,
                border: '1px solid',
                borderColor: apiLogOn ? 'custom.accent' : 'divider',
                color: apiLogOn ? 'custom.accentDark' : 'inherit',
                bgcolor: (currentTheme) =>
                  apiLogOn
                    ? alpha(currentTheme.palette.custom.accent, 0.14)
                    : alpha(currentTheme.palette.background.paper, 0.72),
              }}
            >
              <Terminal size={17} />
              {apiLogOn && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'custom.accent',
                    boxShadow: (t) => `0 0 6px ${t.palette.custom.accent}`,
                  }}
                />
              )}
            </IconButton>
          )}

          <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            <NotificationBell />
          </Box>

          <Box
            component="button"
            type="button"
            aria-label="Open account menu"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ml: { xs: 0, sm: 0.25 },
              p: 0.5,
              pr: { xs: 0.5, md: 1 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              color: 'text.primary',
              bgcolor: (currentTheme) => alpha(currentTheme.palette.background.paper, 0.76),
              cursor: 'pointer',
              transition: 'border-color 180ms ease, transform 180ms ease',
              '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
            }}
          >
            <Avatar
              src={me?.avatar_url || undefined}
              sx={{
                width: 31,
                height: 31,
                color: '#172337',
                bgcolor: 'custom.accent',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {me?.avatar_url ? null : me?.name ? initial : <User size={15} />}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left', lineHeight: 1 }}>
              <Typography
                variant="caption"
                sx={{ display: 'block', fontWeight: 800, color: 'text.primary' }}
                noWrap
              >
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                {displayRole}
              </Typography>
            </Box>
            <ChevronDown size={14} style={{ display: isTablet ? 'none' : 'block' }} />
          </Box>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 190 } }}
      >
        <Box sx={{ px: 1.5, py: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {me?.email || 'FarmYantra team'}
          </Typography>
        </Box>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogOut size={17} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export default Navbar
