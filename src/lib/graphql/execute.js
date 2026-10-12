import { apolloClient } from '@/lib/graphql/client'
import { markBusy } from '@/lib/busyButton'

/**
 * Imperative GraphQL helpers for services that are called outside React's render
 * cycle (event handlers, save flows) and therefore cannot use Apollo hooks.
 *
 * These replace a block that appeared 35 times, verbatim apart from names:
 *
 *   export const getThing = async () => {
 *     try {
 *       const { data } = await apolloClient.query({ query: GET_THING, fetchPolicy: 'network-only' })
 *       return data.getThing
 *     } catch (error) {
 *       console.error('Error fetching thing:', error)   // logs and rethrows:
 *       throw error                                    // adds nothing
 *     }
 *   }
 *
 * Three problems that are fixed by centralising it:
 *  - The catch only logged and rethrew, so it changed no behaviour while making
 *    every call site four lines longer.
 *  - `data.getThing` hardcoded the response key in the service, so renaming a
 *    field meant editing it in two places. It is now read from the query AST.
 *  - `fetchPolicy: 'network-only'` was repeated on every read; it is now a
 *    client-level default (see lib/graphql/client.js).
 *
 * Errors are intentionally NOT caught here: the Apollo error link already logs
 * them with operation context, and callers need the rejection to show the user a
 * failure message. Swallowing them is what caused the silent-delete bugs.
 */

/** Root field names are derived once per document and memoised. */
const rootFieldCache = new WeakMap()

/**
 * Returns the root field names selected by an operation, respecting aliases.
 *
 * @param {import('graphql').DocumentNode} document
 * @returns {string[]}
 */
const getRootFields = (document) => {
  const cached = rootFieldCache.get(document)
  if (cached) return cached

  const operation = document.definitions.find((def) => def.kind === 'OperationDefinition')
  const fields = (operation?.selectionSet?.selections || [])
    .filter((selection) => selection.kind === 'Field')
    .map((selection) => (selection.alias || selection.name).value)

  rootFieldCache.set(document, fields)
  return fields
}

/**
 * Unwraps a single-root-field response so callers get the payload directly
 * instead of `{ getThing: payload }`.
 *
 * Operations selecting several root fields are returned whole, since there is no
 * single value to unwrap.
 */
const unwrap = (data, document) => {
  if (!data) return null
  const fields = getRootFields(document)
  return fields.length === 1 ? data[fields[0]] : data
}

/**
 * Runs a query and returns its unwrapped payload.
 *
 * @param {import('graphql').DocumentNode} query
 * @param {Record<string, unknown>} [variables]
 * @param {import('@apollo/client').QueryOptions} [options] escape hatch, e.g. a different fetchPolicy
 * @returns {Promise<unknown>}
 */
export const gqlQuery = async (query, variables, options) => {
  const { data } = await apolloClient.query({ query, variables, ...options })
  return unwrap(data, query)
}

/**
 * Runs a mutation and returns its unwrapped payload.
 *
 * @param {import('graphql').DocumentNode} mutation
 * @param {Record<string, unknown>} [variables]
 * @param {import('@apollo/client').MutationOptions} [options]
 * @returns {Promise<unknown>}
 */
export const gqlMutate = async (mutation, variables, options) => {
  // Spinner on the button that started this mutation (see lib/busyButton).
  const release = markBusy()
  try {
    const { data } = await apolloClient.mutate({ mutation, variables, ...options })
    return unwrap(data, mutation)
  } finally {
    release()
  }
}
