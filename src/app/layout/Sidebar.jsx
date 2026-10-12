import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  alpha,
  Box,
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react'
import { navigationConfig } from '@/app/routes.config'
import { usePermissions } from '@/features/permissions'
import { APP_LOGO_URL } from '@/core/constants/branding'

const drawerWidth = 264
const collapsedWidth = 78

/** Flattens a nav config into its leaf/child paths, for active-path matching. */
const collectPaths = (config) =>
  config.flatMap((item) => [
    ...(item.path ? [item.path] : []),
    ...(item.children?.map((child) => child.path).filter(Boolean) ?? []),
  ])

const getActivePath = (config, pathname) =>
  collectPaths(config)
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((first, second) => second.length - first.length)[0]

/**
 * Keeps only the nav items the operator is allowed to see.
 *
 * - A leaf is kept when `hasPermission(item.permission)` passes (items with no
 *   `permission` are always shown).
 * - A parent is first filtered down to its visible children; if none remain it
 *   is dropped entirely, so empty section headers never appear.
 *
 * Super admins keep everything because the server grants them every string.
 */
const filterNavByPermission = (items, hasPermission) =>
  items.reduce((visible, item) => {
    if (item.children?.length) {
      const children = filterNavByPermission(item.children, hasPermission)
      if (children.length === 0) return visible
      return [...visible, { ...item, children }]
    }
    if (item.permission && !hasPermission(item.permission)) return visible
    return [...visible, item]
  }, [])

const Sidebar = ({ mobileOpen, onMobileClose, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { hasPermission, me, isSuperAdmin } = usePermissions()
  const [openMenus, setOpenMenus] = useState({ Users: true })

  const activeConfig = navigationConfig
  const activePath = getActivePath(activeConfig, location.pathname)

  const visibleNavigation = useMemo(
    () => filterNavByPermission(activeConfig, hasPermission),
    [activeConfig, hasPermission],
  )

  const sidebarText = '#EEF2F8'
  const accent = theme.palette.custom.accent

  useEffect(() => {
    const activeParent = visibleNavigation.find((item) =>
      item.children?.some((child) => child.path === activePath),
    )

    if (activeParent) {
      setOpenMenus((current) =>
        current[activeParent.title] ? current : { ...current, [activeParent.title]: true },
      )
    }
  }, [activePath, visibleNavigation])

  const handleMenuClick = (item) => {
    if (item.children) {
      if (!isCollapsed) {
        setOpenMenus((current) => ({ ...current, [item.title]: !current[item.title] }))
      }
      return
    }

    if (item.path) {
      navigate(item.path)
      if (isMobile) onMobileClose()
    }
  }

  const isActive = (path) => Boolean(path && activePath === path)
  const isChildActive = (item) => item.children?.some((child) => isActive(child.path)) || false

  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children?.length > 0
    const isOpen = openMenus[item.title] || false
    const directActive = item.path ? isActive(item.path) : false
    const childActive = !item.path && isChildActive(item)
    const active = directActive || childActive
    const Icon = item.icon

    const menuButton = (
      <ListItemButton
        onClick={() => handleMenuClick(item)}
        sx={{
          position: 'relative',
          minHeight: level === 0 ? 44 : 38,
          mx: 1.25,
          mb: 0.35,
          px: isCollapsed ? 1.25 : level === 0 ? 1.4 : 1.25,
          pl: isCollapsed ? 1.25 : level === 0 ? 1.4 : 3.7,
          borderRadius: 3,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          color: directActive
            ? '#172337'
            : childActive
              ? accent
              : alpha(sidebarText, level === 0 ? 0.72 : 0.52),
          bgcolor: directActive ? accent : childActive ? alpha(accent, 0.1) : 'transparent',
          boxShadow: directActive ? `0 8px 24px ${alpha(accent, 0.18)}` : 'none',
          transition: 'all 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&::before':
            level > 0
              ? {
                content: '""',
                position: 'absolute',
                left: 25,
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: directActive ? '#172337' : alpha(sidebarText, 0.2),
              }
              : {},
          '&:hover': {
            color: directActive ? '#172337' : '#FFFFFF',
            bgcolor: directActive ? accent : alpha('#FFFFFF', 0.07),
            transform: isCollapsed ? 'none' : 'translateX(2px)',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: isCollapsed ? 0 : 34,
            justifyContent: 'center',
            color: 'inherit',
            transition: 'transform 220ms ease',
          }}
        >
          {Icon && <Icon size={level === 0 ? 18 : 14} strokeWidth={active ? 2.35 : 1.9} />}
        </ListItemIcon>

        {!isCollapsed && (
          <>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontWeight: active ? 750 : level === 0 ? 600 : 550,
                fontSize: level === 0 ? '0.78rem' : '0.72rem',
                letterSpacing: '-0.01em',
              }}
            />
            {hasChildren && (
              <ChevronDown
                size={14}
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 220ms ease',
                  opacity: 0.55,
                }}
              />
            )}
          </>
        )}
      </ListItemButton>
    )

    return (
      <Box key={item.title}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          {isCollapsed ? (
            <Tooltip title={item.title} placement="right" arrow>
              {menuButton}
            </Tooltip>
          ) : (
            menuButton
          )}
        </ListItem>
        {hasChildren && !isCollapsed && (
          <Collapse in={isOpen} timeout={240} unmountOnExit>
            <List disablePadding sx={{ position: 'relative', mb: 0.5 }}>
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    )
  }

  const drawerContent = (
    <>
      <Box
        sx={{
          minHeight: 76,
          px: isCollapsed ? 1.4 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.07)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
          <Box
            sx={{
              position: 'relative',
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 3,
              p: 0.45,
              bgcolor: accent,
              boxShadow: `0 8px 28px ${alpha(accent, 0.18)}`,
            }}
          >
            <Box
              component="img"
              src={APP_LOGO_URL}
              alt="FarmYantra"
              sx={{ width: '100%', height: '100%', borderRadius: 2.25, objectFit: 'cover' }}
            />
          </Box>

          {!isCollapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#FFFFFF',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.035em',
                }}
              >
                FarmYantra
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.55, mt: 0.35 }}>
                <Sparkles size={10} color={accent} />
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(sidebarText, 0.45),
                    fontSize: '0.6rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Admin panel
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {!isMobile && !isCollapsed && (
          <IconButton
            aria-label="Collapse navigation"
            onClick={onToggleCollapse}
            size="small"
            sx={{
              color: alpha(sidebarText, 0.45),
              '&:hover': { color: accent, bgcolor: alpha(accent, 0.1) },
            }}
          >
            <ChevronLeft size={17} />
          </IconButton>
        )}
        {isMobile && (
          <IconButton
            aria-label="Close navigation"
            onClick={onMobileClose}
            sx={{ color: alpha(sidebarText, 0.55) }}
          >
            <X size={19} />
          </IconButton>
        )}
      </Box>

      {!isMobile && isCollapsed && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <IconButton
            aria-label="Expand navigation"
            onClick={onToggleCollapse}
            size="small"
            sx={{
              color: alpha(sidebarText, 0.4),
              '&:hover': { color: accent, bgcolor: alpha(accent, 0.1) },
            }}
          >
            <ChevronRight size={17} />
          </IconButton>
        </Box>
      )}

      {!isCollapsed && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            px: 2.6,
            pt: 1.6,
            pb: 0.8,
            color: alpha(sidebarText, 0.3),
            fontSize: '0.59rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Management
        </Typography>
      )}

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          pb: 1.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#FFFFFF', 0.1) },
        }}
      >
        <List disablePadding>{visibleNavigation.map((item) => renderMenuItem(item))}</List>
      </Box>

      {!isCollapsed && (
        <Box sx={{ p: 1.5, borderTop: `1px solid ${alpha('#FFFFFF', 0.07)}` }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.2,
              borderRadius: 3,
              bgcolor: alpha('#FFFFFF', 0.045),
              border: `1px solid ${alpha('#FFFFFF', 0.055)}`,
            }}
          >
            <Sparkles size={16} color={accent} />
            <Box>
              <Typography
                variant="caption"
                sx={{ display: 'block', color: alpha(sidebarText, 0.82), fontWeight: 700 }}
              >
                {isSuperAdmin ? 'Super Admin' : me?.role_name || 'Team member'}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', color: alpha(sidebarText, 0.32), fontSize: '0.58rem' }}
              >
                FarmYantra Admin
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </>
  )

  const currentWidth = isMobile ? drawerWidth : isCollapsed ? collapsedWidth : drawerWidth

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          duration: 280,
          easing: theme.transitions.easing.easeOut,
        }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          color: '#EEF2F8',
          backgroundColor: '#172337',
          backgroundImage: 'radial-gradient(120% 50% at 0% 0%, rgba(40,116,240,.28), transparent 60%), linear-gradient(180deg, #172337 0%, #1E2D45 100%)',
          borderRight: `1px solid ${alpha('#FFFFFF', 0.055)}`,
          boxShadow: isMobile ? '18px 0 60px rgba(0,0,0,.35)' : '10px 0 35px rgba(23,35,55,.10)',
          transition: theme.transitions.create('width', {
            duration: 280,
            easing: theme.transitions.easing.easeOut,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar
