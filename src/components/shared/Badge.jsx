// src/components/shared/Badge.jsx

/**
 * Badge — inline status / label chip.
 *
 * Variants:
 *   success | warning | danger | info | primary | neutral
 *
 * Sizes:
 *   sm | md (default)
 *
 * dot — shows a leading coloured dot (useful for stock / status indicators)
 *
 * Usage:
 *   <Badge variant="success" dot>In Stock</Badge>
 *   <Badge variant="warning" dot>Low Stock</Badge>
 *   <Badge variant="danger">Out of Stock</Badge>
 *   <Badge variant="info" size="sm">Electronics</Badge>
 */

const variantMap = {
  success: {
    bg:   'bg-[var(--color-success-light)]',
    text: 'text-[var(--color-success)]',
    dot:  'bg-[var(--color-success)]',
  },
  warning: {
    bg:   'bg-[var(--color-warning-light)]',
    text: 'text-[var(--color-warning)]',
    dot:  'bg-[var(--color-warning)]',
  },
  danger: {
    bg:   'bg-[var(--color-danger-light)]',
    text: 'text-[var(--color-danger)]',
    dot:  'bg-[var(--color-danger)]',
  },
  info: {
    bg:   'bg-[var(--color-info-light)]',
    text: 'text-[var(--color-info)]',
    dot:  'bg-[var(--color-info)]',
  },
  primary: {
    bg:   'bg-[var(--color-primary-100)]',
    text: 'text-[var(--color-primary-dark)]',
    dot:  'bg-[var(--color-primary)]',
  },
  neutral: {
    bg:   'bg-[var(--color-surface-2)]',
    text: 'text-[var(--color-text-muted)]',
    dot:  'bg-[var(--color-text-subtle)]',
  },
};

const sizeMap = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs    px-2.5 py-1 gap-1.5',
};

export default function Badge({
  children,
  variant = 'neutral',
  size    = 'md',
  dot     = false,
  className = '',
}) {
  const v = variantMap[variant] ?? variantMap.neutral;
  const s = sizeMap[size]       ?? sizeMap.md;

  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full leading-none',
        v.bg,
        v.text,
        s,
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={['shrink-0 rounded-full', v.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'].join(' ')} />
      )}
      {children}
    </span>
  );
}