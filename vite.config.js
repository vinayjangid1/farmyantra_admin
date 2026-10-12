import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Public path the admin panel is served from. Must match the Router basename. */
const BASE_PATH = '/admin/farmyantra/'

/**
 * Console methods that are safe to strip from production builds. Marking them
 * "pure" lets esbuild drop the calls entirely when their return value is unused.
 * console.error / console.warn are deliberately kept so real failures remain
 * visible in production.
 */
const DROPPABLE_CONSOLE = [
  'console.log',
  'console.debug',
  'console.info',
  'console.trace',
  'console.table',
  'console.group',
  'console.groupCollapsed',
  'console.groupEnd',
]

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    base: BASE_PATH,
    plugins: [react()],

    resolve: {
      // Lets modules import as `@/shared/components` instead of `../../../shared/components`.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Force CJS entry for apollo-upload-client to avoid broken ESM re-exports
        // of default from CJS sub-modules (causes "Vt is not a function" in prod).
        'apollo-upload-client': 'apollo-upload-client/public/index.js',
      },
    },

    server: {
      port: 5200,
    },

    preview: {
      port: 5200,
    },

    optimizeDeps: {
      exclude: ['form-data'],
      include: ['apollo-upload-client'],
    },

    esbuild: {
      // Strip debug-level logging from production bundles.
      pure: isProduction ? DROPPABLE_CONSOLE : [],
      legalComments: 'none',
    },

    build: {
      sourcemap: false,
      target: 'es2020',
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Long-lived vendor chunks so a page change does not re-download MUI.
          manualChunks: {
            mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
            apollo: ['@apollo/client', 'graphql', 'apollo-upload-client'],
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
  }
})
