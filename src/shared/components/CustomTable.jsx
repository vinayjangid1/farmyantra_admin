import { useEffect, useMemo, useState } from 'react'
import {
  alpha,
  Box,
  Checkbox,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { DatabaseZap, Inbox, Rows3, Rows4, SlidersHorizontal } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'

/**
 * Shared data table.
 *
 * Opt-in UX extras (fully backward compatible — existing callers pass none of
 * these and behave exactly as before):
 *  - `enableDensity`      : adds a comfortable/compact row-height toggle.
 *  - `enableColumnToggle` : adds a column show/hide menu.
 *  - `tableId`            : namespaces those prefs in localStorage so they
 *                           persist per screen. Required for persistence.
 */

const prefKey = (tableId, kind) => `admin_table_${kind}_${tableId}`

const CustomTable = ({
  columns = [],
  rows = [],
  page: externalPage,
  rowsPerPage: externalRowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  tableId,
  enableDensity = false,
  enableColumnToggle = false,
  // Opt-in row selection. Caller owns selection state.
  selectable = false,
  rowId = (row) => row.id ?? row.user_id,
  selectedIds,
  onToggleRow,
  onToggleAll,
}) => {
  const theme = useTheme()
  const [internalPage, setInternalPage] = useState(0)
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(10)

  const showToolbar = (enableDensity || enableColumnToggle) && columns.length > 0

  // Density (compact vs comfortable), persisted when a tableId is given.
  const [compact, setCompact] = useState(() => {
    if (!enableDensity || !tableId) return false
    return getItem(prefKey(tableId, 'density')) === 'compact'
  })
  const toggleDensity = () => {
    setCompact((prev) => {
      const next = !prev
      if (tableId) setItem(prefKey(tableId, 'density'), next ? 'compact' : 'comfortable')
      return next
    })
  }

  // Hidden columns set (by column id), persisted when a tableId is given.
  const [hiddenCols, setHiddenCols] = useState(() => {
    if (!enableColumnToggle || !tableId) return new Set()
    try {
      const raw = getItem(prefKey(tableId, 'cols'))
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
  })
  const [colMenuAnchor, setColMenuAnchor] = useState(null)

  const toggleColumn = (id) => {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (tableId) setItem(prefKey(tableId, 'cols'), JSON.stringify([...next]))
      return next
    })
  }

  // Columns actually rendered (never hide them all — fall back to full set).
  const visibleColumns = useMemo(() => {
    if (!enableColumnToggle || hiddenCols.size === 0) return columns
    const shown = columns.filter((c) => !hiddenCols.has(c.id))
    return shown.length ? shown : columns
  }, [columns, hiddenCols, enableColumnToggle])

  const cellPadY = compact ? 0.9 : 1.55
  const headPadY = compact ? 1.1 : 1.8

  const page = externalPage !== undefined ? externalPage : internalPage
  const rowsPerPage = externalRowsPerPage !== undefined ? externalRowsPerPage : internalRowsPerPage
  const useExternalPagination = externalPage !== undefined

  useEffect(() => {
    if (externalPage !== undefined) setInternalPage(externalPage)
  }, [externalPage])

  useEffect(() => {
    if (externalRowsPerPage !== undefined) setInternalRowsPerPage(externalRowsPerPage)
  }, [externalRowsPerPage])

  const handleChangePage = (event, newPage) => {
    if (useExternalPagination && onPageChange) {
      onPageChange(newPage)
    } else {
      setInternalPage(newPage)
    }
  }

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = +event.target.value
    if (useExternalPagination && onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage)
    } else {
      setInternalRowsPerPage(newRowsPerPage)
      setInternalPage(0)
    }
  }

  const displayRows = useExternalPagination
    ? rows
    : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const count = useExternalPagination && totalRows !== undefined ? totalRows : rows.length

  // Selection (opt-in). `selectedIds` is a Set/array of row ids owned by caller.
  const selectedSet = selectable ? new Set(selectedIds || []) : null
  const displayIds = selectable ? displayRows.map((r) => rowId(r)) : []
  const selectedOnPage = selectable ? displayIds.filter((id) => selectedSet.has(id)).length : 0
  const allOnPageSelected = selectable && displayIds.length > 0 && selectedOnPage === displayIds.length
  const someOnPageSelected = selectable && selectedOnPage > 0 && !allOnPageSelected
  const colSpan = visibleColumns.length + (selectable ? 1 : 0)

  return (
    <Box
      sx={{
        width: '100%',
        overflow: 'auto',
        animation: 'card-rise 460ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {showToolbar && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mb: 1 }}>
          {enableDensity && (
            <Tooltip title={compact ? 'Comfortable rows' : 'Compact rows'}>
              <IconButton size="small" aria-label="Toggle density" onClick={toggleDensity}>
                {compact ? <Rows3 size={16} /> : <Rows4 size={16} />}
              </IconButton>
            </Tooltip>
          )}
          {enableColumnToggle && (
            <>
              <Tooltip title="Show / hide columns">
                <IconButton
                  size="small"
                  aria-label="Choose columns"
                  onClick={(e) => setColMenuAnchor(e.currentTarget)}
                >
                  <SlidersHorizontal size={16} />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={colMenuAnchor}
                open={Boolean(colMenuAnchor)}
                onClose={() => setColMenuAnchor(null)}
                slotProps={{ paper: { sx: { maxHeight: 360 } } }}
              >
                <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.disabled', fontWeight: 700, display: 'block' }}>
                  Columns
                </Typography>
                <Divider />
                {columns.map((column) => (
                  <MenuItem key={column.id} dense onClick={() => toggleColumn(column.id)}>
                    <Checkbox size="small" edge="start" checked={!hiddenCols.has(column.id)} tabIndex={-1} disableRipple />
                    <ListItemText primary={column.label || column.id} />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[2],
          '&::before': {
            content: '""',
            position: 'absolute',
            zIndex: 3,
            top: 0,
            left: 24,
            right: 24,
            height: 2,
            borderRadius: 999,
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.custom.accent, 0.7)}, transparent)`,
          },
        }}
      >
        <TableContainer sx={{ maxHeight: 650, overflowX: 'auto' }}>
          <Table stickyHeader aria-label="data table" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell
                    padding="checkbox"
                    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Checkbox
                      size="small"
                      checked={allOnPageSelected}
                      indeterminate={someOnPageSelected}
                      onChange={() => onToggleAll?.(displayIds, !allOnPageSelected)}
                      inputProps={{ 'aria-label': 'Select all rows on this page' }}
                    />
                  </TableCell>
                )}
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    sx={{
                      whiteSpace: 'nowrap',
                      py: headPadY,
                      px: 2.25,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 10, border: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.2,
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'grid',
                          placeItems: 'center',
                          width: 68,
                          height: 68,
                          borderRadius: 1.5,
                          color: 'text.disabled',
                          bgcolor: 'custom.mutedSurface',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: 7,
                            borderRadius: 2.5,
                            border: `1px dashed ${alpha(theme.palette.text.disabled, 0.25)}`,
                          },
                        }}
                      >
                        <Inbox size={27} />
                      </Box>
                      <Typography variant="subtitle2">No data available</Typography>
                      <Typography variant="caption" color="text.disabled">
                        Records will appear here once they are available
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row, index) => {
                  const id = selectable ? rowId(row) : undefined
                  const isSelected = selectable && selectedSet.has(id)
                  return (
                    <TableRow
                      hover
                      tabIndex={-1}
                      key={row.id || row.user_id || index}
                      selected={isSelected}
                      onClick={() => onRowClick && onRowClick(row)}
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.custom.accent, 0.07),
                          boxShadow: `inset 3px 0 0 ${theme.palette.custom.accentDark}`,
                        },
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox" sx={{ borderColor: 'divider' }}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => onToggleRow?.(id)}
                            inputProps={{ 'aria-label': 'Select row' }}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((column) => {
                        const value = row[column.id]
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            sx={{
                              whiteSpace: 'nowrap',
                              py: cellPadY,
                              px: 2.25,
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              color: 'text.primary',
                              borderColor: 'divider',
                            }}
                          >
                            {column.format ? column.format(value, row) : value || '—'}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'custom.mutedSurface',
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.7,
              pl: 2.25,
              color: 'text.disabled',
            }}
          >
            <DatabaseZap size={14} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {count.toLocaleString()} records
            </Typography>
          </Box>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={count}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              flex: 1,
              border: 0,
              '& .MuiTablePagination-toolbar': { minHeight: 54 },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.72rem',
                fontWeight: 650,
                color: 'text.secondary',
              },
              '& .MuiTablePagination-select': { fontSize: '0.72rem', fontWeight: 700 },
            }}
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default CustomTable
