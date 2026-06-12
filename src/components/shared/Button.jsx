// src/components/shared/Button.jsx
import { forwardRef } from 'react';

/**
 * Button — versatile, accessible button component.
 *
 * Variants:  primary | secondary | danger | ghost | outline
 * Sizes:     sm | md (default) | lg
 * Props:
 *   icon        — leading icon element
 *   iconRight   — trailing icon element
 *   loading     — shows spinner, disables interaction
 *   fullWidth   — stretches to 100 %
 *   disabled    — native disabled
 *
 * Usage:
 *   <Button variant="primary" icon={<PlusIcon />}>Add Product</Button>
 *   <Button variant="danger"  size="sm">Delete</Button>
 *   <Button variant="ghost"  loading>Saving…</Button>
 */

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] ' +
  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap';

const variantMap = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-text-inverse)] ' +
    'hover:bg-[var(--color-primary-dark)] active:bg-[var(--color-primary-dark)] shadow-[var(--shadow-sm)]',

  secondary:
    'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] ' +
    'hover:bg-[var(--color-border)] active:bg-[var(--color-border-strong)]',

  danger:
    'bg-[var(--color-danger)] text-[var(--color-text-inverse)] ' +
    'hover:opacity-90 active:opacity-80 shadow-[var(--shadow-sm)]',

  ghost:
    'bg-transparent text-[var(--color-text-muted)] ' +
    'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] active:bg-[var(--color-border)]',

  outline:
    'bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] ' +
    'hover:bg-[var(--color-primary-50)] active:bg-[var(--color-primary-100)]',
};

const sizeMap = {
  sm: 'h-8  px-3   text-xs  [&_svg]:w-3.5 [&_svg]:h-3.5',
  md: 'h-10 px-4   text-sm  [&_svg]:w-4   [&_svg]:h-4',
  lg: 'h-12 px-5   text-base [&_svg]:w-5  [&_svg]:h-5',
};

/* ── Spinner (inline, so Button has zero extra deps) ───────────────────── */
function BtnSpinner() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ── Icon-only square button ───────────────────────────────────────────── */
const iconSizeMap = {
  sm: 'h-8  w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function IconButton({
  children,
  variant   = 'ghost',
  size      = 'md',
  title,
  className = '',
  ...rest
}) {
  return (
    <button
      title={title}
      className={[
        base,
        variantMap[variant] ?? variantMap.ghost,
        iconSizeMap[size]   ?? iconSizeMap.md,
        'p-0 [&_svg]:w-[1.125rem] [&_svg]:h-[1.125rem]',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Main Button ───────────────────────────────────────────────────────── */
const Button = forwardRef(function Button(
  {
    children,
    variant   = 'primary',
    size      = 'md',
    icon,
    iconRight,
    loading   = false,
    fullWidth = false,
    className = '',
    type      = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = loading || rest.disabled;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={[
        base,
        variantMap[variant] ?? variantMap.primary,
        sizeMap[size]       ?? sizeMap.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <BtnSpinner /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export default Button;