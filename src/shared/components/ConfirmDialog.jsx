import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material'
import { AlertTriangle } from 'lucide-react'
import CustomButton from '@/shared/components/CustomButton'

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  severity = 'error',
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: severity === 'error' ? 'error.main' : 'warning.main',
            color: 'white',
            opacity: 0.9,
          }}
        >
          <AlertTriangle size={20} />
        </Box>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      <Typography color="text.secondary" component="div">{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
      <CustomButton label={cancelLabel} variant="outlined" onClick={onClose} disabled={loading} />
      <CustomButton
        label={confirmLabel}
        variant="contained"
        color={severity === 'error' ? 'error' : 'primary'}
        onClick={onConfirm}
        loading={loading}
      />
    </DialogActions>
  </Dialog>
)

export default ConfirmDialog
