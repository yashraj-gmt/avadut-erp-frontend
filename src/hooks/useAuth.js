// src/hooks/useAuth.js
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { ROUTES } from '@/constants/routes'

export function useAuth() {
  const { user, token, login, logout, setUser } = useAuthStore()
  const navigate = useNavigate()

  /** Full logout: revoke server tokens, clear store, redirect */
  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Server-side revocation failed (token already expired, etc.) — still clear client
    } finally {
      logout()
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }

  /**
   * Re-fetch the current user's profile from /auth/me
   * and sync it to the store (useful after profile edits).
   */
  const refreshProfile = async () => {
    try {
      const userData = await authService.me()
      setUser(userData)
      return userData
    } catch {
      return null
    }
  }

  /**
   * Change password.
   * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} data
   * After success the server revokes all sessions → force re-login.
   */
  const changePassword = async (data) => {
    await authService.changePassword(data)
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return {
    user,
    token,
    isAuthenticated: !!(token && user),
    role:            user?.role,
    login,
    logout:          handleLogout,
    refreshProfile,
    changePassword,
  }
}