import { Box, Grid, Typography, Avatar, Chip, Link, useTheme, alpha } from '@mui/material'
import { Star, ExternalLink } from 'lucide-react'
import {
  formatCurrency,
  formatKg,
  formatNumber,
  toNumber,
} from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'
import {
  useImagePreview,
  ImagePreviewDialog,
  ImagePreviewGallery,
  ImagePreviewThumbnail,
} from '@/shared/components/ImagePreview'

/* ------------------------------------------------------------------ formatters */

export const fmtDate = (v) => (v ? formatDate(v, 'long') : '—')
export const fmtDateShort = (v) => (v ? formatDate(v, 'short') : '—')
export const fmtBool = (v) => (v === null || v === undefined ? '—' : v ? 'Yes' : 'No')
export const fmtText = (v) => (v === null || v === undefined || v === '' ? '—' : v)
export const fmtList = (v) => {
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  return fmtText(v)
}
export const fmtJson = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return v
}
export { formatCurrency, formatKg, formatNumber, toNumber }

export const hasCoords = (lat, lng) =>
  lat !== null && lat !== undefined && lng !== null && lng !== undefined
export const sameCoords = (lat1, lng1, lat2, lng2) =>
  hasCoords(lat1, lng1) &&
  hasCoords(lat2, lng2) &&
  Number(lat1) === Number(lat2) &&
  Number(lng1) === Number(lng2)

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg|avif|heic|heif)(\?|#|$)/i
export const isImageUrl = (u) => IMAGE_EXT.test(u || '')

/* ------------------------------------------------------------------ layout primitives */

export const Section = ({ icon, title, action, children, sx, color = 'primary' }) => {
  const theme = useTheme()
  const c = theme.palette[color]?.main || theme.palette.primary.main
  return (
    <Box
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: alpha(c, 0.12),
                color: c,
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  )
}

export const InfoRow = ({ label, value, full, mono }) => (
  <Grid item xs={12} sm={full ? 12 : 6}>
    <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: 'action.hover' }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'block',
          mb: 0.25,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontSize: '0.65rem',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          wordBreak: 'break-word',
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      >
        {value}
      </Typography>
    </Box>
  </Grid>
)

export const InfoGrid = ({ children, sx }) => (
  <Grid container spacing={2} sx={sx}>
    {children}
  </Grid>
)

export const Card = ({ children, sx }) => {
  const theme = useTheme()
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.text.primary, 0.015),
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: 1 },
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export const EmptyHint = ({ text }) => (
  <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
    {text}
  </Typography>
)

export const SubHeading = ({ children, sx }) => (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{
      display: 'block',
      mb: 1,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...sx,
    }}
  >
    {children}
  </Typography>
)

export const StatTile = ({ label, value, color = 'primary' }) => {
  const theme = useTheme()
  const c = theme.palette[color]?.main || theme.palette.primary.main
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: 1 },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'block',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontSize: '0.65rem',
        }}
      >
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color: c, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  )
}

export const MapLink = ({ lat, lng }) => {
  if (!hasCoords(lat, lng)) return <span>—</span>
  return (
    <Link
      href={`https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`}
      target="_blank"
      // noreferrer as well as noopener: without it the full admin URL (which
      // contains record ids) is sent to Google in the Referer header.
      rel="noopener noreferrer"
      underline="hover"
    >
      {lat}, {lng}
    </Link>
  )
}

/* ------------------------------------------------------------------ media */

export const ImageGallery = ({ images, labels, size = 92 }) => {
  const { open, selected, openPreview, closePreview } = useImagePreview()
  const list = (images || []).filter(Boolean)
  if (!list.length) return null

  return (
    <>
      <ImagePreviewGallery images={list} labels={labels} onPreview={openPreview} size={size} />
      <ImagePreviewDialog open={open} image={selected} onClose={closePreview} />
    </>
  )
}

export const MediaGallery = ({ items, labels, emptyText = 'No media' }) => {
  const { open, selected, openPreview, closePreview } = useImagePreview()
  const list = (items || []).filter(Boolean)
  if (!list.length) return <EmptyHint text={emptyText} />

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        {list.map((url, i) => {
          const label = labels?.[i] || `Media ${i + 1}`
          return isImageUrl(url) ? (
            <Box key={i}>
              <ImagePreviewThumbnail url={url} label={label} onPreview={openPreview} fullWidth />
            </Box>
          ) : (
            <Box
              key={i}
              component="video"
              src={url}
              controls
              preload="metadata"
              sx={{
                width: '100%',
                maxHeight: 240,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'common.black',
              }}
            />
          )
        })}
      </Box>
      <ImagePreviewDialog open={open} image={selected} onClose={closePreview} />
    </>
  )
}

export { ImagePreviewThumbnail, ImagePreviewDialog, useImagePreview }

/* ------------------------------------------------------------------ ratings */

export const RatingCard = ({ r }) => (
  <Card sx={{ mb: 1.5 }}>
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Avatar
          src={r.rated_by_profile_picture || undefined}
          sx={{ width: 30, height: 30, fontSize: '0.8rem' }}
        >
          {r.rated_by_name?.charAt(0)?.toUpperCase() || '?'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {fmtText(r.rated_by_name)}
            {r.rated_to_name ? (
              <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                {' '}
                → {r.rated_to_name}
              </Box>
            ) : null}
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Star size={13} style={{ color: '#F5A623' }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {toNumber(r.rating).toFixed(1)}
            </Typography>
            {r.rating_type && (
              <Chip
                label={r.rating_type}
                size="small"
                variant="outlined"
                sx={{ ml: 0.5, height: 18 }}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        {r.would_recommend && <Chip label="Recommends" size="small" color="success" />}
        {r.is_verified && <Chip label="Verified" size="small" color="primary" />}
        {r.is_hidden && <Chip label="Hidden" size="small" color="warning" />}
      </Box>
    </Box>
    {r.review_text && (
      <Typography variant="body2" sx={{ mb: 1 }}>
        {r.review_text}
      </Typography>
    )}
    {Array.isArray(r.tags) && r.tags.length > 0 && (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
        {r.tags.map((t, i) => (
          <Chip key={i} label={t} size="small" variant="outlined" />
        ))}
      </Box>
    )}
    <InfoGrid>
      <InfoRow label="Pickup ID" value={fmtText(r.pickup_id)} mono />
      <InfoRow label="Created" value={fmtDate(r.created_at)} />
    </InfoGrid>
  </Card>
)

export const RatingsSummaryBlock = ({ summary }) => {
  if (!summary) return <EmptyHint text="No ratings summary available" />
  return (
    <InfoGrid>
      <InfoRow label="User Role" value={fmtText(summary.user_role)} />
      <InfoRow
        label="Badge"
        value={
          summary.badge_level
            ? `${summary.badge_level}${summary.is_badge_eligible ? ' (eligible)' : ''}`
            : '—'
        }
      />
      <InfoRow
        label="Total Ratings Received"
        value={formatNumber(summary.total_ratings_received)}
      />
      <InfoRow label="Total Ratings Given" value={formatNumber(summary.total_ratings_given)} />
      <InfoRow
        label="As Seller — Avg"
        value={`${toNumber(summary.seller_average_rating).toFixed(1)} ★ (${formatNumber(summary.seller_total_ratings)})`}
      />
      <InfoRow
        label="As Buyer — Avg"
        value={`${toNumber(summary.buyer_average_rating).toFixed(1)} ★ (${formatNumber(summary.buyer_total_ratings)})`}
      />
      <InfoRow
        label="Seller star split (5→1)"
        value={`${formatNumber(summary.seller_5_star)} / ${formatNumber(summary.seller_4_star)} / ${formatNumber(summary.seller_3_star)} / ${formatNumber(summary.seller_2_star)} / ${formatNumber(summary.seller_1_star)}`}
      />
      <InfoRow
        label="Buyer star split (5→1)"
        value={`${formatNumber(summary.buyer_5_star)} / ${formatNumber(summary.buyer_4_star)} / ${formatNumber(summary.buyer_3_star)} / ${formatNumber(summary.buyer_2_star)} / ${formatNumber(summary.buyer_1_star)}`}
      />
      <InfoRow label="Reviews With Text" value={formatNumber(summary.total_reviews_with_text)} />
      <InfoRow label="Recommendations" value={formatNumber(summary.total_recommendations)} />
      <InfoRow label="Seller Top Tags" value={fmtList(summary.seller_top_tags)} full />
      <InfoRow label="Buyer Top Tags" value={fmtList(summary.buyer_top_tags)} full />
      <InfoRow label="Last Rating Received" value={fmtDate(summary.last_rating_received_at)} />
      <InfoRow label="Summary Updated" value={fmtDate(summary.updated_at)} />
    </InfoGrid>
  )
}

/* ------------------------------------------------------------------ tabs */

export const TabPanel = ({ value, index, children }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2.5 }}>
    {value === index && children}
  </Box>
)

export const ExternalIcon = ExternalLink
