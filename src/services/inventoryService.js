import api from './api'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build multipart/form-data for product create / update.
 * Backend expects:
 *   Part "data"   → JSON string (CreateProductRequest / UpdateProductRequest)
 *   Part "images" → one or more image files (optional)
 */
const buildProductFormData = (data, images = []) => {
  const fd = new FormData()
  fd.append('data', JSON.stringify(data))
  if (images?.length) images.forEach(file => fd.append('images', file))
  return fd
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

// ── Products ───────────────────────────────────────────────────────────────
export const productService = {
  /** GET /inventory/products — supports: search, isActive, page, size, sortBy, sortDir */
  getAll:      (params)                   => api.get('/inventory/products', { params }),
  getById:     (id)                       => api.get(`/inventory/products/${id}`),
  create:      (data, images)             => api.post(`/inventory/products`,      buildProductFormData(data, images), multipart),
  update:      (id, data, newImages)      => api.patch(`/inventory/products/${id}`,buildProductFormData(data, newImages), multipart),
  delete:      (id)                       => api.delete(`/inventory/products/${id}`),
  deleteImage: (productId, imageId)       => api.delete(`/inventory/products/${productId}/images/${imageId}`),
}