import { alpha, Box, Card, CardContent, Typography, useTheme } from '@mui/material'

const StatCard = ({ title, value, icon, color = 'primary' }) => {
  const theme = useTheme()
  const paletteColor = theme.palette[color]?.main || theme.palette.primary.main
  const accentColor = color === 'primary' ? theme.palette.custom.accentDark : paletteColor

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 126,
        isolation: 'isolate',
        animation: 'card-rise 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        '&::before': {
          content: '""',
          position: 'absolute',
          zIndex: -1,
          width: 105,
          height: 105,
          top: -58,
          right: -45,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accentColor, 0.22)}, transparent 70%)`,
          transition: 'transform 300ms ease, opacity 300ms ease',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 'auto 18px 0',
          height: 2,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${alpha(accentColor, 0)}, ${accentColor}, ${alpha(accentColor, 0)})`,
          opacity: 0,
          transition: 'opacity 240ms ease',
        },
        '&:hover': {
          transform: 'translateY(-5px)',
          borderColor: alpha(accentColor, 0.28),
          boxShadow: theme.palette.custom.elevatedShadow,
          '&::before': { transform: 'scale(1.25)', opacity: 0.9 },
          '&::after': { opacity: 0.8 },
          '& .stat-card-icon': { transform: 'rotate(-6deg) scale(1.08)' },
        },
      }}
    >
      <CardContent sx={{ height: '100%', p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ display: 'block', mb: 0.8, color: 'text.secondary', fontWeight: 700 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'text.primary',
                fontSize: { xs: '1.12rem', xl: '1.28rem' },
                lineHeight: 1.18,
              }}
            >
              {value}
            </Typography>
            <Box
              sx={{
                width: 28,
                height: 3,
                mt: 1.35,
                borderRadius: 999,
                bgcolor: alpha(accentColor, 0.55),
              }}
            />
          </Box>

          <Box
            className="stat-card-icon"
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 3,
              color: accentColor,
              bgcolor: alpha(accentColor, 0.105),
              border: `1px solid ${alpha(accentColor, 0.12)}`,
              transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
              '& svg': { width: 20, height: 20 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default StatCard
