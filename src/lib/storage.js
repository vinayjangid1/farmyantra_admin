import { logger } from '@/lib/logger'

/**
 * localStorage wrapper that never throws.
 *
 * Raw localStorage access throws in several real situations: Safari private
 * browsing, storage quota exceeded, and browsers configured to block site data.
 * An uncaught throw here would take down the whole app during render, so every
 * access is guarded and failures degrade to a null read / silent no-op write.
 */

const isAvailable = (() => {
  try {
    const probe = '__storage_probe__'
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return true
  } catch {
    logger.warn('localStorage is unavailable; settings will not persist for this session.')
    return false
  }
})()

/**
 * @param {string} key
 * @returns {string|null}
 */
export const getItem = (key) => {
  if (!isAvailable) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {boolean} whether the write succeeded
 */
export const setItem = (key, value) => {
  if (!isAvailable) return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    logger.warn(`Failed to persist "${key}" to localStorage.`)
    return false
  }
}

/**
 * @param {string} key
 */
export const removeItem = (key) => {
  if (!isAvailable) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* nothing useful to do */
  }
}

export const storage = { getItem, setItem, removeItem, isAvailable }

export default storage
