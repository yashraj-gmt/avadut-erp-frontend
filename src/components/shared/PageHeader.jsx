// src/components/shared/PageHeader.jsx

/**
 * PageHeader — top-of-page heading row with breadcrumb + action slot.
 *
 * Props:
 *   title        — page title (h1)
 *   subtitle     — optional sentence below the title
 *   breadcrumbs  — array of { label, href? }  — last item is always the current page (no link)
 *   actions      — ReactNode — buttons / controls aligned to the right
 *   className    — extra wrapper classes
 *   back         — if true, shows a back-chevron button (calls window.history.back)
 *   onBack       — override the back action
 *
 * Usage:
 *   <PageHeader
 *     title="Products"
 *     breadcrumbs={[{ label: 'Inventory', href: '/inventory' }, { label: 'Products' }]}
 *     actions={<Button icon={<PlusIcon />}>Add Product</Button>}
 *   />
 */

import { useCallback } from 'react';

/* ── Breadcrumb separator ──────────────────────────────────────────────── */
function ChevronRight() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      className="text-[var(--color-text-subtle)]"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ── Back chevron button ───────────────────────────────────────────────── */
function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className={[
        'inline-flex items-center justify-center w-8 h-8 mr-2 shrink-0',
        'rounded-[var(--radius-md)] border border-[var(--color-border)]',
        'text-[var(--color-text-muted)] bg-[var(--color-surface)]',
        'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
        'transition-colors duration-150 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
      ].join(' ')}
    >
      <svg
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}

/* ── PageHeader ────────────────────────────────────────────────────────── */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  back        = false,
  onBack,
  className   = '',
}) {
  const handleBack = useCallback(() => {
    if (onBack) { onBack(); return; }
    window.history.back();
  }, [onBack]);

  return (
    <div className={['flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between', className].join(' ')}>
      {/* Left: back + title block */}
      <div className="flex items-start gap-0 min-w-0">
        {back && <BackButton onClick={handleBack} />}

        <div className="min-w-0">
          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 mb-1">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <span key={idx} className="flex items-center gap-1 text-xs leading-none">
                    {crumb.href && !isLast ? (
                      <a
                        href={crumb.href}
                        className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline transition-colors font-medium"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span
                        className={
                          isLast
                            ? 'text-[var(--color-text-muted)] font-medium'
                            : 'text-[var(--color-primary)] font-medium'
                        }
                      >
                        {crumb.label}
                      </span>
                    )}
                    {!isLast && <ChevronRight />}
                  </span>
                );
              })}
            </nav>
          )}

          {/* Title */}
          {title && (
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] leading-tight truncate">
              {title}
            </h1>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 mt-2 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

/* ── Divider variant ───────────────────────────────────────────────────── */
/**
 * PageHeaderDivider — full-width PageHeader followed by a separator line.
 * Drop-in replacement when the header should visually separate from the content below.
 */
export function PageHeaderDivider(props) {
  return (
    <div>
      <PageHeader {...props} />
      <hr className="mt-4 border-[var(--color-border)]" />
    </div>
  );
}