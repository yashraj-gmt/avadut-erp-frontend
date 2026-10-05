// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Shapes stored in the auth slice:
 *
 * user: {
 *   id:        Long       - from UserResponse
 *   name:      String
 *   email:     String
 *   mobile:    String
 *   role:      UserRole   - "SUPER_ADMIN" | "ADMIN" | "STAFF"
 *   isActive:  boolean
 *   lastLogin: string | null
 *   createdAt: string | null
 * }
 * token:        String   - JWT access token
 * refreshToken: String   - UUID refresh token (also stored as HTTP-only cookie by backend)
 * expiresIn:    Long     - access token lifetime in ms (900000 = 15 min)
 * tokenIssuedAt: Long   - timestamp when the token was issued (Date.now())
 */

// ── Proactive Refresh Timer ────────────────────────────────────────────────
// Fires 2 minutes before the access token expires to refresh silently.
// This prevents mid-session logouts when the backend is in prod profile (15-min tokens).

let _refreshTimerId = null

function scheduleProactiveRefresh(expiresInMs, refreshFn) {
  // Cancel any existing timer
  if (_refreshTimerId) {
    clearTimeout(_refreshTimerId)
    _refreshTimerId = null
  }

  if (!expiresInMs || expiresInMs <= 0) return

  // Fire 2 minutes before expiry (at least 5 seconds from now)
  const delay = Math.max(expiresInMs - 2 * 60 * 1000, 5_000)

  _refreshTimerId = setTimeout(async () => {
    _refreshTimerId = null
    try {
      await refreshFn()
    } catch {
      // If proactive refresh fails, the reactive 401 interceptor will handle it
    }
  }, delay)
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────
      user:          null,
      token:         null,
      refreshToken:  null,
      expiresIn:     null,
      tokenIssuedAt: null,

      // ── Selectors ──────────────────────────────────────────────────────
      getRole:           () => get().user?.role ?? null,
      isAuthenticated:   () => Boolean(get().token && get().user),

      /**
       * Returns milliseconds remaining until the access token expires.
       * Returns 0 if token is already expired or timing info is missing.
       */
      msUntilExpiry: () => {
        const { expiresIn, tokenIssuedAt } = get()
        if (!expiresIn || !tokenIssuedAt) return 0
        const elapsed = Date.now() - tokenIssuedAt
        return Math.max(0, expiresIn - elapsed)
      },

      // ── Actions ────────────────────────────────────────────────────────

      /**
       * Called after a successful /auth/login or /auth/refresh-token.
       * @param {AuthResponse} authData - { accessToken, refreshToken, expiresIn, user }
       * @param {Function} [proactiveRefreshFn] - optional async fn to call before expiry
       */
      login: (authData, proactiveRefreshFn) => {
        const issuedAt = Date.now()
        set({
          token:         authData.accessToken,
          refreshToken:  authData.refreshToken,
          expiresIn:     authData.expiresIn ?? null,
          tokenIssuedAt: issuedAt,
          user: {
            ...authData.user,
            id:         authData.user.id,
            name:       authData.user.name,
            email:      authData.user.email,
            mobile:     authData.user.mobile,
            role:       authData.user.role,       // "SUPER_ADMIN" | "ADMIN" | "STAFF"
            isActive:   authData.user.isActive,
            lastLogin:  authData.user.lastLogin,
            createdAt:  authData.user.createdAt,
            address:    authData.user.address ?? null,
            profilePic: authData.user.profilePic ?? null,
          },
        })

        // Schedule a proactive token refresh if a refresh function is provided
        if (proactiveRefreshFn && authData.expiresIn) {
          scheduleProactiveRefresh(authData.expiresIn, proactiveRefreshFn)
        }
      },

      /**
       * Called by the axios interceptor after a silent token refresh.
       * Only updates tokens; user info stays the same.
       * @param {Function} [proactiveRefreshFn] - optional async fn to schedule next refresh
       */
      updateTokens: (accessToken, newRefreshToken, proactiveRefreshFn) => {
        const expiresIn = get().expiresIn
        const issuedAt  = Date.now()
        set({ token: accessToken, refreshToken: newRefreshToken, tokenIssuedAt: issuedAt })

        // Re-schedule the proactive refresh with the same expiresIn
        if (proactiveRefreshFn && expiresIn) {
          scheduleProactiveRefresh(expiresIn, proactiveRefreshFn)
        }
      },

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
      logout: () => {
        // Cancel any pending refresh timer
        if (_refreshTimerId) {
          clearTimeout(_refreshTimerId)
          _refreshTimerId = null
        }
        set({
          user:          null,
          token:         null,
          refreshToken:  null,
          expiresIn:     null,
          tokenIssuedAt: null,
        })
      },

      /**
       * Starts the proactive refresh timer using the currently stored expiry info.
       * Call this once on app boot (e.g., in AppShell) to handle the case where
       * the user was already logged in (state restored from localStorage).
       * @param {Function} proactiveRefreshFn
       */
      startRefreshTimer: (proactiveRefreshFn) => {
        const msLeft = get().msUntilExpiry()
        if (msLeft > 0 && proactiveRefreshFn) {
          scheduleProactiveRefresh(msLeft, proactiveRefreshFn)
        }
      },
    }),
    {
      name: 'erp-auth',
      partialize: (state) => ({
        user:          state.user,
        token:         state.token,
        refreshToken:  state.refreshToken,
        expiresIn:     state.expiresIn,
        tokenIssuedAt: state.tokenIssuedAt,
      }),
    }
  )
)