// src/utils/imageUrl.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086'

/**
 * Converts a relative image path from the backend into a full URL.
 *
 * Examples:
 *   "products/images/uuid.jpg"   → "http://localhost:8086/uploads/products/images/uuid.jpg"
 *   "/uploads/products/..."      → "http://localhost:8086/uploads/products/..."
 *   "http://..."                 → returned as-is (already absolute)
 *   null / undefined             → null
 */
export const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/uploads/')) return `${API_BASE}${path}`
  return `${API_BASE}/uploads/${path}`
}