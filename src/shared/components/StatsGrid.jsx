import { Grid } from '@mui/material'
import StatCard from '@/shared/components/StatCard'

/**
 * Reusable stats grid — renders an array of stat objects using StatCard.
 * Each stat: { title, value, icon, color }
 */
const StatsGrid = ({ stats = [] }) => {
  if (stats.length === 0) return null

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {stats.map((stat) => (
        <Grid item xs={6} sm={3} key={stat.title}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  )
}

export default StatsGrid
