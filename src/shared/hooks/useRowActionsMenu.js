import { useState } from 'react'

export const useRowActionsMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const openMenu = (event, item) => {
    setAnchorEl(event.currentTarget)
    setSelectedItem(item)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  const clearSelection = () => {
    setAnchorEl(null)
    setSelectedItem(null)
  }

  return {
    anchorEl,
    selectedItem,
    setSelectedItem,
    openMenu,
    closeMenu,
    clearSelection,
    isOpen: Boolean(anchorEl),
  }
}

export default useRowActionsMenu
