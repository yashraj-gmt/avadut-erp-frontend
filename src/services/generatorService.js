import api from './api'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build multipart/form-data for generator create / update.
 * Backend expects:
 *   Part "data"  → JSON string (CreateGeneratorRequest / UpdateGeneratorRequest)
 *   Part "image" → optional single image file
 */
const buildGeneratorFormData = (data, image) => {
  const fd = new FormData()
  fd.append('data', JSON.stringify(data))
  if (image) fd.append('image', image)
  return fd
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

// ── Generators ─────────────────────────────────────────────────────────────
export const generatorService = {
  /** GET /admin/generators — supports: search, isActive, page, size, sortBy, sortDir */
  getAll:  (params)         => api.get('/admin/generators', { params }),
  getById: (id)             => api.get(`/admin/generators/${id}`),
  create:  (data, image)    => api.post('/admin/generators',      buildGeneratorFormData(data, image), multipart),
  update:  (id, data, image)=> api.patch(`/admin/generators/${id}`, buildGeneratorFormData(data, image), multipart),
  delete:  (id)             => api.delete(`/admin/generators/${id}`),
}
