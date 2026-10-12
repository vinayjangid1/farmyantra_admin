import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import { clearToast, useToast } from '@/lib/toast'

/**
 * App-wide error toast. A single instance is mounted at the app root; the Apollo
 * error link pushes messages into the toast store, so every failed API call
 * surfaces here with the real server message and a Dismiss button.
 */
const GlobalErrorToast = () => {
  const toast = useToast()

  return (
    <Snackbar
      open={Boolean(toast)}
      autoHideDuration={toast?.severity === 'error' ? 8000 : 5000}
      onClose={(_e, reason) => {
        // Don't dismiss on background clicks — only on timeout or the button.
        if (reason === 'clickaway') return
        clearToast()
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={toast?.severity || 'error'}
        variant="filled"
        onClose={clearToast}
        action={
          <Button color="inherit" size="small" onClick={clearToast} sx={{ fontWeight: 700 }}>
            Dismiss
          </Button>
        }
        sx={{ alignItems: 'center', maxWidth: 460, borderRadius: 2, boxShadow: 6 }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {toast?.message}
          </Typography>
          {toast?.operationName && toast.operationName !== 'anonymous' && (
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {toast.operationName}
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  )
}

export default GlobalErrorToast
