import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Paper, Typography } from '@mui/material'
import { useMutation } from '@apollo/client'
import { LockKeyhole } from 'lucide-react'

import CustomTextField from '@/shared/components/CustomTextField'
import CustomButton from '@/shared/components/CustomButton'
import { LOGIN } from '@/services/admin.api'
import { isAuthenticated, saveToken } from '@/services/auth.service'
import { ROUTES } from '@/core/config/app.config'
import { APP_LOGO_URL } from '@/core/constants/branding'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [login, { loading }] = useMutation(LOGIN)

  if (isAuthenticated()) return <Navigate to={ROUTES.dashboard} replace />

  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      const { data } = await login({ variables: { email: email.trim(), password } })
      const result = data?.login
      if (!result?.success) {
        setError(result?.message || 'Sign-in failed')
        return
      }
      saveToken(result.token)
      navigate(location.state?.from || ROUTES.dashboard, { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2, background: 'linear-gradient(150deg, #1F4D2B 0%, #12301B 60%, #0b1f11 100%)' }}>
      <Paper component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 }, borderRadius: 4 }} elevation={8}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box component="img" src={APP_LOGO_URL} alt="" sx={{ width: 44, height: 44 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>FarmYantra Admin</Typography>
            <Typography variant="caption" color="text.secondary">Enquiries · Quotations · Catalogue · Team</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <CustomTextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <CustomTextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
          <CustomButton type="submit" variant="contained" size="large" loading={loading} startIcon={<LockKeyhole size={16} />} label="Sign in" fullWidth />
          <Typography variant="caption" color="text.secondary">
            Accounts are created by the Super Admin. Repeated failed sign-ins lock the account for 15 minutes.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login
