// src/components/shared/Spinner.jsx

/**
 * Spinner — animated loading indicator.
 *
 * Variants:
 *   border   — classic spinning ring (default)
 *   dots     — three bouncing dots
 *   pulse    — fading circle
 *
 * Sizes:    xs | sm | md (default) | lg | xl
 * Colors:   primary (default) | white | muted  — maps to CSS variables
 *
 * Usage:
 *   <Spinner />
 *   <Spinner size="lg" color="white" />
 *   <Spinner variant="dots" size="sm" />
 *
 *   // Full-page overlay
 *   <SpinnerOverlay />
 *
 *   // Inline within a container
 *   <SpinnerInline message="Loading products…" />
 */

/* ── Size map ──────────────────────────────────────────────────────────── */
const sizeMap = {
  xs: { box: 'w-3 h-3',   border: 'border-2',  dot: 'w-1 h-1'   },
  sm: { box: 'w-4 h-4',   border: 'border-2',  dot: 'w-1.5 h-1.5' },
  md: { box: 'w-6 h-6',   border: 'border-2',  dot: 'w-2 h-2'   },
  lg: { box: 'w-8 h-8',   border: 'border-[3px]', dot: 'w-2.5 h-2.5' },
  xl: { box: 'w-12 h-12', border: 'border-4',  dot: 'w-3 h-3'   },
};

/* ── Colour map (maps to index.css variables) ──────────────────────────── */
const colorMap = {
  primary: {
    ring:  'border-[var(--color-primary-100)]',
    blade: 'border-t-[var(--color-primary)]',
    dot:   'bg-[var(--color-primary)]',
    pulse: 'bg-[var(--color-primary)]',
  },
  white: {
    ring:  'border-white/30',
    blade: 'border-t-white',
    dot:   'bg-white',
    pulse: 'bg-white',
  },
  muted: {
    ring:  'border-[var(--color-border)]',
    blade: 'border-t-[var(--color-text-muted)]',
    dot:   'bg-[var(--color-text-muted)]',
    pulse: 'bg-[var(--color-text-muted)]',
  },
};

/* ── Border (ring) spinner ─────────────────────────────────────────────── */
function BorderSpinner({ size, color }) {
  const s = sizeMap[size];
  const c = colorMap[color];
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block rounded-full animate-spin',
        s.box,
        s.border,
        c.ring,
        c.blade,
      ].join(' ')}
    />
  );
}

/* ── Dots spinner ──────────────────────────────────────────────────────── */
function DotsSpinner({ size, color }) {
  const s = sizeMap[size];
  const c = colorMap[color];
  return (
    <span role="status" aria-label="Loading" className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={['inline-block rounded-full animate-bounce', s.dot, c.dot].join(' ')}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

/* ── Pulse spinner ─────────────────────────────────────────────────────── */
function PulseSpinner({ size, color }) {
  const s = sizeMap[size];
  const c = colorMap[color];
  return (
    <span role="status" aria-label="Loading" className={['relative inline-flex', s.box].join(' ')}>
      <span className={['absolute inset-0 rounded-full animate-ping opacity-50', c.pulse].join(' ')} />
      <span className={['relative inline-flex rounded-full', s.box, c.pulse].join(' ')} />
    </span>
  );
}

/* ── Main Spinner export ───────────────────────────────────────────────── */
export default function Spinner({
  variant   = 'border',
  size      = 'md',
  color     = 'primary',
  className = '',
}) {
  const props = { size, color };
  let inner;
  if (variant === 'dots')  inner = <DotsSpinner  {...props} />;
  else if (variant === 'pulse') inner = <PulseSpinner {...props} />;
  else                    inner = <BorderSpinner {...props} />;

  return <span className={['inline-flex items-center justify-center', className].join(' ')}>{inner}</span>;
}

/* ── Full-page overlay ─────────────────────────────────────────────────── */
export function SpinnerOverlay({ message }) {
  return (
    <div
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4',
        'bg-[var(--color-surface)]/80 backdrop-blur-sm',
      ].join(' ')}
    >
      <Spinner size="xl" />
      {message && (
        <p className="text-sm font-medium text-[var(--color-text-muted)]">{message}</p>
      )}
    </div>
  );
}

/* ── Inline centred loader (inside a card / section) ───────────────────── */
export function SpinnerInline({ message, size = 'md', className = '' }) {
  return (
    <div className={['flex flex-col items-center justify-center gap-3 py-12', className].join(' ')}>
      <Spinner size={size} />
      {message && (
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      )}
    </div>
  );
}

/* ── Button-embedded spinner (re-exported from Button, but handy here) ─── */
export function ButtonSpinner({ color = 'white' }) {
  return <Spinner variant="border" size="sm" color={color} />;
}