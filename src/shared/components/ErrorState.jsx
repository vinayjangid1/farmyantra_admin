import { Alert, Box } from '@mui/material'

const ErrorState = ({ message, title = 'Something went wrong' }) => (
  <Box sx={{ width: '100%' }}>
    <Alert severity="error" sx={{ borderRadius: 2 }}>
      <strong>{title}:</strong> {message}
    </Alert>
  </Box>
)

export default ErrorState
