/**
 * Desktop push alerts via Firebase Cloud Messaging. The browser's FCM token is
 * registered with the API (NotificationBell), which then pushes every admin
 * bell notification the member is allowed to see. public/push-sw.js shows them.
 *
 * Deliberately free of Apollo/auth imports: logout() calls forgetPushToken(),
 * and the Apollo client imports auth.service.
 */
import { BASE_URL, FIREBASE_CONFIG, FIREBASE_VAPID_KEY, GRAPHQL_ENDPOINT } from '@/core/config/env'
import { getItem, removeItem, setItem } from '@/lib/storage'
import { STORAGE_KEYS } from '@/core/config/app.config'

export const isPushSupported = () =>
  Boolean(FIREBASE_VAPID_KEY && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.appId) &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export const pushPermission = () => (isPushSupported() ? Notification.permission : 'unsupported')

/** Asks for permission when needed (call from a click). Returns the permission. */
export const requestPushPermission = async () => (isPushSupported() ? Notification.requestPermission() : 'unsupported')

/** FCM token for this browser, or null when push is unavailable or not allowed. */
export const getPushToken = async () => {
  if (pushPermission() !== 'granted') return null
  const { initializeApp, getApps, getApp } = await import('firebase/app')
  const { getMessaging, getToken, isSupported } = await import('firebase/messaging')
  if (!(await isSupported())) return null
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG)
  const serviceWorkerRegistration = await navigator.serviceWorker.register(`${BASE_URL}push-sw.js`, { scope: BASE_URL })
  const token = await getToken(getMessaging(app), { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration })
  if (token) setItem(STORAGE_KEYS.pushToken, token)
  return token
}

/** Sign-out: stop sending this member's alerts to this browser. Fire-and-forget. */
export const forgetPushToken = () => {
  const token = getItem(STORAGE_KEYS.pushToken)
  if (!token) return
  removeItem(STORAGE_KEYS.pushToken)
  fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'mutation UnregisterPushToken($token: String!) { unregisterPushToken(token: $token) { success } }',
      variables: { token },
    }),
    keepalive: true,
  }).catch(() => {})
}
