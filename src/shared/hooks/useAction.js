import { useCallback, useState } from 'react'

import { apolloClient } from '@/lib/graphql/client'
import { showToast } from '@/lib/toast'

/**
 * Run an admin mutation that returns `{ success, message, code, data }` and
 * surface the outcome as a toast. Resolves to `data` on success and `null`
 * on failure, so callers can write `const saved = await run(...); if (saved) …`.
 *
 * Same intent as the Raddiwalla admin's runMutationWithFeedback, but bound to
 * the global toast so every page reports outcomes consistently.
 */
export const useAction = () => {
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (mutation, variables, { success, silent = false } = {}) => {
    setLoading(true)
    try {
      const { data } = await apolloClient.mutate({ mutation, variables })
      const result = Object.values(data || {})[0]
      if (!result?.success) {
        showToast(result?.message || 'The change could not be saved', { severity: 'error' })
        return null
      }
      if (!silent) showToast(success || result.message, { severity: 'success' })
      return result.data ?? true
    } catch {
      // Transport/GraphQL errors are already toasted by the Apollo error link.
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { run, loading }
}

export default useAction
