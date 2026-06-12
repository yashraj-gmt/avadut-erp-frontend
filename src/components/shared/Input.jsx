// src/components/shared/Input.jsx
import { forwardRef, useId } from 'react';

/**
 * Input — unified form field (text, password, email, number, search, textarea, select).
 *
 * Props:
 *   label         — field label (shown above)
 *   hint          — small helper text below the field
 *   error         — error message (turns border/text red)
 *   prefix        — leading icon or text inside the field (e.g. search icon)
 *   suffix        — trailing icon or text inside the field (e.g. currency symbol)
 *   size          — 'sm' | 'md' (default) | 'lg'
 *   multiline     — renders a <textarea> instead of <input>
 *   rows          — rows for textarea (default 3)
 *   as='select'   — renders a native <select>; pass children as <option> elements
 *   required      — marks label with *
 *   fullWidth     — 100% width (default: block, full width)
 *
 * All other props are forwarded to the underlying input/textarea/select.
 *
 * Usage:
 *   <Input label="Product Name" placeholder="e.g. Wireless Headphones" required />
 *   <Input label="Search" prefix={<SearchIcon />} placeholder="Search by name or SKU…" />
 *   <Input label="Notes" multiline rows={4} />
 *   <Input as="select" label="Category">
 *     <option value="">All Categories</option>
 *     <option value="electronics">Electronics</option>
 *   </Input>
 *   <Input label="Price" prefix="₹" type="number" error="Price is required" />
 */

const sizeMap = {
  sm: { field: 'h-8  text-xs  px-3',   label: 'text-xs', hint: 'text-[10px]' },
  md: { field: 'h-10 text-sm  px-3.5', label: 'text-sm', hint: 'text-xs'     },
  lg: { field: 'h-12 text-base px-4',  label: 'text-sm', hint: 'text-xs'     },
};

const baseField =
  'w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] ' +
  'text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] ' +
  'transition-colors duration-150 ' +
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-2)]';

const normalBorder = 'border-[var(--color-border)] focus:border-[var(--color-primary)]';
const errorBorder  = 'border-[var(--color-danger)]  focus:ring-[var(--color-danger)]';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    prefix,
    suffix,
    size       = 'md',
    multiline  = false,
    rows       = 3,
    as,
    required   = false,
    className  = '',
    id: propId,
    children,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id     = propId ?? autoId;
  const s      = sizeMap[size] ?? sizeMap.md;
  const border = error ? errorBorder : normalBorder;

  const hasPre  = !!prefix;
  const hasSuf  = !!suffix;
  const padLeft  = hasPre ? 'pl-9'  : '';
  const padRight = hasSuf ? 'pr-9'  : '';

  /* Decide what to render */
  const isSelect    = as === 'select';
  const isTextarea  = multiline && !isSelect;

  const fieldCls = [
    baseField,
    border,
    isTextarea ? `py-2.5 px-3.5 resize-y min-h-[80px]` : s.field,
    padLeft,
    padRight,
    isSelect ? 'appearance-none pr-9 cursor-pointer' : '',
  ].join(' ');

  const adornmentCls =
    'absolute top-1/2 -translate-y-1/2 flex items-center justify-center ' +
    'pointer-events-none text-[var(--color-text-muted)] [&_svg]:w-4 [&_svg]:h-4';

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={[
            'font-medium text-[var(--color-text)]',
            s.label,
          ].join(' ')}
        >
          {label}
          {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
        </label>
      )}

      {/* Field wrapper */}
      <div className="relative">
        {/* Leading adornment */}
        {hasPre && (
          <span className={[adornmentCls, 'left-3'].join(' ')}>{prefix}</span>
        )}

        {isTextarea ? (
          <textarea ref={ref} id={id} rows={rows} className={fieldCls} {...rest} />
        ) : isSelect ? (
          <select ref={ref} id={id} className={fieldCls} {...rest}>
            {children}
          </select>
        ) : (
          <input ref={ref} id={id} className={fieldCls} {...rest} />
        )}

        {/* Trailing adornment — chevron for select, custom suffix otherwise */}
        {isSelect ? (
          <span className={[adornmentCls, 'right-3'].join(' ')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        ) : hasSuf ? (
          <span className={[adornmentCls, 'right-3'].join(' ')}>{suffix}</span>
        ) : null}
      </div>

      {/* Hint / Error */}
      {(error || hint) && (
        <p
          className={[
            s.hint,
            error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]',
          ].join(' ')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

export default Input;

/* ── Search Input shorthand ────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export const SearchInput = forwardRef(function SearchInput(props, ref) {
  return <Input ref={ref} type="search" prefix={<SearchIcon />} {...props} />;
});