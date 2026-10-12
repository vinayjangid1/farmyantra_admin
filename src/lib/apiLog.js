import { useSyncExternalStore } from 'react'
import { getItem, setItem } from '@/lib/storage'

/**
 * In-memory API log store for the dev/testing log drawer.
 *
 * A tiny subscribable store (no deps) that records every GraphQL operation —
 * name, variables/params, a redacted header summary, response/errors, and
 * timing — so the terminal-style ApiLogDrawer can show what the app sends and
 * receives. The Apollo recording link (see graphql/client.js) feeds this.
 *
 * Nothing here stores the raw bearer token; auth is recorded as a boolean so a
 * screenshot of the panel never leaks a session.
 */

const MAX_ENTRIES = 200
const ENABLED_KEY = 'api_log_enabled'

let entries = []
// Default ON: capture from app start so the drawer isn't empty the first time
// it's opened. Only an explicit "false" in storage disables it.
let enabled = getItem(ENABLED_KEY) !== 'false'

const entryListeners = new Set()
const enabledListeners = new Set()

const emitEntries = () => entryListeners.forEach((fn) => fn())
const emitEnabled = () => enabledListeners.forEach((fn) => fn())

let seq = 0

/**
 * Record one API call. Called by the Apollo recording link.
 *
 * Always records into a rolling buffer (the `enabled` flag only pauses capture
 * when explicitly turned off). This way, opening the drawer shows the calls that
 * already happened on the current screen instead of an empty panel.
 *
 * @param {object} entry { operationName, type, variables, authHeader, status, durationMs, response, errors }
 */
export const logApiCall = (entry) => {
  if (enabled === false) return
  const next = {
    id: `log_${Date.now()}_${seq++}`,
    at: new Date().toISOString(),
    ...entry,
  }
  // newest first, capped
  entries = [next, ...entries].slice(0, MAX_ENTRIES)
  emitEntries()
}

export const clearApiLog = () => {
  entries = []
  emitEntries()
}

export const isApiLogEnabled = () => enabled

export const setApiLogEnabled = (value) => {
  enabled = Boolean(value)
  setItem(ENABLED_KEY, enabled ? 'true' : 'false')
  emitEnabled()
}

export const toggleApiLog = () => setApiLogEnabled(!enabled)

/* ---- React bindings via useSyncExternalStore ---- */

const subscribeEntries = (cb) => {
  entryListeners.add(cb)
  return () => entryListeners.delete(cb)
}
const getEntriesSnapshot = () => entries

/** Live list of recorded API calls (newest first). */
export const useApiLogEntries = () =>
  useSyncExternalStore(subscribeEntries, getEntriesSnapshot, getEntriesSnapshot)

const subscribeEnabled = (cb) => {
  enabledListeners.add(cb)
  return () => enabledListeners.delete(cb)
}
const getEnabledSnapshot = () => enabled

/** Live enabled flag for the log drawer. */
export const useApiLogEnabled = () =>
  useSyncExternalStore(subscribeEnabled, getEnabledSnapshot, getEnabledSnapshot)
