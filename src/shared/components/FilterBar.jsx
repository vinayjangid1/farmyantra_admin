import { alpha, Box } from '@mui/material'

/** Responsive filter surface shared by data-management pages. */
const FilterBar = ({ children, columns, sx = {} }) => (
  <Box
    sx={{
      position: 'relative',
      mb: 3,
      p: { xs: 2, sm: 2.5 },
      borderRadius: 2,
      bgcolor: (theme) => theme.palette.custom.glass,
      backdropFilter: 'blur(18px)',
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: (theme) => theme.shadows[2],
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        md: columns ? `repeat(${columns}, minmax(0, 1fr))` : 'repeat(4, minmax(0, 1fr))',
      },
      gap: { xs: 1.5, sm: 2 },
      alignItems: 'end',
      animation: 'card-rise 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 30,
        right: 30,
        height: 2,
        borderRadius: 999,
        background: (theme) =>
          `linear-gradient(90deg, transparent, ${alpha(theme.palette.custom.accent, 0.72)}, transparent)`,
      },
      ...sx,
    }}
  >
    {children}
  </Box>
)

export default FilterBar
