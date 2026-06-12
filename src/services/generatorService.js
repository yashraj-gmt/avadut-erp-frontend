import api from './api'

// ── Generators ─────────────────────────────────────────────────────────────
export const generatorService = {
  getAll:  (params)      => api.get('/admin/generators', { params }),
  getById: (id)          => api.get(`/admin/generators/${id}`),
  create:  (data)        => api.post('/admin/generators', data),
  update:  (id, data)    => api.patch(`/admin/generators/${id}`, data),
  delete:  (id)          => api.delete(`/admin/generators/${id}`),
}
