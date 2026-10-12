/**
 * Website builder: one place for everything the website shows that isn't a
 * product — sliders and posters in every position, the home page layout,
 * partner logos, farmer stories and trust numbers.
 */
import { useSearchParams } from 'react-router-dom'
import { Box, Card, Tab, Tabs } from '@mui/material'
import { ExternalLink, Image, LayoutList, Handshake, Users, ShieldCheck } from 'lucide-react'

import { PageContainer, PageHeader } from '@/shared/components'
import { usePermissions } from '@/features/permissions'
import { WEBSITE_URL } from '@/core/config/env'
import TrustContent from '@/pages/Marketing/TrustContent'
import PostersTab from './PostersTab'
import HomeLayoutTab from './HomeLayoutTab'
import PartnersTab from './PartnersTab'
import StoriesTab from './StoriesTab'

const WebsiteBuilder = () => {
  const { hasPermission } = usePermissions()
  const [params, setParams] = useSearchParams()
  const tabs = [
    { key: 'posters', label: 'Sliders & posters', icon: Image, read: 'admin:banners:read', write: 'admin:banners:write', Component: PostersTab },
    { key: 'layout', label: 'Home page layout', icon: LayoutList, read: 'admin:content:read', write: 'admin:content:write', Component: HomeLayoutTab },
    { key: 'partners', label: 'Trusted partners', icon: Handshake, read: 'admin:content:read', write: 'admin:content:write', Component: PartnersTab },
    { key: 'stories', label: 'Farmer stories', icon: Users, read: 'admin:content:read', write: 'admin:content:write', Component: StoriesTab },
    { key: 'trust', label: 'Trust numbers & proof', icon: ShieldCheck, read: 'admin:content:read', write: 'admin:content:write', Component: null },
  ].filter((t) => hasPermission(t.read))
  const current = tabs.find((t) => t.key === params.get('tab')) || tabs[0]

  return (
    <PageContainer>
      <PageHeader
        title="Website builder"
        subtitle="Sliders, posters, home page sections, partner logos and farmer stories — everything customers see on the website."
        actionLabel={WEBSITE_URL ? 'Open website' : undefined}
        actionIcon={<ExternalLink size={15} />}
        onAction={WEBSITE_URL ? () => window.open(WEBSITE_URL, '_blank', 'noopener') : undefined}
      />
      <Card sx={{ mb: 2.5, px: 1 }}>
        <Tabs value={current?.key || false} onChange={(_e, v) => setParams({ tab: v })} variant="scrollable" scrollButtons="auto">
          {tabs.map(({ key, label, icon: Icon }) => <Tab key={key} value={key} label={label} icon={<Icon size={16} />} iconPosition="start" sx={{ minHeight: 56 }} />)}
        </Tabs>
      </Card>
      <Box>
        {current?.key === 'trust' && <TrustContent embedded />}
        {current?.Component && <current.Component canWrite={hasPermission(current.write)} />}
      </Box>
    </PageContainer>
  )
}

export default WebsiteBuilder
