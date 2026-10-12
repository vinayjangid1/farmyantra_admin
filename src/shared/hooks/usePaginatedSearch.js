import { useState, useCallback } from 'react'

export const usePaginatedSearch = (initialRowsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)

  const handleChangePage = useCallback((newPage) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0)
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  }
}

export default usePaginatedSearch
