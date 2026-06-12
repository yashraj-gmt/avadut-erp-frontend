// src/components/shared/EmptyState.jsx

/**
 * EmptyState — friendly zero-data / error placeholder.
 *
 * Props:
 *   icon      — ReactNode (SVG / emoji / image)  — displayed above the title
 *   title     — heading text
 *   message   — supporting description
 *   action    — ReactNode (e.g. a <Button>) shown below the description
 *   size      — 'sm' | 'md' (default) | 'lg'
 *   className — extra wrapper classes
 *
 * Usage:
 *   <EmptyState
 *     icon={<PackageIcon />}
 *     title="No products yet"
 *     message="Add your first product to get started."
 *     action={<Button icon={<PlusIcon />}>Add Product</Button>}
 *   />
 */

const sizeMap = {
  sm: { wrap: 'py-8 px-4', icon: 'w-10 h-10 mb-3',   title: 'text-sm font-semibold', msg: 'text-xs mt-1' },
  md: { wrap: 'py-14 px-6', icon: 'w-14 h-14 mb-4',  title: 'text-base font-semibold', msg: 'text-sm mt-1.5' },
  lg: { wrap: 'py-20 px-8', icon: 'w-20 h-20 mb-5',  title: 'text-lg font-semibold',  msg: 'text-sm mt-2' },
};

export default function EmptyState({
  icon,
  title     = 'Nothing here yet',
  message,
  action,
  size      = 'md',
  className = '',
}) {
  const s = sizeMap[size] ?? sizeMap.md;

  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        s.wrap,
        className,
      ].join(' ')}
    >
      {/* Icon container */}
      {icon && (
        <div
          className={[
            'flex items-center justify-center rounded-[var(--radius-xl)]',
            'bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]',
            '[&_svg]:w-full [&_svg]:h-full',
            s.icon,
          ].join(' ')}
        >
          {icon}
        </div>
      )}

      {/* Text */}
      <p className={['text-[var(--color-text)]', s.title].join(' ')}>{title}</p>

      {message && (
        <p className={['text-[var(--color-text-muted)] max-w-xs', s.msg].join(' ')}>{message}</p>
      )}

      {/* CTA */}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Preset: No search results ─────────────────────────────────────────── */
function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function NoSearchResults({ query, onClear }) {
  return (
    <EmptyState
      icon={<SearchIcon />}
      title="No results found"
      message={query ? `Nothing matched "${query}". Try a different search term.` : 'Try adjusting your filters.'}
      action={
        onClear && (
          <button
            onClick={onClear}
            className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            Clear search
          </button>
        )
      }
    />
  );
}

/* ── Preset: No data at all ────────────────────────────────────────────── */
function InboxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export function NoData({ title = 'No data yet', message, action }) {
  return <EmptyState icon={<InboxIcon />} title={title} message={message} action={action} />;
}