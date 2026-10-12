import { useState, useRef, useEffect } from 'react'
import { Box, IconButton, Typography, Avatar, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import { X, Camera } from 'lucide-react'
import { validateImageFile, createImagePreview, revokeImagePreview } from '@/utils/imageUtils'

const StyledBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  minHeight: 200,
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: theme.palette.grey[50],
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary[50],
  },
  '&.has-image': {
    borderStyle: 'solid',
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary[50],
  },
}))

const PreviewImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 8,
})

const DeleteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
  zIndex: 2,
}))

const ImagePicker = ({
  value, // File object or URL string
  onChange,
  onRemove,
  onImageSelect,
  onImageRemove,
  previewUrl: previewUrlProp,
  label = 'Upload Image',
  accept = 'image/*',
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false,
  loading = false,
  error,
  helperText,
  sx,
}) => {
  // Support both old API (onImageSelect/onImageRemove/previewUrl) and new API (onChange/onRemove/value)
  const handleChange = onChange || onImageSelect
  const handleRemoveAction = onRemove || onImageRemove
  const initialValue = value || previewUrlProp || null
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Handle URL strings (existing images) vs File objects (new uploads)
  useEffect(() => {
    if (typeof initialValue === 'string' && initialValue) {
      setPreviewUrl(initialValue)
    } else if (initialValue instanceof File) {
      const url = createImagePreview(initialValue)
      setPreviewUrl(url)
      return () => revokeImagePreview(url)
    } else {
      setPreviewUrl(null)
    }
  }, [initialValue])

  const handleFileSelect = (file) => {
    if (!file) return

    const validation = validateImageFile(file, { maxSizeMB, allowedTypes })
    if (!validation.isValid) {
      if (error) error(validation.error)
      return
    }

    handleChange(file)
  }

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    if (!disabled && !loading) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)

    if (disabled || loading) return

    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    if (handleRemoveAction) {
      handleRemoveAction()
    } else {
      handleChange(null)
    }
    setPreviewUrl(null)
  }

  const hasImage = !!previewUrl

  return (
    <Box sx={sx}>
      <StyledBox
        className={hasImage ? 'has-image' : ''}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          opacity: disabled ? 0.6 : 1,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          ...(dragOver && { borderColor: 'primary.main', backgroundColor: 'primary.100' }),
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled || loading}
        />

        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Uploading...
            </Typography>
          </Box>
        ) : hasImage ? (
          <>
            <PreviewImage src={previewUrl} alt="Preview" />
            <DeleteButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
            >
              <X size={16} />
            </DeleteButton>
            <Box position="absolute" bottom={8} left={8} right={8}>
              <Typography
                variant="caption"
                color="primary"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  padding: '4px 8px',
                  borderRadius: 1,
                }}
              >
                Click to change image
              </Typography>
            </Box>
          </>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
              <Camera size={30} />
            </Avatar>
            <Box textAlign="center">
              <Typography variant="h6" color="primary" gutterBottom>
                {label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag & drop an image here, or click to select
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Max size: {maxSizeMB}MB • Formats:{' '}
                {allowedTypes.map((type) => type.split('/')[1]).join(', ')}
              </Typography>
            </Box>
          </Box>
        )}
      </StyledBox>

      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  )
}

export default ImagePicker
