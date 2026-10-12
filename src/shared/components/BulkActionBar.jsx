import { alpha, Box, Typography } from '@mui/material'
import { X } from 'lucide-react'
import CustomButton from '@/shared/components/CustomButton'

/**
 * Sticky-ish bar shown when ≥1 row is selected. Renders a count, a clear button,
 * and the caller's action buttons.
 *
 * @param {number} count         selected count
 * @param {() => void} onClear   clear selection
 * @param {React.ReactNode} actions  action buttons (CustomButton etc.)
 * @param {string} noun          e.g. "buyers"
 */
const BulkActionBar = ({ count, onClear, actions, noun = 'items' }) => {
  if (!count) return null
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        px: 2,
        py: 1.25,
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: (t) => alpha(t.palette.custom.accent, 0.4),
        bgcolor: (t) => alpha(t.palette.custom.accent, 0.1),
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {count} {noun} selected
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>{actions}</Box>
      <CustomButton
        label="Clear"
        variant="text"
        size="small"
        color="inherit"
        startIcon={<X size={14} />}
        onClick={onClear}
      />
    </Box>
  )
}

export default BulkActionBar
