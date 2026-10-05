import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { doSilentRefresh } from '@/services/api'
import { cn } from '@/utils/cn'

export default function AppShell() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()
  const { refreshProfile } = useAuth()
  const { startRefreshTimer } = useAuthStore()
  const location = useLocation()

  // Background sync user profile on mount
  useEffect(() => {
    refreshProfile()
    // Start proactive token refresh timer so we never hit a mid-session 401.
    // Covers the case where the user was already logged in (state from localStorage).
    startRefreshTimer(doSilentRefresh)
  }, [])

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname, setMobileSidebarOpen])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ── Mobile backdrop ────────────────────────────────────────────────
          Sits between the content and the overlay sidebar.
          Tapping it closes the sidebar.
      ─────────────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-opacity duration-300',
          mobileSidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        style={{ background: 'rgba(0,0,0,0.55)' }}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <Sidebar />

      {/* ── Main content area ──────────────────────────────────────────────
          Mobile: no margin (sidebar overlays the content).
          Desktop: margin-left = sidebar width (collapsed or full).
          Tailwind lg: prefix handles the breakpoint; CSS vars supply the value.
      ─────────────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300',
          // No left margin on mobile
          // On desktop use the correct sidebar width
          sidebarCollapsed
            ? 'lg:ml-[var(--sidebar-width-collapsed)]'
            : 'lg:ml-[var(--sidebar-width)]'
        )}
      >
        <Header />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ color: 'var(--color-text)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}