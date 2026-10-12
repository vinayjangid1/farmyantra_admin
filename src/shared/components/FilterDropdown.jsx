import { useState, useRef } from 'react'
import {
  Box,
  Typography,
  Checkbox,
  Paper,
  Popper,
  ClickAwayListener,
  InputBase,
  Fade,
} from '@mui/material'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

/**
 * FilterDropdown — Multi-select or single-select dropdown with search.
 * Matches the "Select Event" design: rounded pill, search inside, checkboxes, select-all.
 *
 * Props:
 * - label: string — field label shown above dropdown
 * - options: [{ value, label }] — list of selectable options
 * - value: string | string[] — currently selected value(s)
 * - onChange: (newValue) => void
 * - multiple: boolean — enable multi-select (default false)
 * - placeholder: string — placeholder when nothing selected
 * - showSearch: boolean — show search box inside (default true when options > 5)
 * - showSelectAll: boolean — show select-all checkbox (only in multi mode)
 * - allLabel: string — label for "All" option in single mode (default "All")
 * - allValue: string — value representing "all" in single mode (default "all")
 */
const FilterDropdown = ({
  label,
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder,
  showSearch,
  showSelectAll = true,
  allLabel = 'All',
  allValue = 'all',
  sx = {},
}) => {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const anchorRef = useRef(null)

  const shouldShowSearch = showSearch !== undefined ? showSearch : options.length > 5

  // Determine display text
  const getDisplayText = () => {
    if (multiple) {
      if (!value || value.length === 0 || value.length === options.length) {
        return placeholder || allLabel
      }
      if (value.length === 1) {
        const opt = options.find((o) => o.value === value[0])
        return opt?.label || value[0]
      }
      return `${value.length} selected`
    }
    if (!value || value === allValue) {
      return placeholder || allLabel
    }
    const opt = options.find((o) => o.value === value)
    return opt?.label || value
  }

  // Filter options by search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleToggle = () => {
    setOpen((prev) => !prev)
    if (!open) setSearchTerm('')
  }

  const handleClose = () => {
    setOpen(false)
    setSearchTerm('')
  }

  const handleSingleSelect = (optValue) => {
    onChange(optValue)
    handleClose()
  }

  const handleMultiToggle = (optValue) => {
    const current = Array.isArray(value) ? value : []
    const exists = current.includes(optValue)
    const newValue = exists ? current.filter((v) => v !== optValue) : [...current, optValue]
    onChange(newValue)
  }

  const handleSelectAll = () => {
    if (!multiple) return
    const current = Array.isArray(value) ? value : []
    if (current.length === options.length) {
      onChange([])
    } else {
      onChange(options.map((o) => o.value))
    }
  }

  const isAllSelected = multiple && Array.isArray(value) && value.length === options.length
  const isIndeterminate =
    multiple && Array.isArray(value) && value.length > 0 && value.length < options.length

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {/* Label */}
      {label && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 0.75,
            fontWeight: 600,
            fontSize: '0.8rem',
            color: 'text.secondary',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </Typography>
      )}

      {/* Trigger Button */}
      <Box
        ref={anchorRef}
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          borderRadius: '50px',
          border: '1.5px solid',
          borderColor: open ? 'primary.main' : 'grey.300',
          backgroundColor: 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 42,
          '&:hover': {
            borderColor: 'primary.main',
          },
          ...(open && {
            boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}15`,
          }),
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color:
              !value || value === allValue || (Array.isArray(value) && value.length === 0)
                ? 'text.secondary'
                : 'text.primary',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mr: 1,
          }}
        >
          {getDisplayText()}
        </Typography>
        {open ? (
          <ChevronUp size={18} style={{ flexShrink: 0, color: '#666' }} />
        ) : (
          <ChevronDown size={18} style={{ flexShrink: 0, color: '#666' }} />
        )}
      </Box>

      {/* Dropdown Panel */}
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth || 'auto', minWidth: 200 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              elevation={8}
              sx={{
                mt: 1,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                maxHeight: 320,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  {/* Search Input */}
                  {shouldShowSearch && (
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: '8px',
                          border: '1.5px solid',
                          borderColor: 'grey.300',
                          backgroundColor: 'grey.50',
                        }}
                      >
                        <Search size={16} style={{ color: '#F5A623', flexShrink: 0 }} />
                        <InputBase
                          placeholder="Search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                          sx={{
                            flex: 1,
                            fontSize: '0.85rem',
                            '& input': { p: 0 },
                          }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Options List */}
                  <Box sx={{ maxHeight: 240, overflowY: 'auto', py: 0.5 }}>
                    {/* Select All (multi-mode only) */}
                    {multiple && showSelectAll && filteredOptions.length > 0 && (
                      <Box
                        onClick={handleSelectAll}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          sx={{
                            p: 0.5,
                            mr: 1.5,
                            color: 'grey.400',
                            '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                              color: '#F5A623',
                            },
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          Select all
                        </Typography>
                      </Box>
                    )}

                    {/* "All" option for single-select mode */}
                    {!multiple && (
                      <Box
                        onClick={() => handleSingleSelect(allValue)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1,
                          cursor: 'pointer',
                          backgroundColor:
                            value === allValue || !value ? 'action.selected' : 'transparent',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: value === allValue || !value ? 600 : 400,
                            fontSize: '0.875rem',
                          }}
                        >
                          {allLabel}
                        </Typography>
                      </Box>
                    )}

                    {/* Individual Options */}
                    {filteredOptions.map((opt) => {
                      const isSelected = multiple
                        ? Array.isArray(value) && value.includes(opt.value)
                        : value === opt.value

                      return (
                        <Box
                          key={opt.value}
                          onClick={() =>
                            multiple ? handleMultiToggle(opt.value) : handleSingleSelect(opt.value)
                          }
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 1,
                            cursor: 'pointer',
                            backgroundColor:
                              !multiple && isSelected ? 'action.selected' : 'transparent',
                            '&:hover': { backgroundColor: 'action.hover' },
                          }}
                        >
                          {multiple && (
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              sx={{
                                p: 0.5,
                                mr: 1.5,
                                color: 'grey.400',
                                '&.Mui-checked': {
                                  color: '#F5A623',
                                },
                              }}
                            />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: '0.875rem',
                            }}
                          >
                            {opt.label}
                          </Typography>
                        </Box>
                      )
                    })}

                    {filteredOptions.length === 0 && (
                      <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No options found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  )
}

export default FilterDropdown
