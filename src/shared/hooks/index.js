/**
 * Barrel for shared hooks. Previously each consumer imported from the
 * individual file path, so there was no single place to see what existed —
 * which is part of why `useAsyncCrud` sat unused while a page reimplemented it.
 */
export { useAsyncCrud } from './useAsyncCrud'
export { usePageTitle } from './usePageTitle'
export { usePaginatedSearch } from './usePaginatedSearch'
export { useRowActionsMenu } from './useRowActionsMenu'
export { useSnackbar } from './useSnackbar'
export { useAction } from './useAction'
export { useDebounce } from './useDebounce'
