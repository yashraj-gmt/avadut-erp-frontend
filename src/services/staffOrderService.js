// src/services/staffOrderService.js
import api from './api'

/**
 * API service for STAFF-role users.
 * All calls go to /api/staff/** which is restricted to ROLE_STAFF on the backend.
 */
export const staffOrderService = {
  /** GET /api/staff/dashboard — returns { totalAssignedOrders } */
  getDashboard: () => api.get('/staff/dashboard'),

  /** GET /api/staff/orders — returns list of OrderSummaryForStaffDto */
  getMyOrders: () => api.get('/staff/orders'),

  /** GET /api/staff/orders/{id} — returns single OrderSummaryForStaffDto */
  getMyOrderById: (id) => api.get(`/staff/orders/${id}`),
}
