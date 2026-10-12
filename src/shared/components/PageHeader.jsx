import { alpha, Box, Chip, Typography, useTheme } from '@mui/material'
import { Sparkles } from 'lucide-react'
import CustomButton from '@/shared/components/CustomButton'

const PageHeader = ({
  title,
  subtitle,
  count,
  actionLabel,
  onAction,
  actionIcon,
  fullWidthAction = false,
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        mb: { xs: 2.5, md: 3.5 },
        gap: 2,
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.7 }}>
          <Sparkles size={13} color={theme.palette.custom.accentDark} />
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 800,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}
          >
            Admin workspace
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ color: 'text.primary' }}>
            {title}
          </Typography>
          {count !== undefined && (
            <Chip
              size="small"
              label={count}
              sx={{
                color: 'text.primary',
                bgcolor: alpha(theme.palette.custom.accent, 0.32),
                border: `1px solid ${alpha(theme.palette.custom.accentDark, 0.12)}`,
              }}
            />
          )}
        </Box>

        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65, maxWidth: 680 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {actionLabel && onAction && (
        <CustomButton
          label={actionLabel}
          variant="contained"
          color="primary"
          onClick={onAction}
          fullWidth={fullWidthAction}
          startIcon={actionIcon}
          sx={{ minWidth: { sm: 148 }, alignSelf: { xs: 'stretch', sm: 'auto' } }}
        />
      )}
    </Box>
  )
}

export default PageHeader
