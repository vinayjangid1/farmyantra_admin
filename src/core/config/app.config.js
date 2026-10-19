import { BASE_URL } from '@/core/config/env'

/** Router basename. Kept in sync with Vite's `base` via BASE_URL. */
export const ROUTER_BASENAME = BASE_URL

/** In-app (router-relative) route paths. */
export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
}

/** Single app (no CRM split as in Raddiwalla) — everyone lands on the dashboard. */
export const landingPathForAccess = () => ROUTES.dashboard

/** Absolute browser URL for the login screen, including the base path. */
export const LOGIN_URL = `${BASE_URL.replace(/\/$/, '')}${ROUTES.login}`

/** localStorage keys, centralised so nothing writes a stray key. */
export const STORAGE_KEYS = {
  authToken: 'fy_admin_auth_token',
  themeMode: 'fy-admin-theme-mode',
  pushToken: 'fy_admin_push_token',
}
