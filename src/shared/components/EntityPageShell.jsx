import { Grid } from '@mui/material'
import {
  PageContainer,
  PageHeader,
  StatCard,
  LoadingState,
  ErrorState,
} from '@/shared/components/index'

const EntityPageShell = ({
  title,
  subtitle,
  count,
  actionLabel,
  onAction,
  fullWidthAction,
  stats = [],
  error,
  loading,
  loadingMessage,
  filters,
  children,
}) => {
  if (error) {
    return (
      <PageContainer>
        <ErrorState title={`Error loading ${title.toLowerCase()}`} message={error.message} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={subtitle}
        count={count}
        actionLabel={actionLabel}
        onAction={onAction}
        fullWidthAction={fullWidthAction}
      />

      {stats.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat) => (
            <Grid item xs={6} sm={3} key={stat.title}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>
      )}

      {filters}

      {loading ? (
        <LoadingState message={loadingMessage || `Loading ${title.toLowerCase()}...`} />
      ) : (
        children
      )}
    </PageContainer>
  )
}

export default EntityPageShell
