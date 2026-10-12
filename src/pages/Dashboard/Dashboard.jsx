/**
 * Admin dashboard (§14.1): what needs attention now, how enquiries are
 * trending and how they convert, plus catalogue health. Trend and funnel
 * charts need `admin:reports:read`; without it those cards are hidden.
 */
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { alpha, Box, Button, Card, CardContent, Chip, Grid, List, ListItemButton, ListItemText, Stack, Typography, useTheme } from '@mui/material'
import { PhoneCall, FileText, Package, Clock, ArrowUpRight, CalendarDays, ListChecks, TrendingUp, Boxes, Tag, IndianRupee, Inbox } from 'lucide-react'

import { PageContainer, StatCard, LoadingState, ErrorState } from '@/shared/components'
import { StatusChip, humanize } from '@/shared/components/fy'
import { AreaTrend, BarList, Donut, FunnelBars, StackBar } from '@/shared/components/charts'
import { DASHBOARD, ENQUIRY_TREND, CONVERSION_FUNNEL } from '@/services/admin.api'
import { usePermissions } from '@/features/permissions'
import { formatPaise } from '@/utils/money'
import { formatRelativeTime } from '@/utils/dateFormatter'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const Panel = ({ title, icon: Icon, action, children, sx }) => (
  <Card sx={{ height: '100%', ...sx }}>
    <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        {Icon && (
          <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: (t) => alpha(t.palette.primary.main, 0.09), color: 'primary.main' }}>
            <Icon size={17} />
          </Box>
        )}
        <Typography variant="h6" sx={{ flex: 1, minWidth: 0 }} noWrap>{title}</Typography>
        {action}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { me, hasPermission } = usePermissions()
  const canReports = hasPermission('admin:reports:read')
  const { data, loading, error } = useQuery(DASHBOARD, { fetchPolicy: 'cache-and-network', pollInterval: 120_000 })
  const trend = useQuery(ENQUIRY_TREND, { variables: { days: 30 }, skip: !canReports, fetchPolicy: 'cache-and-network' })
  const funnel = useQuery(CONVERSION_FUNNEL, { variables: { days: 30 }, skip: !canReports, fetchPolicy: 'cache-and-network' })

  if (loading && !data) return <LoadingState message="Loading dashboard…" />
  if (error) return <ErrorState title="Could not load the dashboard" message={error.message} />
  const d = data.dashboard

  const P = theme.palette
  const C = {
    green: P.primary.main,
    mustard: P.custom.accent,
    coral: P.error.main,
    sky: P.info.main,
    violet: '#7C5CFA',
    teal: P.success.main,
  }

  const queue = [
    { label: 'Call-backs overdue', value: d.enquiries.callbacks_overdue, color: C.coral, to: '/enquiries?callbackOverdue=1' },
    { label: 'Quotations to prepare', value: d.enquiries.quotations_to_prepare, color: C.mustard, to: '/enquiries?requestType=quotation' },
    { label: 'Draft quotations', value: d.quotations.drafts, color: C.sky, to: '/quotations?status=draft' },
    { label: 'Quotes expiring in 3 days', value: d.quotations.expiring_soon, color: C.violet, to: '/quotations?expiring=1' },
    { label: 'Orders to confirm', value: d.orders.pending_confirmation, color: C.green, to: '/orders?status=pending_confirmation' },
    { label: 'Reviews to check', value: d.reviews.pending_verification + d.reviews.pending_moderation, color: C.teal, to: '/reviews' },
  ]
  const queueTotal = queue.reduce((s, q) => s + (q.value || 0), 0)
  const trendRows = trend.data?.enquiryTrend || []
  const trendTotal = trendRows.reduce((s, r) => s + (r.callbacks || 0) + (r.quotations || 0), 0)
  const f = funnel.data?.conversionFunnel
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <PageContainer>
      {/* Welcome banner */}
      <Card
        sx={{
          mb: 2.5,
          color: '#fff',
          border: 0,
          background: P.custom.heroGradient,
          '&::after': {
            content: '""',
            position: 'absolute',
            right: -80,
            top: -120,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(C.mustard, 0.45)}, transparent 65%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, md: 3.5 }, '&:last-child': { pb: { xs: 2.5, md: 3.5 } } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ opacity: 0.7, mb: 1 }}>
                <CalendarDays size={14} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{today}</Typography>
              </Stack>
              <Typography variant="h3" sx={{ color: '#fff', fontSize: { xs: '1.7rem', md: '2.3rem' }, mb: 0.75 }}>
                {greeting()}, {me?.name?.split(' ')[0] || 'there'}
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.75), maxWidth: 560 }}>
                {queueTotal > 0
                  ? `${queueTotal} ${queueTotal === 1 ? 'item needs' : 'items need'} your attention across enquiries, quotations, orders and reviews.`
                  : 'Nothing is waiting on you right now. New enquiries will appear here.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.25} sx={{ flexShrink: 0 }}>
              <Button component={RouterLink} to="/enquiries" variant="contained" startIcon={<Inbox size={16} />}>Open enquiries</Button>
              <Button component={RouterLink} to="/today" startIcon={<ListChecks size={16} />} sx={{ color: '#fff', bgcolor: alpha('#fff', 0.1), border: `1px solid ${alpha('#fff', 0.22)}`, '&:hover': { bgcolor: alpha('#fff', 0.18) } }}>
                Today
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Headline numbers */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} lg={3}><StatCard title="New enquiries" value={String(d.enquiries.new_count)} icon={<PhoneCall size={20} />} /></Grid>
        <Grid item xs={6} lg={3}><StatCard title="Call-backs open" value={String(d.enquiries.callbacks_open)} icon={<Clock size={20} />} color="warning" /></Grid>
        <Grid item xs={6} lg={3}><StatCard title="Quotes awaiting customer" value={String(d.quotations.awaiting_decision)} icon={<FileText size={20} />} color="info" /></Grid>
        <Grid item xs={6} lg={3}><StatCard title="Orders worth (30 days)" value={formatPaise(d.orders.value_30d)} icon={<IndianRupee size={20} />} color="success" /></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Enquiry trend */}
        {canReports && (
          <Grid item xs={12} lg={8}>
            <Panel
              title="Enquiries, last 30 days"
              icon={TrendingUp}
              action={<Chip size="small" label={`${trendTotal} total`} sx={{ fontWeight: 700 }} />}
            >
              {trendRows.length ? (
                <>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    {[['Call-back', C.mustard], ['Quotation', C.green]].map(([label, color]) => (
                      <Stack key={label} direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <AreaTrend
                    rows={trendRows}
                    series={[{ key: 'quotations', label: 'Quotation', color: C.green }, { key: 'callbacks', label: 'Call-back', color: C.mustard }]}
                    height={250}
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">{trend.loading ? 'Loading…' : 'No enquiries in the last 30 days yet.'}</Typography>
              )}
            </Panel>
          </Grid>
        )}

        {/* Work queue */}
        <Grid item xs={12} lg={canReports ? 4 : 6}>
          <Panel title="Work queue" icon={ListChecks}>
            <Donut segments={queue} centerLabel="waiting on the team" emptyLabel="All clear" size={156} />
          </Panel>
        </Grid>

        {/* Conversion funnel */}
        {canReports && (
          <Grid item xs={12} md={6} lg={4}>
            <Panel title="Conversion, 30 days" icon={Package} action={f ? <Chip size="small" color="success" label={`${f.enquiries ? Math.round((f.ordered / f.enquiries) * 100) : 0}% to order`} sx={{ fontWeight: 700 }} /> : null}>
              {f ? (
                <>
                  <FunnelBars steps={[{ label: 'Enquiries', value: f.enquiries }, { label: 'Quotation sent', value: f.quoted }, { label: 'Accepted', value: f.accepted }, { label: 'Ordered', value: f.ordered }]} color={C.green} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    Rejected {f.rejected} · Cancelled {f.cancelled}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">Loading…</Typography>
              )}
            </Panel>
          </Grid>
        )}

        {/* Product interest */}
        <Grid item xs={12} md={6} lg={canReports ? 4 : 6}>
          <Panel title="Most enquired machines" icon={TrendingUp} action={<Button size="small" component={RouterLink} to="/reports" endIcon={<ArrowUpRight size={14} />}>Reports</Button>}>
            {d.top_products.length ? (
              <BarList
                items={d.top_products.slice(0, 6).map((p) => ({ key: p.id, label: p.name, value: p.enquiry_count, secondary: p.view_count, to: `/products/${p.id}` }))}
                color={C.green}
                secondaryColor={C.mustard}
                valueLabel="enquiries"
                secondaryLabel="views"
              />
            ) : (
              <Typography variant="body2" color="text.secondary">No product enquiries yet.</Typography>
            )}
          </Panel>
        </Grid>

        {/* Catalogue & offers */}
        <Grid item xs={12} md={6} lg={4}>
          <Panel title="Catalogue health" icon={Boxes}>
            <StackBar
              parts={[
                { label: 'Published', value: d.products.published, color: C.green },
                { label: 'Drafts', value: d.products.drafts, color: alpha(P.text.primary, 0.25) },
                { label: 'Out of stock', value: d.products.out_of_stock, color: C.coral },
              ]}
            />
            <Stack spacing={1} sx={{ mt: 2.5 }}>
              {[
                [d.products.missing_images, 'published products have no image', '/products', C.coral],
                [d.products.missing_hindi, 'products have no Hindi translation', '/products?missingHindi=1', C.mustard],
              ].map(([count, label, to, color]) => (
                <Box key={label} component={RouterLink} to={to} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 2.5, textDecoration: 'none', color: 'text.primary', bgcolor: count ? alpha(color, 0.08) : 'action.hover', opacity: count ? 1 : 0.6 }}>
                  <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', minWidth: 28 }}>{count}</Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>{label}</Typography>
                  <ArrowUpRight size={15} />
                </Box>
              ))}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Tag size={16} color={C.coral} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>{d.promotions.active}</strong> live offers · {d.promotions.upcoming} upcoming
              </Typography>
              {d.promotions.ending_this_week > 0 && <Chip size="small" color="warning" label={`${d.promotions.ending_this_week} ending this week`} />}
            </Stack>
          </Panel>
        </Grid>

        {/* Latest enquiries */}
        <Grid item xs={12} lg={canReports ? 12 : 6}>
          <Panel title="Latest enquiries" icon={Inbox} action={<Button size="small" component={RouterLink} to="/enquiries" endIcon={<ArrowUpRight size={14} />}>View all</Button>}>
            {d.recent_enquiries.length ? (
              <List dense disablePadding sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: canReports ? '1fr 1fr' : '1fr' }, columnGap: 1.5 }}>
                {d.recent_enquiries.map((e) => (
                  <ListItemButton key={e.id} onClick={() => navigate(`/enquiries/${e.id}`)} sx={{ borderRadius: 2.5, py: 1.1, gap: 1.5 }}>
                    <Box sx={{ width: 38, height: 38, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, color: P.custom.sidebar, bgcolor: alpha(e.request_type === 'callback' ? C.mustard : C.green, 0.18) }}>
                      {(e.contact_name || '?').trim()[0]?.toUpperCase()}
                    </Box>
                    <ListItemText
                      primary={<><strong>{e.contact_name}</strong> <Typography component="span" variant="caption" color="text.secondary">{e.enquiry_number}</Typography></>}
                      secondary={`${humanize(e.request_type)} · ${formatPaise(e.total_paise)} · ${formatRelativeTime(e.created_at)}`}
                    />
                    <StatusChip status={e.status} />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">No enquiries yet.</Typography>
            )}
          </Panel>
        </Grid>
      </Grid>
    </PageContainer>
  )
}

export default Dashboard
