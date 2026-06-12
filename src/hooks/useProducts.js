// src/hooks/useProducts.js

import { useState, useEffect, useCallback } from 'react'
import { productService } from '@/services/inventoryService'

export function useProducts({
  search      = '',
  categoryId  = null,
  status      = null,
  isActive    = null,
  warehouseId = null,
  page        = 0,
  size        = 20,
  sortBy      = 'createdAt',
  sortDir     = 'desc',
} = {}) {
  const [products,      setProducts]      = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page, size, sortBy, sortDir,
        ...(search      ? { search }      : {}),
        ...(categoryId  ? { categoryId }  : {}),
        ...(status      ? { status }      : {}),
        ...(isActive   != null ? { isActive }  : {}),
        ...(warehouseId ? { warehouseId } : {}),
      }
      const res   = await productService.getAll(params)
      const paged = res?.data   // PagedResponse after interceptor unwrap
      setProducts(paged?.content      ?? [])
      setTotalElements(paged?.totalElements ?? 0)
      setTotalPages(paged?.totalPages    ?? 0)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load products.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, status, isActive, warehouseId, page, size, sortBy, sortDir])

  useEffect(() => { fetch() }, [fetch])

  return { products, totalElements, totalPages, loading, error, refetch: fetch }
}