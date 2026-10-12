import { Button, CircularProgress } from '@mui/material'
import { forwardRef } from 'react'

/**
 * Unified button component — delegates entirely to MUI Button.
 * The global theme (theme.js) handles all styling:
 *   - Rounded (borderRadius: 50)
 *   - Contained: black bg, white text (light) / white bg, black text (dark)
 *   - Outlined: black border + text
 *
 * Props:
 *   - label: button text
 *   - loading: shows spinner and disables
 *   - All standard MUI Button props (variant, color, onClick, etc.)
 */
const CustomButton = forwardRef(
  (
    {
      label,
      loading = false,
      children,
      startIcon,
      // Swallow legacy props so they don't hit the DOM
      modern: _m,
      gradient: _g,
      glass: _gl,
      ...props
    },
    ref,
  ) => (
    <Button
      ref={ref}
      {...props}
      disabled={loading || props.disabled}
      startIcon={loading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : startIcon}
    >
      {label}
      {children}
    </Button>
  ),
)

CustomButton.displayName = 'CustomButton'

export default CustomButton
