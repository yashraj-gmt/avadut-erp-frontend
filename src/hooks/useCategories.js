// src/hooks/useCategories.js
import { useState, useEffect, useCallback } from 'react'
import { categoryService } from '@/services/inventoryService'

/**
 * The axios `api` instance unwraps ApiResponse, so res.data is already the
 * PagedResponse: { content: [...], totalElements, ... }
 */
export function useCategories({ page = 0, size = 200 } = {}) {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await categoryService.getAll({ page, size, isActive: true })
      // res.data is PagedResponse (interceptor already stripped ApiResponse wrapper)
      const content = res?.data?.content ?? (Array.isArray(res?.data) ? res.data : [])
      setCategories(content)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load categories.')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [page, size])

  useEffect(() => { fetch() }, [fetch])

  return { categories, loading, error, refetch: fetch }
}