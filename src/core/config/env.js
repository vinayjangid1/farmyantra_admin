/**
 * Single, validated entry point for every build-time environment variable.
 *
 * Rules enforced here:
 *  - No module reads `import.meta.env` directly, so there is one place to audit.
 *  - No production fallbacks. A misconfigured build must fail visibly rather
 *    than silently pointing a dev/staging bundle at production data.
 *  - Required vars are reported through `getEnvErrors()` so the app can render a
 *    readable message instead of throwing during module evaluation (which would
 *    render a blank white page with the cause buried in the console).
 *
 * Remember: every VITE_* value is inlined into the client bundle and is public.
 */

const rawEnv = import.meta.env

/** True for `vite dev`. Used to gate verbose logging. */
export const IS_DEV = rawEnv.DEV === true

/** True for production builds. */
export const IS_PROD = rawEnv.PROD === true

/**
 * Public base path the app is served from, e.g. `/admin/`.
 * Derived from Vite's `base` option so it is defined in exactly one place
 * (vite.config.js) and stays in sync with the router basename.
 */
export const BASE_URL = rawEnv.BASE_URL || '/'

const read = (key) => {
  const value = rawEnv[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Vars the app genuinely cannot run without. */
const REQUIRED_KEYS = ['VITE_GRAPHQL_ENDPOINT']

/** GraphQL endpoint. Required. */
export const GRAPHQL_ENDPOINT = read('VITE_GRAPHQL_ENDPOINT')

/**
 * @returns {string[]} Human-readable problems with the current configuration.
 *   Empty array means the configuration is usable.
 */
export const getEnvErrors = () => {
  const errors = []

  for (const key of REQUIRED_KEYS) {
    if (!read(key)) {
      errors.push(`${key} is not set. Copy .env.example and fill it in.`)
    }
  }

  const endpoint = read('VITE_GRAPHQL_ENDPOINT')
  if (endpoint && !/^https?:\/\//i.test(endpoint)) {
    errors.push(`VITE_GRAPHQL_ENDPOINT must be an absolute http(s) URL, got "${endpoint}".`)
  }
  if (IS_PROD && endpoint && endpoint.startsWith('http://')) {
    errors.push(
      'VITE_GRAPHQL_ENDPOINT uses plain http in a production build; auth tokens would be sent unencrypted.',
    )
  }

  return errors
}

/** Public website origin, used for "View on website" links. Optional. */
export const WEBSITE_URL = (read('VITE_WEBSITE_URL') || '').replace(/\/$/, '')
