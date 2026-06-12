// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Shapes stored in the auth slice:
 *
 * user: {
 *   id:        Long       — from UserResponse
 *   name:      String
 *   email:     String
 *   mobile:    String
 *   role:      UserRole   — "SUPER_ADMIN" | "ADMIN" | "STAFF"
 *   isActive:  boolean
 *   lastLogin: string | null
 *   createdAt: string | null
 * }
 * token:        String   — JWT access token
 * refreshToken: String   — UUID refresh token (also stored as HTTP-only cookie by backend)
 * expiresIn:    Long     — access token lifetime in ms (900000 = 15 min)
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────
      user:         null,
      token:        null,
      refreshToken: null,
      expiresIn:    null,

      // ── Selectors ──────────────────────────────────────────────────────
      getRole:           () => get().user?.role ?? null,
      isAuthenticated:   () => Boolean(get().token && get().user),

      // ── Actions ────────────────────────────────────────────────────────

      /**
       * Called after a successful /auth/login or /auth/refresh-token.
       * @param {AuthResponse} authData — { accessToken, refreshToken, expiresIn, user }
       */
      login: (authData) =>
        set({
          token:        authData.accessToken,
          refreshToken: authData.refreshToken,
          expiresIn:    authData.expiresIn ?? null,
          user: {
            id:        authData.user.id,
            name:      authData.user.name,
            email:     authData.user.email,
            mobile:    authData.user.mobile,
            role:      authData.user.role,       // "SUPER_ADMIN" | "ADMIN" | "STAFF"
            isActive:  authData.user.isActive,
            lastLogin: authData.user.lastLogin,
            createdAt: authData.user.createdAt,
          },
        }),

      /**
       * Called by the axios interceptor after a silent token refresh.
       * Only updates tokens; user info stays the same.
       */
      updateTokens: (accessToken, newRefreshToken) =>
        set({ token: accessToken, refreshToken: newRefreshToken }),

      /**
       * Update user profile (e.g., after GET /auth/me).
       * @param {UserResponse} userData
       */
      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      /**
       * Clear all auth state (called on logout or refresh failure).
       */
      logout: () =>
        set({
          user:         null,
          token:        null,
          refreshToken: null,
          expiresIn:    null,
        }),
    }),
    {
      name: 'erp-auth',
      partialize: (state) => ({
        user:         state.user,
        token:        state.token,
        refreshToken: state.refreshToken,
        expiresIn:    state.expiresIn,
      }),
    }
  )
)