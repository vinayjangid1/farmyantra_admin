import { Navigate } from 'react-router-dom'

import { ROUTES } from '@/core/config/app.config'

/** Root landing redirect: everyone starts on the dashboard. */
const LandingRedirect = () => <Navigate to={ROUTES.dashboard} replace />

export default LandingRedirect
