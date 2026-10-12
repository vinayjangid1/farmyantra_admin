import { Box, CircularProgress, Typography } from '@mui/material'

const LoadingState = ({ message = 'Loading...', minHeight = 240 }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight,
      gap: 2,
    }}
  >
    <CircularProgress size={40} thickness={4} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
)

export default LoadingState
