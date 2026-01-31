import { useMemo, useState } from "react"

export interface UsePaginationOptions {
  itemsPerPage: number
  totalItems: number
}

export interface UsePaginationReturn {
  currentPage: number
  itemsPerPage: number
  totalPages: number
  paginatedItems: <T>(items: T[]) => T[]
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  getPageNumbers: () => Array<number | string>
}

export function usePagination({ itemsPerPage: initialItemsPerPage, totalItems }: UsePaginationOptions): UsePaginationReturn {
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = useMemo(() => Math.max(Math.ceil(totalItems / itemsPerPage), 1), [itemsPerPage, totalItems])

  const paginatedItems = useMemo(() => {
    return <T,>(items: T[]): T[] => {
      const start = (currentPage - 1) * itemsPerPage
      return items.slice(start, start + itemsPerPage)
    }
  }, [currentPage, itemsPerPage])

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  const getPageNumbers = (): Array<number | string> => {
    const pages: Array<number | string> = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
    }

    return pages
  }

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    setCurrentPage,
    setItemsPerPage: handleItemsPerPageChange,
    getPageNumbers,
  }
}

