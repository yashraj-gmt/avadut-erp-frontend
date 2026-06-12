// src/store/uiStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen:       true,
      sidebarCollapsed:  false,
      mobileSidebarOpen: false,

      toggleSidebar:        () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen:       (open) => set({ sidebarOpen: open }),
      toggleCollapsed:      () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleMobileSidebar:  () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: 'erp-ui',
      // mobileSidebarOpen is intentionally NOT persisted — always starts closed
      partialize: (s) => ({
        sidebarOpen:      s.sidebarOpen,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
)