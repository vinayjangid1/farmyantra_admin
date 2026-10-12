import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Typography } from '@mui/material'
import { useMutation } from '@apollo/client'
import { Check, LockKeyhole } from 'lucide-react'

import CustomTextField from '@/shared/components/CustomTextField'
import CustomButton from '@/shared/components/CustomButton'
import { LOGIN } from '@/services/admin.api'
import { isAuthenticated, saveToken } from '@/services/auth.service'
import { APP_LOGO_URL } from '@/core/constants/branding'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [login, { loading }] = useMutation(LOGIN)

  if (isAuthenticated()) return <Navigate to="/" replace />

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
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, bgcolor: 'background.default' }}>
      {/* Brand panel */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#fff',
          background: 'radial-gradient(70% 60% at 85% 15%, rgba(255,225,27,.32), transparent 60%), linear-gradient(160deg, #1C5FD6 0%, #172337 70%)',
        }}
      >
        <Box component="svg" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '46%', opacity: 0.5 }}>
          {Array.from({ length: 15 }, (_, i) => {
            const x = (i / 14) * 2400 - 600
            return <path key={i} d={`M600 0 Q ${600 + (x - 600) * 0.35} 160 ${x} 400`} fill="none" stroke={i % 2 ? '#4f8ff7' : '#ffe11b'} strokeOpacity={i % 2 ? 0.6 : 0.45} strokeWidth="3" />
          })}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
          <Box sx={{ width: 46, height: 46, borderRadius: 3.5, p: 0.5, bgcolor: '#FFE11B' }}>
            <Box component="img" src={APP_LOGO_URL} alt="" sx={{ width: '100%', height: '100%', borderRadius: 2.5, objectFit: 'cover' }} />
          </Box>
          <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.03em' }}>FarmYantra</Typography>
        </Box>
        <Box sx={{ position: 'relative', maxWidth: 460 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: '2.8rem', lineHeight: 1.02, mb: 2 }}>
            Run the whole business from one place.
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.25 }}>
            {['Answer call-backs and prepare quotations', 'Confirm orders, production and delivery', 'Keep the catalogue, offers and team up to date'].map((line) => (
              <Box component="li" key={line} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'rgba(255,255,255,.82)' }}>
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,225,27,.2)', color: '#FFE11B' }}><Check size={13} strokeWidth={3} /></Box>
                {line}
              </Box>
            ))}
          </Box>
        </Box>
        <Typography variant="caption" sx={{ position: 'relative', color: 'rgba(255,255,255,.5)' }}>FarmYantra admin panel · for team members only</Typography>
      </Box>

      {/* Form */}
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
        <Box component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 400, animation: 'page-enter 480ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box component="img" src={APP_LOGO_URL} alt="" sx={{ width: 42, height: 42, borderRadius: 2.5 }} />
            <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>FarmYantra Admin</Typography>
          </Box>
          <Typography variant="h4" sx={{ mb: 0.75 }}>Sign in</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>Use the email and password your Super Admin gave you.</Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <CustomTextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <CustomTextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
            <CustomButton type="submit" variant="contained" size="large" loading={loading} startIcon={<LockKeyhole size={16} />} label="Sign in" fullWidth />
            <Typography variant="caption" color="text.secondary">
              Repeated failed sign-ins lock the account for 15 minutes.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Login
