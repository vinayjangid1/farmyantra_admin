import { createLogger } from '@/lib/logger'

const log = createLogger('graphql')

/**
 * Shared Apollo `useQuery` options for admin screens.
 *
 * This exact helper was defined five separate times — as `baseOptions` in
 * analytics, broadcast, pincodeBoundaries and scraps services, and as
 * `userDetailOptions` in users.service — each an identical copy that logged the
 * operation name and the raw server response on failure.
 *
 * Two things changed while consolidating:
 *  - Logging goes through `@/lib/logger`, so the response body (which contains
 *    customer records) is debug-level and stripped from production builds. It was
 *    previously `console.error`-ed in full, in production, on every failure.
 *  - The error message stays at error level so genuine failures remain visible.
 *
 * @param {string} operationName name used in log output, e.g. 'useCustomerAnalytics'
 * @param {import('@apollo/client').QueryHookOptions} [options] per-call overrides
 */
export const liveQueryOptions = (operationName, options = {}) => ({
  // Admin data changes underneath the operator, so show cached data immediately
  // and refresh from the network.
  fetchPolicy: 'cache-and-network',
  // Required for `loading` to flip during refetches, which the list pages rely on.
  notifyOnNetworkStatusChange: true,
  onError: (error) => {
    log.error(`${operationName}: ${error.message}`)

    const serverResult = error.networkError?.result
    if (serverResult) {
      log.debug(`${operationName} server response:`, serverResult)
    }
    if (error.networkError?.statusCode) {
      log.debug(`${operationName} status code:`, error.networkError.statusCode)
    }
  },
  ...options,
})

export default liveQueryOptions
