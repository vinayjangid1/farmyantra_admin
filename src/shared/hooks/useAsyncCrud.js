import { useCallback, useEffect, useState } from 'react'

import { useSnackbar } from '@/shared/hooks/useSnackbar'

/**
 * Owns the full state machine for a promise-based CRUD screen: fetching, the
 * create/edit dialog, the delete confirmation, and success/failure messaging.
 *
 * This hook previously existed but was never imported anywhere, while
 * WebsiteCrudPage carried a line-for-line copy of the same logic inline. The
 * duplicate has been removed and this is now the single implementation.
 *
 * Intended for services that expose plain async functions. Screens built on
 * Apollo hooks should use `usePaginatedSearch` + the Apollo cache instead.
 *
 * @param {object}   config
 * @param {Function} config.fetch  `() => Promise<Item[]>`
 * @param {Function} config.create `(input, ...extra) => Promise<unknown>`
 * @param {Function} config.update `(input, ...extra) => Promise<unknown>`
 * @param {Function} config.remove `(id) => Promise<unknown>`
 * @param {string}   config.entityName        singular, e.g. 'Testimonial'
 * @param {string}   config.entityNamePlural  plural, e.g. 'Testimonials'
 */
export const useAsyncCrud = ({
  fetch,
  create,
  update,
  remove,
  entityName = 'Item',
  entityNamePlural = 'Items',
}) => {
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetch()
      setItems(data || [])
    } catch {
      showSnackbar(`Failed to load ${entityNamePlural.toLowerCase()}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [fetch, entityNamePlural, showSnackbar])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openCreate = useCallback(() => {
    setEditItem(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((item) => {
    setEditItem(item)
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setEditItem(null)
  }, [])

  const requestDelete = useCallback((item) => setDeleteItem(item), [])
  const cancelDelete = useCallback(() => setDeleteItem(null), [])

  /**
   * Creates or updates depending on whether an item is being edited.
   *
   * Errors are deliberately NOT caught: the dialog awaits this call and needs the
   * rejection to keep itself open and show field-level validation messages. The
   * previous version wrapped the body in `try { ... } catch (e) { throw e }`,
   * which achieved the same thing while looking like real error handling.
   */
  const save = useCallback(
    async (input, ...extra) => {
      if (editItem) {
        await update(input, ...extra)
        showSnackbar(`${entityName} updated successfully`)
      } else {
        await create(input, ...extra)
        showSnackbar(`${entityName} created successfully`)
      }
      closeDialog()
      await refresh()
    },
    [editItem, update, create, entityName, showSnackbar, closeDialog, refresh],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteItem) return

    try {
      setDeleting(true)
      await remove(deleteItem.id)
      showSnackbar(`${entityName} deleted successfully`)
      setDeleteItem(null)
      await refresh()
    } catch (error) {
      showSnackbar(error?.message || `Failed to delete ${entityName.toLowerCase()}`, 'error')
    } finally {
      setDeleting(false)
    }
  }, [deleteItem, remove, entityName, showSnackbar, refresh])

  return {
    // data
    items,
    loading,
    // create / edit dialog
    dialogOpen,
    editItem,
    openCreate,
    openEdit,
    closeDialog,
    save,
    // delete confirmation
    deleteItem,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
    // messaging
    snackbar,
    showSnackbar,
    hideSnackbar,
    // manual refetch
    refresh,
  }
}

export default useAsyncCrud
