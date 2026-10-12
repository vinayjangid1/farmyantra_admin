import { LOGIN_URL, STORAGE_KEYS } from '@/core/config/app.config'
import { getItem, removeItem, setItem } from '@/lib/storage'
import { logger } from '@/lib/logger'

/**
 * Admin session handling.
 *
 * Threat model note: the JWT lives in localStorage, which means any successful
 * XSS on this origin can read it. That is an accepted trade-off for this SPA —
 * the hardened alternative is an httpOnly, Secure, SameSite cookie issued by the
 * API, which requires a server change. Until then, the mitigations that matter
 * are (a) never rendering untrusted HTML, (b) a strict CSP (see nginx.conf), and
 * (c) short token lifetimes, which the expiry check below now actually enforces.
 */

const TOKEN_KEY = STORAGE_KEYS.authToken

/** Treat a token as expired this many seconds early, to avoid edge-of-expiry races. */
const EXPIRY_LEEWAY_SECONDS = 30

/**
 * Decodes a base64url segment to a UTF-8 string.
 * Handles multi-byte characters correctly, unlike `atob` alone.
 *
 * @param {string} segment
 * @returns {string}
 */
const base64UrlDecode = (segment) => {
  const normalised = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalised.length % 4 ? '='.repeat(4 - (normalised.length % 4)) : ''
  const binary = window.atob(normalised + padding)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Reads the claims out of a JWT without verifying its signature.
 *
 * This is NOT authentication — the client cannot verify a signature and must
 * never trust these claims for authorisation. It is only used to avoid sending
 * requests we already know are expired, and to log the user out promptly.
 * The API remains the sole authority on whether a token is valid.
 *
 * @param {string} token
 * @returns {Record<string, unknown>|null}
 */
export const decodeTokenClaims = (token) => {
  if (typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const claims = JSON.parse(base64UrlDecode(parts[1]))
    return claims && typeof claims === 'object' ? claims : null
  } catch {
    return null
  }
}

/**
 * @param {string} token
 * @returns {boolean} true only when the token carries an `exp` claim that has passed.
 *   Tokens without a readable `exp` are treated as valid so a format change on
 *   the API cannot lock every admin out of the panel.
 */
export const isTokenExpired = (token) => {
  const claims = decodeTokenClaims(token)
  if (!claims || typeof claims.exp !== 'number') return false

  const nowSeconds = Date.now() / 1000
  return claims.exp <= nowSeconds + EXPIRY_LEEWAY_SECONDS
}

/**
 * @param {string} token
 */
export const saveToken = (token) => {
  if (typeof token !== 'string' || !token.trim()) {
    logger.error('saveToken called without a valid token string; ignoring.')
    return
  }
  setItem(TOKEN_KEY, token)
}

/**
 * Returns the stored token, or null if absent or expired.
 * An expired token is cleared as a side effect so it cannot be reused.
 *
 * @returns {string|null}
 */
export const getToken = () => {
  const token = getItem(TOKEN_KEY)
  if (!token) return null

  if (isTokenExpired(token)) {
    logger.info('Stored session token has expired; clearing it.')
    removeItem(TOKEN_KEY)
    return null
  }

  return token
}

export const removeToken = () => {
  removeItem(TOKEN_KEY)
}

/**
 * @returns {boolean} whether a usable (present, unexpired) token exists.
 */
export const isAuthenticated = () => Boolean(getToken())

/**
 * Clears the session and sends the browser to the login screen.
 *
 * Uses LOGIN_URL rather than a bare '/login' because a `window.location`
 * redirect bypasses react-router and does not get the basename prepended.
 * `replace` is used so the expired page does not stay in the back-history.
 *
 * Safe to call from anywhere (including the Apollo error link) — it no-ops when
 * already on the login screen, which prevents redirect loops.
 */
export const logout = () => {
  removeToken()

  const alreadyOnLogin = window.location.pathname === LOGIN_URL
  if (!alreadyOnLogin) {
    window.location.replace(LOGIN_URL)
  }
}
