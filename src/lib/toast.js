import { useSyncExternalStore } from 'react'

/**
 * Minimal global toast store (no deps) for app-wide API error messages.
 *
 * The Apollo error link pushes a toast whenever any operation fails, and a
 * single <GlobalErrorToast> mounted at the app root renders it. One toast at a
 * time; a newer error replaces the current one.
 */

let current = null // { id, severity, message, operationName } | null
const listeners = new Set()
let seq = 0

const emit = () => listeners.forEach((fn) => fn())

/**
 * Show a toast.
 * @param {string} message
 * @param {{ severity?: 'error'|'warning'|'info'|'success', operationName?: string }} [opts]
 */
export const showToast = (message, opts = {}) => {
  if (!message) return
  current = {
    id: `toast_${Date.now()}_${seq++}`,
    severity: opts.severity || 'error',
    message: String(message),
    operationName: opts.operationName || null,
  }
  emit()
}

/** Convenience for the common case. */
export const showErrorToast = (message, operationName) =>
  showToast(message, { severity: 'error', operationName })

export const clearToast = () => {
  current = null
  emit()
}

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
const getSnapshot = () => current

/** Live current toast (or null). */
export const useToast = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
