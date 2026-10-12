/** Admin dashboard (§14.1): what needs attention now, plus headline numbers. */
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Card, CardContent, Grid, Link, List, ListItemButton, ListItemText, Typography, Alert } from '@mui/material'
import { PhoneCall, FileText, Package, Star, AlertTriangle, Boxes, Tag, Clock } from 'lucide-react'

import { PageContainer, PageHeader, StatCard, LoadingState, ErrorState } from '@/shared/components'
import { StatusChip, humanize } from '@/shared/components/fy'
import { DASHBOARD } from '@/services/admin.api'
import { usePermissions } from '@/features/permissions'
import { formatPaise } from '@/utils/money'
import { formatRelativeTime } from '@/utils/dateFormatter'

const Attention = ({ to, count, label, tone = 'warning' }) =>
  count > 0 ? (
    <Alert severity={tone} action={<Link component={RouterLink} to={to} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Open</Link>} sx={{ mb: 1 }}>
      <strong>{count}</strong> {label}
    </Alert>
  ) : null

const Dashboard = () => {
  const navigate = useNavigate()
  const { me } = usePermissions()
  const { data, loading, error } = useQuery(DASHBOARD, { fetchPolicy: 'cache-and-network', pollInterval: 120_000 })
  if (loading && !data) return <LoadingState message="Loading dashboard…" />
  if (error) return <ErrorState title="Could not load the dashboard" message={error.message} />
  const d = data.dashboard

  return (
    <PageContainer>
      <PageHeader title={`Welcome, ${me?.name?.split(' ')[0] || ''}`} subtitle="What needs attention today" />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="New enquiries" value={String(d.enquiries.new_count)} icon={<PhoneCall size={20} />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Call-backs open" value={String(d.enquiries.callbacks_open)} icon={<Clock size={20} />} color="warning" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Quotes awaiting customer" value={String(d.quotations.awaiting_decision)} icon={<FileText size={20} />} color="info" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Orders to confirm" value={String(d.orders.pending_confirmation)} icon={<Package size={20} />} color="success" /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}><AlertTriangle size={18} /> Needs attention</Typography>
              <Attention to="/enquiries?callbackOverdue=1" count={d.enquiries.callbacks_overdue} label="call-backs are overdue" tone="error" />
              <Attention to="/enquiries?requestType=quotation" count={d.enquiries.quotations_to_prepare} label="quotation requests to prepare" />
              <Attention to="/enquiries?assigned=me" count={d.enquiries.assigned_to_me} label="open enquiries assigned to you" tone="info" />
              <Attention to="/quotations?expiring=1" count={d.quotations.expiring_soon} label="sent quotations expire within 3 days" />
              <Attention to="/quotations?status=draft" count={d.quotations.drafts} label="draft quotations not yet sent" tone="info" />
              <Attention to="/orders?status=pending_confirmation" count={d.orders.pending_confirmation} label="accepted quotations need order confirmation" tone="success" />
              <Attention to="/reviews" count={d.reviews.pending_verification + d.reviews.pending_moderation} label="reviews waiting for verification or moderation" tone="info" />
              <Attention to="/products?missingHindi=1" count={d.products.missing_hindi} label="published products have no Hindi translation" tone="info" />
              <Attention to="/products" count={d.products.missing_images} label="published products have no image" tone="error" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Latest enquiries</Typography>
              <List dense disablePadding>
                {d.recent_enquiries.map((e) => (
                  <ListItemButton key={e.id} onClick={() => navigate(`/enquiries/${e.id}`)} sx={{ borderRadius: 2 }}>
                    <ListItemText primary={<><strong>{e.enquiry_number}</strong> · {e.contact_name}</>} secondary={`${humanize(e.request_type)} · ${formatPaise(e.total_paise)} · ${formatRelativeTime(e.created_at)}`} />
                    <StatusChip status={e.status} />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}><Boxes size={18} /> Catalogue</Typography>
            <Typography variant="body2">{d.products.published} published · {d.products.drafts} drafts · {d.products.out_of_stock} out of stock</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}><Tag size={18} /> Offers</Typography>
            <Typography variant="body2">{d.promotions.active} live · {d.promotions.upcoming} upcoming · {d.promotions.ending_this_week} ending this week</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}><Star size={18} /> Sales (30 days)</Typography>
            <Typography variant="body2">{d.quotations.accepted_30d} quotations accepted · orders worth {formatPaise(d.orders.value_30d)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12}>
          <Card><CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Most enquired products</Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {d.top_products.map((p) => (
                <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Link component={RouterLink} to={`/products/${p.id}`}>{p.name}</Link>
                  <Typography variant="body2" color="text.secondary">{p.enquiry_count} enquiries · {p.view_count} views</Typography>
                </Box>
              ))}
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </PageContainer>
  )
}

export default Dashboard
