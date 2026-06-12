// src/components/layout/Header.jsx
import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export default function Header() {
  const { toggleMobileSidebar } = useUIStore()

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 shrink-0"
      style={{
        height:      'var(--header-height)',
        background:  'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow:   'var(--shadow-sm)',
      }}
    >
      {/* Hamburger — mobile only (lg+: hidden) */}
      <button
        onClick={toggleMobileSidebar}
        aria-label="Open menu"
        className="header-icon-btn lg:hidden p-2 rounded-md transition-colors"
        style={{ borderRadius: 'var(--radius-md)' }}
      >
        <Menu size={20} />
      </button>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      {/* Right slot — add notifications / search here as needed */}
      <div className="flex items-center gap-2" />
    </header>
  )
}