// src/services/customerService.js
import api from './api'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Strip undefined/null values so they don't pollute query-string as "null".
 */
const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))

// ── Customer Service ────────────────────────────────────────────────────────
export const customerService = {

  /**
   * GET /api/customers — paginated list with optional filters.
   * Supported params: search, customerType, customerStatus, isActive,
   *   isRegular, area, city, dateJoinedFrom, dateJoinedTo, page, size, sortBy, sortDir
   */
  getAll: (params = {}) =>
    api.get('/customers', { params: clean(params) }),

  /**
   * GET /customers/search — Spec/criteria-backed search (same filter params as getAll).
   */
  search: (params = {}) =>
    api.get('/customers/search', { params: clean(params) }),

  /**
   * GET /customers/{id}
   */
  getById: (id) =>
    api.get(`/customers/${id}`),

  /**
   * GET /customers/{id}/profile — full profile with aggregates + recent orders/invoices.
   */
  getProfile: (id) =>
    api.get(`/customers/${id}/profile`),

  /**
   * POST /customers — create a new customer.
   * Body shape: { name, mobile, alternateMobile?, email?, address?, city?, area?,
   *               pincode?, customerType?, notes?, dateJoined? }
   */
  create: (data) =>
    api.post('/customers', data),

  /**
   * PATCH /customers/{id} — partial update.
   */
  update: (id, data) =>
    api.patch(`/customers/${id}`, data),

  /**
   * DELETE /customers/{id} — soft delete.
   */
  remove: (id) =>
    api.delete(`/customers/${id}`),

  /**
   * GET /customers/{id}/history — chronological activity log.
   * Params: page, size
   */
  getHistory: (id, params = {}) =>
    api.get(`/customers/${id}/history`, { params: clean(params) }),

  /**
   * GET /customers/pending-payments — customers with outstanding dues.
   * Params: page, size, sortBy (totalDueAmount|maxOverdueDays), sortDir
   */
  getPendingPayments: (params = {}) =>
    api.get('/customers/pending-payments', { params: clean(params) }),

  /**
   * GET /customers/by-area — area-wise grouped customer stats.
   * Params: city?, page, size, sortBy, sortDir
   */
  getByArea: (params = {}) =>
    api.get('/customers/by-area', { params: clean(params) }),

  /**
   * GET /customers/by-booking-count — customers sorted by booking volume.
   * Params: page, size
   */
  getByBookingCount: (params = {}) =>
    api.get('/customers/by-booking-count', { params: clean(params) }),

  /**
   * POST /customers/regular/recalculate — on-demand loyalty recalculation.
   * Body (all optional): { minOrders?, lookbackMonths?, minTotalSpend? }
   * Pass null/undefined body to use server defaults.
   */
  recalculateRegular: (config = null) =>
    api.post('/customers/regular/recalculate', config ?? {}),

  // ── Convenience helpers ──────────────────────────────────────────────────

  /**
   * Fetch all customers for dropdown use (up to 500, minimal fields).
   * Returns flat array: [{ id, name, mobile }]
   */
  getForDropdown: async () => {
    const body = await api.get('/customers', { params: { size: 500, sortBy: 'name', sortDir: 'asc' } })
    const content =
      body?.data?.content ||
      body?.content ||
      (Array.isArray(body?.data) ? body.data : null) ||
      (Array.isArray(body) ? body : [])
    return Array.isArray(content)
      ? content.map(c => ({ id: c.id, name: c.name, mobile: c.mobile }))
      : []
  },
}
