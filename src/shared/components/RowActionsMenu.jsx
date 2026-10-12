import { Menu, MenuItem } from '@mui/material'

const RowActionsMenu = ({ anchorEl, open, onClose, items = [] }) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    {items.map(({ label, icon, onClick, color }) => (
      <MenuItem key={label} onClick={onClick} sx={color ? { color } : undefined}>
        {icon && <span style={{ marginRight: 8, display: 'flex' }}>{icon}</span>}
        {label}
      </MenuItem>
    ))}
  </Menu>
)

export default RowActionsMenu
