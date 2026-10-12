import { Snackbar, Alert } from '@mui/material'

const SnackbarProvider = ({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 4000,
}) => (
  <Snackbar
    open={open}
    autoHideDuration={autoHideDuration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    <Alert
      onClose={onClose}
      severity={severity}
      variant="filled"
      sx={{ borderRadius: 2, width: '100%' }}
    >
      {message}
    </Alert>
  </Snackbar>
)

export default SnackbarProvider
