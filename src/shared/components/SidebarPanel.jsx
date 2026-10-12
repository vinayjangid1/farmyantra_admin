import { Drawer, Box, Typography, IconButton, useTheme, alpha } from '@mui/material'
import { X } from 'lucide-react'
import CustomButton from '@/shared/components/CustomButton'

/**
 * CustomDialog — now renders as a right-side sliding panel (half screen on desktop,
 * full screen on mobile). Drop-in replacement for all existing dialog usages.
 */
const SidebarPanel = ({
  open,
  onClose,
  title,
  children,
  onSave,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  // Accepted but NOT applied — this panel is a right-hand Drawer with a fixed
  // responsive width, so there is nothing to map these onto. They are kept in the
  // signature (rather than deleted) because UserDetailsDialog and
  // DocumentDetailsDialog both pass `maxWidth="md"` today and would otherwise
  // silently gain a stray DOM attribute. Those two call sites currently have no
  // effect; implement a width mapping here if that behaviour is actually wanted.
  maxWidth: _maxWidth,
  fullWidth: _fullWidth,
  loading = false,
  contentSx = {},
  zIndex = 1300,
  headerActions = null,
}) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={loading ? undefined : onClose}
      sx={{
        zIndex,
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(4px)',
          backgroundColor: alpha(theme.palette.common.black, 0.4),
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '90%', md: '60%', lg: '55%' },
          maxWidth: 900,
          backgroundColor: theme.palette.background.paper,
          boxShadow: `-8px 0 30px ${alpha(theme.palette.common.black, 0.15)}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderTopLeftRadius: theme.shape.borderRadius,
          borderBottomLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {headerActions}
          <IconButton
            onClick={onClose}
            disabled={loading}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.08),
              },
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2.5, sm: 3 },
          py: 3,
          '&::-webkit-scrollbar': {
            width: '5px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.text.disabled, 0.3),
            borderRadius: '3px',
            '&:hover': {
              background: alpha(theme.palette.text.disabled, 0.5),
            },
          },
          ...contentSx,
        }}
      >
        {children}
      </Box>

      {/* Footer Actions */}
      {onSave && (
        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: 2,
            display: 'flex',
            gap: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            flexShrink: 0,
          }}
        >
          {cancelLabel && (
            <CustomButton
              label={cancelLabel}
              onClick={onClose}
              variant="outlined"
              color="inherit"
              fullWidth
              disabled={loading}
              glass={true}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.4),
                color: theme.palette.text.primary,
              }}
            />
          )}
          <CustomButton
            label={loading ? `${saveLabel}...` : saveLabel}
            onClick={onSave}
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            loading={loading}
            gradient={true}
          />
        </Box>
      )}
    </Drawer>
  )
}

export default SidebarPanel
