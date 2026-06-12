// src/components/shared/modal/ConfirmModal.jsx
import { AlertTriangle, Trash2, Info, X, Loader2 } from 'lucide-react'

/**
 * ConfirmModal — A reusable confirmation dialog.
 *
 * Props:
 *   isOpen       boolean             — controls visibility
 *   onClose      () => void          — called when cancelled / backdrop clicked
 *   onConfirm    () => void          — called when confirm button clicked
 *   title        string              — modal heading
 *   message      string | ReactNode  — body text / JSX
 *   confirmLabel string              — confirm button text  (default: "Confirm")
 *   cancelLabel  string              — cancel button text   (default: "Cancel")
 *   variant      'danger'|'warning'|'info'  (default: 'danger')
 *   loading      boolean             — disables buttons + shows spinner
 *
 * Usage:
 *   <ConfirmModal
 *     isOpen={showConfirm}
 *     onClose={() => setShowConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="Delete record?"
 *     message="This action cannot be undone."
 *     variant="danger"
 *     loading={deleting}
 *   />
 */

const VARIANT_CONFIG = {
  danger: {
    iconBg:      'var(--color-danger-light)',
    iconColor:   'var(--color-danger)',
    btnBg:       'var(--color-danger)',
    btnHover:    '#DC2626',
    Icon:        Trash2,
  },
  warning: {
    iconBg:      'var(--color-warning-light)',
    iconColor:   'var(--color-warning)',
    btnBg:       'var(--color-warning)',
    btnHover:    '#D97706',
    Icon:        AlertTriangle,
  },
  info: {
    iconBg:      'var(--color-info-light)',
    iconColor:   'var(--color-info)',
    btnBg:       'var(--color-primary)',
    btnHover:    'var(--color-primary-dark)',
    Icon:        Info,
  },
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Are you sure?',
  message      = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  loading      = false,
  children,
}) {
  if (!isOpen) return null

  const cfg = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.danger
  const { Icon } = cfg

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !loading) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.iconBg }}
            >
              <Icon size={18} style={{ color: cfg.iconColor }} />
            </div>
            <h3
              id="confirm-title"
              className="text-base font-bold leading-tight"
              style={{ color: 'var(--color-text)' }}
            >
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-40 flex-shrink-0 ml-3"
            style={{
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-muted)',
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4">
          {message && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {message}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex gap-2.5 px-5 pb-5"
          style={{ paddingTop: '0' }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-85 disabled:opacity-60"
            style={{
              background: cfg.btnBg,
              color: 'var(--color-text-inverse)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}