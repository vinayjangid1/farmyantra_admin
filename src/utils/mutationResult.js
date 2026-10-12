/**
 * Runs a mutation that returns the API's standard `{ success, message }` payload
 * and reports the outcome to the operator.
 *
 * Motivation: the delete handlers on the Videos, Vehicles and Raddi Categories
 * pages each contained the same block, and all of them reported the result only
 * through `console.log` / `console.error`. Because the confirmation dialog closed
 * either way, a rejected delete looked exactly like a successful one — the row
 * simply stayed in the table with no explanation. Six copies, six silent
 * failures.
 *
 * @param {object}   config
 * @param {Function} config.mutate          Apollo mutate function.
 * @param {object}   [config.variables]     Mutation variables.
 * @param {string}   config.responseKey     Root field of the response, e.g. 'deleteVideo'.
 * @param {Function} config.notify          `(message, severity) => void`, e.g. showSnackbar.
 * @param {string}   config.successMessage  Fallback text when the API sends none.
 * @param {string}   config.failureMessage  Fallback text for the failure case.
 * @param {Function} [config.onSuccess]     Runs only on success (close dialog, refetch).
 * @returns {Promise<boolean>} whether the mutation succeeded
 */
export const runMutationWithFeedback = async ({
  mutate,
  variables,
  responseKey,
  notify,
  successMessage,
  failureMessage,
  onSuccess,
}) => {
  try {
    const { data } = await mutate({ variables })
    const outcome = data?.[responseKey]

    if (outcome?.success) {
      notify(outcome.message || successMessage)
      onSuccess?.()
      return true
    }

    // A resolver that returns `success: false` is a real failure and must be
    // shown; previously this branch only wrote to the console.
    notify(outcome?.message || failureMessage, 'error')
    return false
  } catch (error) {
    notify(error?.message || failureMessage, 'error')
    return false
  }
}
