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

  /**
   * Fetch all generators for dropdown use.
   * Returns a flat array: [{ id, name, generatorCode }]
   */
  getForDropdown: async () => {
    // api.get() → interceptor returns response.data (the full JSON body)
    // Body shape: { success: true, data: { content: [...], ... } }
    const body = await api.get('/admin/generators', { params: { size: 500 } });
    // Try every possible nesting depth
    const content =
      body?.data?.content   // { success, data: { content } }
      || body?.content      // { content } flat
      || (Array.isArray(body?.data) ? body.data : null) // { data: [...] }
      || (Array.isArray(body) ? body : []);             // [...] bare array
    return Array.isArray(content)
      ? content.map(g => ({
          id: g.id,
          name: g.name,
          generatorCode: g.generatorCode,
          code: g.generatorCode,
          withDieselRentPrice: g.withDieselRentPrice,
          partyDieselRentPrice: g.partyDieselRentPrice
        }))
      : [];
  },

  /**
   * Fetch all generators with availability based on dates.
   */
  getForDropdownWithAvailability: async (startDate, endDate, excludeOrderId) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (excludeOrderId) params.excludeOrderId = excludeOrderId;

    const body = await api.get('/admin/generators/availability', { params });
    const content = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
    return content.map(g => ({
      id: g.id,
      name: g.name,
      generatorCode: g.generatorCode,
      code: g.generatorCode,
      withDieselRentPrice: g.withDieselRentPrice,
      partyDieselRentPrice: g.partyDieselRentPrice,
      totalStock: g.stockQuantity,
      underServiceQuantity: g.underServiceQuantity || 0,
      effectiveStock: g.effectiveStock != null ? g.effectiveStock : g.stockQuantity,
      availableStock: g.availableStock != null ? g.availableStock : g.stockQuantity
    }));
  },

  /**
   * Fetch per-date availability breakdown for a specific generator.
   * Returns list of { date, totalStock, underServiceQty, effectiveStock, bookedQty, availableQty, bookings[] }
   */
  getDailyAvailability: async (generatorId, startDate, endDate) => {
    const params = { startDate, endDate };
    const body = await api.get(`/admin/generators/${generatorId}/daily-availability`, { params });
    return Array.isArray(body?.data) ? body.data : [];
  },

  /**
   * Fetch per-date availability breakdown for ALL active generators.
   * Returns list of generator stats for the given date.
   */
  getDailyAvailabilityAll: async (date) => {
    const params = { date };
    const body = await api.get('/admin/generators/availability/daily-all', { params });
    return Array.isArray(body?.data) ? body.data : [];
  },
}
