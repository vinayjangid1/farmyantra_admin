import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App.jsx'
import { getEnvErrors } from '@/core/config/env'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html.')
}

/**
 * Refuse to boot on a misconfigured build.
 *
 * Without this the app mounts, every GraphQL call silently posts to `undefined`,
 * and the operator sees an empty dashboard with no indication why. Failing here
 * with a readable message turns a confusing outage into a one-line fix.
 */
const envErrors = getEnvErrors()

if (envErrors.length > 0) {
  rootElement.innerHTML = ''

  const panel = document.createElement('div')
  panel.setAttribute('role', 'alert')
  panel.style.cssText =
    'max-width:44rem;margin:4rem auto;padding:1.5rem;border:1px solid #DC2626;' +
    'border-radius:12px;font:14px/1.6 system-ui,sans-serif;color:#111827;background:#FEF2F2'

  const heading = document.createElement('h1')
  heading.textContent = 'Configuration error'
  heading.style.cssText = 'margin:0 0 .5rem;font-size:1.125rem;color:#991B1B'

  const intro = document.createElement('p')
  intro.textContent = 'The admin panel was built without the required environment variables:'
  intro.style.margin = '0 0 .75rem'

  const list = document.createElement('ul')
  list.style.margin = '0'
  // textContent (never innerHTML) so nothing here can be interpreted as markup.
  for (const message of envErrors) {
    const item = document.createElement('li')
    item.textContent = message
    list.appendChild(item)
  }

  panel.append(heading, intro, list)
  rootElement.appendChild(panel)
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
