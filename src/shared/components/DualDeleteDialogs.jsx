import ConfirmDialog from '@/shared/components/ConfirmDialog'

/**
 * The soft-delete / hard-delete confirmation pair used by the Videos and Raddi
 * Categories screens.
 *
 * `entityLabel` was accepted (and passed in by every caller as "video",
 * "category", etc.) but never actually rendered, so both dialogs said the same
 * generic thing regardless of what was being deleted. It is now used in the
 * titles and messages.
 */
const DualDeleteDialogs = ({
  softOpen,
  hardOpen,
  onSoftClose,
  onHardClose,
  onSoftConfirm,
  onHardConfirm,
  softLoading,
  hardLoading,
  itemName,
  entityLabel = 'item',
}) => (
  <>
    <ConfirmDialog
      open={softOpen}
      onClose={onSoftClose}
      onConfirm={onSoftConfirm}
      title={`Soft Delete ${entityLabel}`}
      message={`Are you sure you want to soft delete the ${entityLabel} "${itemName}"? It can be restored later.`}
      confirmLabel="Soft Delete"
      severity="warning"
      loading={softLoading}
    />
    <ConfirmDialog
      open={hardOpen}
      onClose={onHardClose}
      onConfirm={onHardConfirm}
      title={`Permanently Delete ${entityLabel}`}
      message={`Are you sure you want to permanently delete the ${entityLabel} "${itemName}"? This action cannot be undone.`}
      confirmLabel="Hard Delete"
      loading={hardLoading}
    />
  </>
)

export default DualDeleteDialogs
