import { IS_DEV } from '@/core/config/env'

/**
 * Thin logging facade.
 *
 * Why this exists: the codebase had ~165 bare `console.*` calls, most of which
 * shipped to production. Verbose tracing in a production admin console is noise
 * at best and an information-disclosure vector at worst (request payloads,
 * user records, tokens).
 *
 *  - `debug` / `info` are compiled away in production builds.
 *  - `warn` / `error` are always kept: real failures should stay visible, and
 *    this is where a Sentry/Datadog hook belongs later.
 *
 * Never pass credentials, tokens, or full auth headers to any of these.
 */

const noop = () => {}

/* eslint-disable no-console */
export const logger = {
  /** Verbose tracing. Development only. */
  debug: IS_DEV ? console.log.bind(console) : noop,

  /** Notable lifecycle events. Development only. */
  info: IS_DEV ? console.info.bind(console) : noop,

  /** Recoverable problems. Kept in production. */
  warn: console.warn.bind(console),

  /** Failures. Kept in production. */
  error: console.error.bind(console),
}
/* eslint-enable no-console */

/**
 * Creates a logger that prefixes every message with a scope, e.g.
 * `const log = createLogger('socket')` -> `[socket] connected`.
 *
 * @param {string} scope
 */
export const createLogger = (scope) => ({
  debug: IS_DEV ? logger.debug.bind(null, `[${scope}]`) : noop,
  info: IS_DEV ? logger.info.bind(null, `[${scope}]`) : noop,
  warn: logger.warn.bind(null, `[${scope}]`),
  error: logger.error.bind(null, `[${scope}]`),
})

export default logger
