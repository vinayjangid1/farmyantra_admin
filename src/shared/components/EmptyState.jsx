import { Box, Typography } from '@mui/material'

import { EMPTY_STATE_URL } from '@/core/constants/branding'

/**
 * Reusable "no data" placeholder. Shows the brand empty-state illustration with
 * a title, optional description and an optional action (e.g. a Create button).
 *
 * @param {object}   props
 * @param {string}   props.title        headline, e.g. "No buyers found"
 * @param {string}   [props.description] supporting line
 * @param {React.ReactNode} [props.action] optional CTA rendered under the text
 * @param {string}   [props.image]       override the illustration source
 * @param {number}   [props.imageSize]   illustration width/height in px (default 180)
 */
const EmptyState = ({ title, description, action, image = EMPTY_STATE_URL, imageSize = 180 }) => (
  <Box
    sx={{
      width: '100%',
      minHeight: 280,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 1,
      px: 2,
      py: 6,
    }}
  >
    <Box
      component="img"
      src={image}
      alt=""
      aria-hidden
      sx={{ width: imageSize, height: imageSize, maxWidth: '70%', objectFit: 'contain', mb: 1 }}
    />
    {title && (
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
    )}
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {description}
      </Typography>
    )}
    {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
  </Box>
)

export default EmptyState
