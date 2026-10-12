import { ApolloClient, ApolloLink, InMemoryCache, Observable, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { createUploadLink } from 'apollo-upload-client'
import { print } from 'graphql'

import { GRAPHQL_ENDPOINT, IS_DEV } from '@/core/config/env'
import { getToken, logout } from '@/services/auth.service'
import { logger } from '@/lib/logger'
import { logApiCall } from '@/lib/apiLog'
import { showErrorToast } from '@/lib/toast'

/** Placeholder substituted for the bearer token in debug output. */
const REDACTED = '<token redacted — read it from devtools > Application if you need it>'

/**
 * Builds a copy-pasteable cURL command for a GraphQL operation.
 *
 * The Authorization header is deliberately REDACTED. The previous version
 * embedded the live admin JWT, which turned every console line into a
 * ready-to-replay authenticated request — anything with console access (a
 * screenshot, a screen-share, a pasted bug report, a browser extension) leaked a
 * full admin session. Operation shape is the useful part for debugging; the
 * credential is not.
 */
const buildCurl = (operation) => {
  const body = JSON.stringify({
    operationName: operation.operationName,
    variables: operation.variables || {},
    query: print(operation.query),
  }).replace(/'/g, `'\\''`)

  return [
    `curl '${GRAPHQL_ENDPOINT}' \\`,
    `  -H 'content-type: application/json' \\`,
    `  -H 'authorization: Bearer ${REDACTED}' \\`,
    `  --data-raw '${body}'`,
  ].join('\n')
}

/**
 * Attaches the bearer token to every request.
 *
 * This is the ONLY place the token is read for network purposes. getToken()
 * returns null for an expired token, so an expired session sends no Authorization
 * header at all rather than a stale one.
 */
const authLink = setContext((_, { headers }) => {
  const token = getToken()
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

/**
 * Development-only operation tracing. Compiled out of production builds by the
 * IS_DEV guard, and additionally routed through `logger` so the calls are
 * stripped by esbuild. Logs operation name, variables and response shape —
 * never headers or tokens.
 */
const debugLink = new ApolloLink((operation, forward) => {
  if (!IS_DEV) return forward(operation)

  const name = operation.operationName || 'anonymous'
  const start = performance.now()

  logger.debug(`→ GraphQL ${name}`, operation.variables || {})

  return forward(operation).map((result) => {
    const ms = (performance.now() - start).toFixed(0)
    if (result.errors?.length) {
      logger.error(`✖ GraphQL ${name} (${ms}ms)`, result.errors)
      logger.debug(`Reproduce with:\n${buildCurl(operation)}`)
    } else {
      logger.debug(`← GraphQL ${name} (${ms}ms)`, result.data)
    }
    return result
  })
})

/**
 * Records every operation into the API log store that powers the terminal-style
 * log drawer (dev/testing). Reads the Authorization header from context (set by
 * authLink, which runs before this in the request path) but records only whether
 * a token was attached — never the token itself. No-ops unless the drawer is on.
 */
const apiLogLink = new ApolloLink((operation, forward) => {
  const now = () =>
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
  const started = now()

  // Token presence: context headers are only reliable after authLink, but fall
  // back to reading storage directly so we always record a sensible value.
  const { headers } = operation.getContext() || {}
  const authHeader = Boolean(headers?.authorization) || Boolean(getToken())

  const definition = operation.query?.definitions?.find((d) => d.kind === 'OperationDefinition')
  const type = definition?.operation || 'query'

  const base = {
    operationName: operation.operationName || 'anonymous',
    type,
    variables: operation.variables || {},
    authHeader,
  }

  // Subscribe manually so we capture BOTH the success path (`next`) and the
  // network-error path (`error`). `.map()` only runs on success, which is why
  // 400/500 responses previously never showed in the log.
  return new Observable((observer) => {
    let logged = false

    const subscription = forward(operation).subscribe({
      next: (result) => {
        logged = true
        logApiCall({
          ...base,
          durationMs: Math.round(now() - started),
          status: result.errors?.length ? 'error' : 'success',
          httpStatus: result.errors?.length ? 'GraphQL errors' : 200,
          errors: result.errors || null,
          response: result.data ?? null,
        })
        observer.next(result)
      },
      error: (networkError) => {
        logged = true
        logApiCall({
          ...base,
          durationMs: Math.round(now() - started),
          status: 'error',
          httpStatus: networkError?.statusCode || 'network error',
          // networkError.result holds the server's GraphQL error body on a 400.
          errors: networkError?.result?.errors || [
            { message: networkError?.message || String(networkError) },
          ],
          response: networkError?.result ?? null,
        })
        observer.error(networkError)
      },
      complete: () => {
        if (!logged) {
          logApiCall({
            ...base,
            durationMs: Math.round(now() - started),
            status: 'success',
            httpStatus: 200,
            errors: null,
            response: null,
          })
        }
        observer.complete()
      },
    })

    return () => subscription.unsubscribe()
  })
})

/** Matches the loose, message-based auth errors some resolvers return. */
const isAuthError = ({ extensions }) => extensions?.code === 'UNAUTHENTICATED'

/**
 * Picks the most meaningful human message from an Apollo failure:
 * a GraphQL error → the server's error body on a network failure (4xx/5xx) →
 * a friendly fallback (never the raw "Received status code N" transport string).
 */
const bestErrorMessage = (graphQLErrors, networkError) => {
  if (graphQLErrors?.length) return graphQLErrors[0].message
  const fromBody = networkError?.result?.errors?.[0]?.message
  if (fromBody) return fromBody
  if (networkError) {
    const raw = networkError.message || ''
    if (/received status code/i.test(raw)) return 'Something went wrong. Please try again.'
    return raw || 'Network error. Please check your connection.'
  }
  return ''
}

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const name = operation.operationName || 'anonymous'

  if (networkError) {
    logger.error(`GraphQL network failure on ${name}:`, networkError.message)
  }

  // Only a rejected session signs the operator out. FORBIDDEN means "your role
  // lacks this permission" and must be shown, not treated as a logout.
  const sessionRejected =
    graphQLErrors?.some(isAuthError) || networkError?.statusCode === 401

  if (sessionRejected) {
    // Clears the token and redirects to the basename-aware login URL.
    // Previously this used `window.location.href = '/login'`, which ignored the
    // router basename and navigated the browser out of the app entirely.
    logout()
    return
  }

  graphQLErrors?.forEach(({ message }) => {
    logger.error(`GraphQL error on ${name}: ${message}`)
  })

  // Surface a single app-wide error toast with the best server message.
  // (Auth rejections already redirected above and returned, so they don't toast.)
  const message = bestErrorMessage(graphQLErrors, networkError)
  if (message) {
    showErrorToast(message, name)
  }
})

const uploadLink = createUploadLink({
  uri: GRAPHQL_ENDPOINT,
  // Apollo Server CSRF prevention requires a non-simple header on multipart uploads.
  headers: { 'apollo-require-preflight': 'true' },
  // Send the auth cookie too if the API is ever migrated to cookie sessions.
  credentials: 'same-origin',
})

export const apolloClient = new ApolloClient({
  link: from([debugLink, errorLink, authLink, apiLogLink, uploadLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    // Admin data is frequently mutated by other operators, so one-off reads
    // always hit the network. This was previously repeated as an explicit
    // `fetchPolicy: 'network-only'` on every single service call.
    query: {
      fetchPolicy: 'network-only',
    },
  },
})

export default apolloClient
