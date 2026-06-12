// src/hooks/useWarehouses.js

import { useState, useEffect, useCallback } from 'react'
import { warehouseService } from '@/services/inventoryService'

export function useWarehouses({ page = 0, size = 200 } = {}) {
  const [warehouses, setWarehouses] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await warehouseService.getAll({ page, size, isActive: true })
      const content = res?.data?.content ?? (Array.isArray(res?.data) ? res.data : [])
      setWarehouses(content)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load warehouses.')
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }, [page, size])

  useEffect(() => { fetch() }, [fetch])

  return { warehouses, loading, error, refetch: fetch }
}