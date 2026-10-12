/**
 * A small live preview of a poster, laid out the way the website draws it:
 * background colour, picture (cover or contain), and the text block on the
 * left, centre or right in light or dark text.
 */
import { Box, Typography } from '@mui/material'

import { posterImageUrl } from './posterMeta'

const PosterPreview = ({ banner, variant, ratio = '3 / 1', imageOverride, compact = false }) => {
  const pos = banner.text_position || 'left'
  const dark = banner.text_theme === 'dark'
  const contain = banner.image_fit === 'contain'
  const src = imageOverride || posterImageUrl(variant?.image_url)
  const hasText = variant?.headline || variant?.subheadline || variant?.cta_label
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: ratio,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: banner.bg_color || (contain ? '#2874F0' : 'grey.200'),
        color: dark ? '#172337' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: pos === 'center' ? 'center' : pos === 'right' ? 'flex-end' : 'flex-start',
        textAlign: pos,
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt=""
          sx={{
            position: 'absolute',
            inset: contain ? 'auto 0 0 auto' : 0,
            width: contain ? '50%' : '100%',
            height: contain ? '100%' : '100%',
            objectFit: contain ? 'contain' : 'cover',
            objectPosition: contain ? 'right bottom' : `${(variant?.focal_x ?? 0.5) * 100}% ${(variant?.focal_y ?? 0.5) * 100}%`,
            ...(contain && pos === 'right' ? { inset: 'auto auto 0 0', objectPosition: 'left bottom' } : {}),
            ...(contain && pos === 'center' ? { opacity: 0.25, width: '100%' } : {}),
          }}
        />
      ) : (
        <Typography variant="caption" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>No picture yet</Typography>
      )}
      {hasText && !contain && (
        <Box sx={{ position: 'absolute', inset: 0, background: dark ? 'none' : `linear-gradient(${pos === 'right' ? 270 : pos === 'center' ? 0 : 90}deg, rgba(0,0,0,.55), rgba(0,0,0,0) 70%)` }} />
      )}
      {hasText && (
        <Box sx={{ position: 'relative', p: compact ? 1.25 : 2.5, maxWidth: pos === 'center' ? '80%' : '55%' }}>
          {variant?.headline && <Typography sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: compact ? '0.85rem' : '1.35rem', color: 'inherit' }}>{variant.headline}</Typography>}
          {variant?.subheadline && !compact && <Typography sx={{ mt: 0.5, fontSize: '0.8rem', opacity: 0.9, color: 'inherit' }}>{variant.subheadline}</Typography>}
          {variant?.cta_label && (
            <Box component="span" sx={{ display: 'inline-block', mt: compact ? 0.5 : 1.25, px: compact ? 1 : 1.75, py: compact ? 0.25 : 0.75, borderRadius: 1.5, fontSize: compact ? '0.65rem' : '0.8rem', fontWeight: 700, bgcolor: dark ? '#172337' : '#fff', color: dark ? '#fff' : '#2874F0' }}>
              {variant.cta_label}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default PosterPreview
