// src/services/userService.js
import api from './api'

/**
 * User Management Service
 * Base URL: /api/admin/users
 *
 * The axios instance in api.js unwraps ApiResponse<T>:
 *   interceptor returns response.data  →  ApiResponse { success, message, data }
 * So every call does .then(r => r.data) to get the inner DTO.
 *
 * UserResponse shape:
 *   { id, name, email, mobile, role, isActive, lastLogin, createdAt }
 */
export const userService = {

  /**
   * GET /api/admin/users
   * Returns: UserResponse[]
   */
  getAll: () =>
    api.get('/admin/users').then((r) => r.data),

  /**
   * GET /api/admin/users/:id
   * Returns: UserResponse
   */
  getById: (id) =>
    api.get(`/admin/users/${id}`).then((r) => r.data),

  /**
   * POST /api/admin/users  (SUPER_ADMIN only)
   * Body:    { name, email, mobile, password, role, isActive }
   * Returns: UserResponse
   */
  create: (data) =>
    api.post('/admin/users', data).then((r) => r.data),

  /**
   * PUT /api/admin/users/:id  (SUPER_ADMIN only)
   * Body:    { name, email, mobile, role, isActive }
   * Returns: UserResponse
   */
  update: (id, data) =>
    api.put(`/admin/users/${id}`, data).then((r) => r.data),

  /**
   * PATCH /api/admin/users/:id/toggle-active  (SUPER_ADMIN only)
   * Returns: UserResponse
   */
  toggleActive: (id) =>
    api.patch(`/admin/users/${id}/toggle-active`).then((r) => r.data),

  /**
   * PATCH /api/admin/users/:id/role  (SUPER_ADMIN only)
   * Body:    { role: "ADMIN" | "SUPER_ADMIN" }
   * Returns: UserResponse
   */
  changeRole: (id, role) =>
    api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  /**
   * DELETE /api/admin/users/:id  (SUPER_ADMIN only)
   * Soft-deletes the user (sets isDeleted=true, isActive=false).
   */
  delete: (id) =>
    api.delete(`/admin/users/${id}`),
}
