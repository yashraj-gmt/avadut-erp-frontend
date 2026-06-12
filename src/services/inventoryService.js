import api from './api'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build multipart/form-data for product create / update.
 * Backend expects:
 *   Part "data"   → JSON string (CreateProductRequest / UpdateProductRequest)
 *   Part "images" → one or more image files (optional)
 *   Part "qrCode" → single QR image file     (optional)
 */
const buildProductFormData = (data, images = [], qrCode = null) => {
  const fd = new FormData()
  fd.append('data', JSON.stringify(data))
  if (images?.length) images.forEach(file => fd.append('images', file))
  if (qrCode)         fd.append('qrCode', qrCode)
  return fd
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

// ── Products ───────────────────────────────────────────────────────────────
export const productService = {
  /** GET /inventory/products — supports: search, categoryId, status, isActive,
   *  warehouseId, page, size, sortBy, sortDir */
  getAll:        (params)                        => api.get('/inventory/products', { params }),
  getById:       (id)                            => api.get(`/inventory/products/${id}`),
  create:        (data, images, qrCode)          => api.post(`/inventory/products`,      buildProductFormData(data, images, qrCode), multipart),
  update:        (id, data, newImages, newQrCode)=> api.patch(`/inventory/products/${id}`,buildProductFormData(data, newImages, newQrCode), multipart),
  publish:       (id)                            => api.patch(`/inventory/products/${id}/publish`),
  revertToDraft: (id)                            => api.patch(`/inventory/products/${id}/draft`),
  delete:        (id)                            => api.delete(`/inventory/products/${id}`),
  deleteImage:   (productId, imageId)            => api.delete(`/inventory/products/${productId}/images/${imageId}`),
}

// ── Categories ─────────────────────────────────────────────────────────────
export const categoryService = {
  getAll:  (params)      => api.get('/inventory/categories', { params }),
  getById: (id)          => api.get(`/inventory/categories/${id}`),
  create:  (data)        => api.post('/inventory/categories', data),
  update:  (id, data)    => api.patch(`/inventory/categories/${id}`, data),
  delete:  (id)          => api.delete(`/inventory/categories/${id}`),
}

// ── Warehouses ─────────────────────────────────────────────────────────────
export const warehouseService = {
  getAll:  (params)      => api.get('/inventory/warehouses', { params }),
  getById: (id)          => api.get(`/inventory/warehouses/${id}`),
  create:  (data)        => api.post('/inventory/warehouses', data),
  update:  (id, data)    => api.patch(`/inventory/warehouses/${id}`, data),
  delete:  (id)          => api.delete(`/inventory/warehouses/${id}`),
}