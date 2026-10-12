import { useState, useCallback } from 'react'
import { Box, Typography, Avatar, Dialog, DialogContent, IconButton } from '@mui/material'
import { X } from 'lucide-react'

/** Hook for opening/closing the full-size image preview modal. */
export const useImagePreview = () => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const openPreview = useCallback((url, label = 'Image') => {
    if (!url) return
    setSelected({ url, label })
    setOpen(true)
  }, [])

  const closePreview = useCallback(() => {
    setOpen(false)
    setSelected(null)
  }, [])

  return { open, selected, openPreview, closePreview }
}

/** Full-screen image viewer — same UI as DocumentDetailsDialog. */
export const ImagePreviewDialog = ({ open, image, onClose }) => {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 5))
  const handleZoomOut = () => {
    setZoom((z) => {
      const newZoom = Math.max(z - 0.5, 1)
      if (newZoom <= 1) setPosition({ x: 0, y: 0 })
      return newZoom
    })
  }

  const handleRotateLeft = () => setRotation((r) => r - 90)
  const handleRotateRight = () => setRotation((r) => r + 90)

  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.25, 5))
    } else {
      setZoom((z) => {
        const newZoom = Math.max(z - 0.25, 1)
        if (newZoom <= 1) setPosition({ x: 0, y: 0 })
        return newZoom
      })
    }
  }

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setDragging(false)

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          boxShadow: 24,
          borderRadius: 2,
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          position: 'relative',
          bgcolor: 'black',
          overflow: 'hidden',
          userSelect: 'none',
        }}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Top bar — label + close */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            zIndex: 2,
          }}
        >
          {image?.label ? (
            <Typography
              variant="body1"
              sx={{
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.6)',
                px: 2,
                py: 0.75,
                borderRadius: 1,
                fontWeight: 600,
              }}
            >
              {image.label}
            </Typography>
          ) : (
            <Box />
          )}
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <X size={22} />
          </IconButton>
        </Box>

        {/* Zoom controls — bottom center */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            bgcolor: 'rgba(0,0,0,0.7)',
            borderRadius: 2,
            px: 1.5,
            py: 0.75,
            zIndex: 2,
            backdropFilter: 'blur(4px)',
          }}
        >
          <IconButton
            onClick={handleZoomOut}
            size="small"
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            disabled={zoom <= 1}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </IconButton>
          <Typography
            variant="caption"
            sx={{ color: 'white', fontWeight: 700, minWidth: 45, textAlign: 'center' }}
          >
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton
            onClick={handleZoomIn}
            size="small"
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            disabled={zoom >= 5}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </IconButton>
          <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.3)', mx: 0.5 }} />
          <IconButton
            onClick={handleRotateLeft}
            size="small"
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </IconButton>
          <IconButton
            onClick={handleRotateRight}
            size="small"
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </IconButton>
          <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.3)', mx: 0.5 }} />
          <IconButton
            onClick={handleReset}
            size="small"
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </IconButton>
        </Box>

        {/* Image */}
        {image?.url && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '70vh',
              p: 4,
              cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={image.url}
              alt={image.label || 'Preview'}
              draggable={false}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transition: dragging ? 'none' : 'transform 0.2s ease',
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Single document-style thumbnail with "Click to view full size". */
export const ImagePreviewThumbnail = ({
  url,
  label = 'Image',
  onPreview,
  width = 120,
  height = 80,
  fullWidth = false,
  emptyText = 'No image available',
}) => {
  if (!url) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    )
  }

  const handleClick = () => onPreview(url, label)

  if (fullWidth) {
    return (
      <Box sx={{ mt: 1 }}>
        <Box
          component="img"
          src={url}
          alt={label}
          onClick={handleClick}
          sx={{
            width: '100%',
            maxHeight: 240,
            objectFit: 'cover',
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'block',
            '&:hover': { opacity: 0.85, transform: 'scale(1.01)' },
          }}
        />
        <Typography
          variant="caption"
          color="primary"
          sx={{ display: 'block', mt: 0.5, cursor: 'pointer' }}
          onClick={handleClick}
        >
          Click to view full size
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Avatar
        src={url}
        variant="rounded"
        sx={{
          width,
          height,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            opacity: 0.8,
            transform: 'scale(1.05)',
          },
        }}
        onClick={handleClick}
      />
      <Typography
        variant="caption"
        color="primary"
        sx={{ display: 'block', mt: 0.5, cursor: 'pointer' }}
        onClick={handleClick}
      >
        Click to view full size
      </Typography>
    </Box>
  )
}

/** Grid of small thumbnails — each opens the preview modal. */
export const ImagePreviewGallery = ({ images, labels, onPreview, size = 92 }) => {
  const list = (images || []).filter(Boolean)
  if (!list.length) return null

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
      {list.map((url, i) => {
        const label = labels?.[i] || `Image ${i + 1}`
        return (
          <Box key={i} sx={{ textAlign: 'center' }}>
            <Avatar
              src={url}
              variant="rounded"
              sx={{
                width: size,
                height: size,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  opacity: 0.8,
                  transform: 'scale(1.05)',
                },
              }}
              onClick={() => onPreview(url, label)}
            />
            <Typography
              variant="caption"
              color="primary"
              sx={{ display: 'block', mt: 0.5, cursor: 'pointer', fontSize: '0.68rem' }}
              onClick={() => onPreview(url, label)}
            >
              View
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
