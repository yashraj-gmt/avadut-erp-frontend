// src/services/authService.js
import api from './api'

/**
 * The axios instance in api.js already unwraps the ApiResponse<T> envelope:
 *   interceptor returns response.data  →  ApiResponse { success, message, data }
 * So every call here does .then(r => r.data) to get the inner DTO.
 *
 * Shapes returned by the backend
 * ─────────────────────────────────────────────────────────────────────────────
 * AuthResponse  { accessToken, refreshToken, expiresIn, user: UserResponse }
 * UserResponse  { id, name, email, mobile, role, isActive, lastLogin, createdAt }
 */
export const authService = {

  /**
   * POST /api/auth/login
   * Body:    { mobile, password }
   * Returns: AuthResponse
   */
  login: (credentials) =>
    api.post('/auth/login', credentials).then((r) => r.data),

  /**
   * POST /api/auth/refresh-token
   * Body:    { refreshToken? }   (omit body → backend reads HTTP-only cookie)
   * Returns: AuthResponse
   */
  refreshToken: (refreshToken) =>
    api
      .post('/auth/refresh-token', refreshToken ? { refreshToken } : {})
      .then((r) => r.data),

  /**
   * POST /api/auth/logout
   * Revokes all refresh tokens on the server and clears the HTTP-only cookie.
   * Returns: void
   */
  logout: () => api.post('/auth/logout'),

  /**
   * GET /api/auth/me
   * Returns the currently authenticated user's profile.
   * Returns: UserResponse { id, name, email, mobile, role, isActive, lastLogin, createdAt }
   */
  me: () => api.get('/auth/me').then((r) => r.data),

    /**
   * PATCH /api/auth/profile
   * Body:    { name, email, mobile }
   * Returns: ProfileUpdateResponse
   *
   * IMPORTANT — mobileChanged handling:
   *   If result.mobileChanged === true the server has already revoked all
   *   refresh tokens and cleared the cookie. The caller MUST:
   *     1. Call authStore.logout() to clear client state.
   *     2. Redirect to /login so the user re-authenticates with the new mobile.
   *
   *   If result.mobileChanged === false:
   *     1. Call authStore.setUser(result.user) to sync updated name/email.
   *     2. Stay on the profile page.
   */
  updateProfile: (data) =>
    api.patch('/auth/profile', data).then((r) => r.data),
  
  /**
   * PATCH /api/auth/change-password
   * Body:    { currentPassword, newPassword, confirmPassword }
   * Returns: void  (success message in ApiResponse.message)
   * NOTE: Server revokes all refresh tokens → forces re-login everywhere.
   */
  changePassword: (data) =>
    api.patch('/auth/change-password', data).then((r) => r),
}