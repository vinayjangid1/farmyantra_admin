/**
 * Barrel for the shared presentational layer.
 *
 * `src/components/` used to be a second, competing home for reusable components:
 * Button, TextField, Table and ImagePicker lived there while PageHeader,
 * StatCard, FilterBar and friends lived here, so feature files routinely imported
 * from both in the same module at different `../../../` depths. Everything
 * reusable is now in one place.
 *
 * detailKit and ImagePreview are intentionally NOT re-exported: they are large
 * multi-export kits, and funnelling them through this barrel would pull their
 * whole dependency graph into every consumer. Import those directly.
 */

/* ---------------------------------------------------------------- form & data primitives */
export { default as CustomButton } from './CustomButton'
export { default as CustomTextField } from './CustomTextField'
export { default as CustomTable } from './CustomTable'
export { default as ImagePicker } from './ImagePicker'

/* ---------------------------------------------------------------- page scaffolding */
export { default as PageContainer } from './PageContainer'
export { default as PageHeader } from './PageHeader'
export { default as EntityPageShell } from './EntityPageShell'

/* ---------------------------------------------------------------- state placeholders */
export { default as LoadingState } from './LoadingState'
export { default as ErrorState } from './ErrorState'
export { default as EmptyState } from './EmptyState'

/* ---------------------------------------------------------------- filtering & search */
export { default as SearchField } from './SearchField'
export { default as FilterBar } from './FilterBar'
export { default as FilterDropdown } from './FilterDropdown'

/* ---------------------------------------------------------------- stats */
export { default as StatsGrid } from './StatsGrid'
export { default as StatCard } from './StatCard'

/* ---------------------------------------------------------------- overlays & feedback */
export { default as ConfirmDialog } from './ConfirmDialog'
export { default as DualDeleteDialogs } from './DualDeleteDialogs'
export { default as SidebarPanel } from './SidebarPanel'
export { default as SnackbarProvider } from './SnackbarProvider'
export { default as RowActionsMenu } from './RowActionsMenu'
export { default as ExportButton } from './ExportButton'
export { default as BulkActionBar } from './BulkActionBar'
