import { useState, useCallback, useMemo } from 'react'

interface UsePaginationProps {
  total: number
  initialPage?: number
  pageSize?: number
}

interface PaginationState {
  page: number
  pageSize: number
  totalPages: number
  from: number
  to: number
  hasPrev: boolean
  hasNext: boolean
  goTo: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void
  reset: () => void
}

export function usePagination({
  total,
  initialPage = 1,
  pageSize: initialPageSize = 20,
}: UsePaginationProps): PaginationState {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  )

  const from = useMemo(() => (page - 1) * pageSize + 1, [page, pageSize])
  const to = useMemo(
    () => Math.min(page * pageSize, total),
    [page, pageSize, total]
  )

  const goTo = useCallback(
    (p: number) => setPage(Math.min(Math.max(1, p), totalPages)),
    [totalPages]
  )

  const nextPage = useCallback(
    () => setPage((p) => Math.min(p + 1, totalPages)),
    [totalPages]
  )

  const prevPage = useCallback(() => setPage((p) => Math.max(p - 1, 1)), [])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(1)
  }, [])

  const reset = useCallback(() => {
    setPage(initialPage)
    setPageSizeState(initialPageSize)
  }, [initialPage, initialPageSize])

  return {
    page,
    pageSize,
    totalPages,
    from,
    to,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    goTo,
    nextPage,
    prevPage,
    setPageSize,
    reset,
  }
}