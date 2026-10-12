import { useSyncExternalStore } from 'react'
import { getItem, setItem } from '@/lib/storage'

/**
 * Admin-wide "recently viewed" store — tiny localStorage-backed subscribable
 * store (same pattern as the toast store). Detail dialogs call `recordView(...)`
 * when they open; the command palette reads it via `useRecentlyViewed()`.
 *
 * Entries: { type, id, label, sub, path, at }. Capped, most-recent first,
 * deduped by `${type}:${id}`.
 */

const KEY = 'admin_recently_viewed'
const CAP = 12

const read = () => {
  try {
    const raw = getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

let cache = read()
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

/**
 * Record a visit.
 * @param {{ type: string, id: string, label: string, sub?: string, path?: string }} entry
 *   `path` is optional — admin detail views are dialogs, not routes, so an entry
 *   may carry no deep link (the palette just shows it as history).
 */
export const recordView = (entry) => {
  if (!entry?.id || !entry?.type) return
  const key = `${entry.type}:${entry.id}`
  const next = [
    { ...entry, sub: entry.sub || '', path: entry.path || '', at: Date.now() },
    ...cache.filter((e) => `${e.type}:${e.id}` !== key),
  ].slice(0, CAP)
  cache = next
  setItem(KEY, JSON.stringify(next))
  emit()
}

export const clearRecentlyViewed = () => {
  cache = []
  setItem(KEY, '[]')
  emit()
}

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
const getSnapshot = () => cache

/** Live recently-viewed list (most recent first). */
export const useRecentlyViewed = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
