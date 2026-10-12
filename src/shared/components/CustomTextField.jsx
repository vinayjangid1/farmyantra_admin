import { TextField, styled } from '@mui/material'

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    position: 'relative',
    transform: 'none',
    marginBottom: 6,
    fontWeight: 600,
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
    letterSpacing: '0.01em',
    '&.Mui-focused': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
    '&.MuiInputLabel-shrink': {
      transform: 'none',
    },
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : theme.palette.background.paper,
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: theme.palette.grey[300],
      borderWidth: 1.5,
      top: 0,
      '& legend': {
        display: 'none',
      },
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 1.5,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}15`,
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '10px 16px',
    fontSize: '0.875rem',
    '&::placeholder': {
      color: theme.palette.text.disabled,
      opacity: 0.8,
    },
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginTop: 4,
    fontSize: '0.78rem',
    color: theme.palette.text.secondary,
  },
  '& .MuiSelect-select': {
    padding: '10px 16px',
  },
  '& .MuiOutlinedInput-multiline': {
    borderRadius: 12,
    padding: 0,
    '& .MuiOutlinedInput-input': {
      padding: '10px 16px',
    },
  },
  '& .MuiOutlinedInput-root.Mui-error': {
    '& fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.error.main,
      boxShadow: `0 0 0 3px ${theme.palette.error.main}15`,
    },
  },
  '& .MuiOutlinedInput-root.Mui-disabled': {
    backgroundColor: theme.palette.grey[50],
    '& fieldset': {
      borderColor: theme.palette.grey[200],
    },
  },
}))

const CustomTextField = ({ label, helperText, id, InputLabelProps, ...props }) => {
  const fieldId =
    id ||
    `textfield-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9)}`

  return (
    <StyledTextField
      id={fieldId}
      label={label}
      helperText={helperText}
      fullWidth
      variant="outlined"
      size="small"
      InputLabelProps={{ shrink: true, ...InputLabelProps }}
      {...props}
    />
  )
}

export default CustomTextField
