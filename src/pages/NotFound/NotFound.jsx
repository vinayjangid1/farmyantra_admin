import { Link } from 'react-router-dom'
import { Button } from '@mui/material'

import EmptyState from '@/shared/components/EmptyState'

const NotFound = () => (
  <EmptyState title="Page not found" description="This page does not exist in the admin panel." action={<Button component={Link} to="/dashboard" variant="contained">Back to dashboard</Button>} />
)

export default NotFound
