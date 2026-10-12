import { Suspense, useCallback, useMemo, useState } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { CssBaseline, ThemeProvider } from '@mui/material'

import Layout from '@/app/layout/Layout'
import ProtectedRoute from '@/app/ProtectedRoute'
import { apolloClient } from '@/lib/graphql/client'
import { getTheme } from '@/theme/theme'
import { protectedRoutes, publicRoutes } from '@/app/routes.config'
import { ROUTER_BASENAME, STORAGE_KEYS } from '@/core/config/app.config'
import { getItem, setItem } from '@/lib/storage'
import { PermissionsProvider, RequirePermission } from '@/features/permissions'
import GlobalErrorToast from '@/shared/components/GlobalErrorToast'
import LoadingState from '@/shared/components/LoadingState'
import NotFound from '@/pages/NotFound/NotFound'

const isValidMode = (value) => value === 'light' || value === 'dark'

function App() {
  const [mode, setMode] = useState(() => {
    const stored = getItem(STORAGE_KEYS.themeMode)
    return isValidMode(stored) ? stored : 'light'
  })
  const theme = useMemo(() => getTheme(mode), [mode])
  const toggleTheme = useCallback(() => {
    setMode((previous) => {
      const next = previous === 'light' ? 'dark' : 'light'
      setItem(STORAGE_KEYS.themeMode, next)
      return next
    })
  }, [])

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalErrorToast />
        <Router basename={ROUTER_BASENAME}>
          <Routes>
            {publicRoutes.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />} />
            ))}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <PermissionsProvider>
                    <Layout toggleTheme={toggleTheme} mode={mode}>
                      <Suspense fallback={<LoadingState message="Loading…" />}>
                        <Routes>
                          {protectedRoutes.map(({ path, element: Element, redirect, permission }) =>
                            redirect ? (
                              <Route key={path} path={path} element={<Navigate to={redirect} replace />} />
                            ) : (
                              <Route key={path} path={path} element={<RequirePermission permission={permission}><Element /></RequirePermission>} />
                            ),
                          )}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </PermissionsProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </ApolloProvider>
  )
}

export default App
