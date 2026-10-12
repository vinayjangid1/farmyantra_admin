/**
 * Spinner on whichever button started a server action.
 *
 * A capture-phase listener remembers the last button the operator clicked (or
 * the submit button of a form). `markBusy()` — called by useAction when a
 * mutation starts — puts that button into a loading state (aria-busy, which
 * index.css turns into a spinner) and returns a function that clears it.
 * Every admin action that goes through useAction gets a loader this way,
 * without each page wiring its own state.
 */
let lastButton = null
let lastAt = 0

const remember = (el) => {
  const button = el?.closest?.('button, [role="button"], a.MuiButton-root')
  if (button) {
    lastButton = button
    lastAt = Date.now()
  }
}

if (typeof document !== 'undefined' && !window.__fyBusyButton) {
  window.__fyBusyButton = true
  document.addEventListener('click', (event) => remember(event.target), true)
  document.addEventListener('submit', (event) => remember(event.submitter), true)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') remember(document.activeElement)
  }, true)
}

const busyCount = new WeakMap()

/** Marks the button the operator just used as busy. Returns a release function. */
export const markBusy = () => {
  const button = lastButton
  if (!button || !button.isConnected || Date.now() - lastAt > 1500) return () => {}
  busyCount.set(button, (busyCount.get(button) || 0) + 1)
  button.setAttribute('aria-busy', 'true')
  button.classList.add('fy-busy')
  return () => {
    const left = (busyCount.get(button) || 1) - 1
    busyCount.set(button, left)
    if (left <= 0) {
      button.removeAttribute('aria-busy')
      button.classList.remove('fy-busy')
    }
  }
}

export default markBusy
