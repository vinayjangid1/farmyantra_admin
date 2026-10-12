import { Tooltip } from '@mui/material'
import { Download } from 'lucide-react'
import CustomButton from '@/shared/components/CustomButton'
import { exportRowsToCsv } from '@/lib/csv'
import { showToast } from '@/lib/toast'

/**
 * CSV export of the rows currently loaded on screen (this page / filtered page),
 * not the whole dataset — a full server-side export is a separate backend job.
 * The tooltip makes that scope explicit.
 *
 * @param {object[]} rows
 * @param {{ key:string, label:string, value?:(row)=>any }[]} columns  export column spec
 * @param {string} filenamePrefix  e.g. "buyers" -> buyers_2026-10-01_1430.csv
 */
const ExportButton = ({ rows = [], columns = [], filenamePrefix = 'export', label = 'Export CSV' }) => {
  const handleExport = () => {
    const ok = exportRowsToCsv(rows, columns, filenamePrefix)
    if (!ok) showToast('Nothing to export on this page', { severity: 'info' })
  }

  return (
    <Tooltip title="Export the rows shown on this page to CSV">
      <span>
        <CustomButton
          label={label}
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<Download size={15} />}
          onClick={handleExport}
          disabled={rows.length === 0}
        />
      </span>
    </Tooltip>
  )
}

export default ExportButton
