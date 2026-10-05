// src/components/shared/Card.jsx

/**
 * Card - surface container with optional header / footer slots.
 *
 * Sub-components (named exports):
 *   CardHeader  - top section with title + optional action
 *   CardBody    - scrollable content area
 *   CardFooter  - bottom section
 *   StatCard    - KPI tile as seen in Products page (number + label + accent bar)
 *
 * Usage:
 *   <Card>
 *     <CardHeader title="Recent Orders" action={<Button size="sm">View all</Button>} />
 *     <CardBody>…</CardBody>
 *     <CardFooter>…</CardFooter>
 *   </Card>
 *
 *   <StatCard value={12} label="Total Products" accent="primary" />
 */

/* ── Base Card ─────────────────────────────────────────────────────────── */
export default function Card({ children, className = '', padding = true, hover = false }) {
  return (
    <div
      className={[
        'bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)]',
        'shadow-[var(--shadow-sm)]',
        padding ? 'p-5' : '',
        hover
          ? 'transition-shadow duration-200 hover:shadow-[var(--shadow-md)] cursor-pointer'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* ── CardHeader ────────────────────────────────────────────────────────── */
export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div
      className={[
        'flex items-start justify-between gap-4 mb-4',
        className,
      ].join(' ')}
    >
      <div className="min-w-0">
        {title && (
          <h3 className="text-base font-semibold text-[var(--color-text)] leading-snug truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)] truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── CardBody ──────────────────────────────────────────────────────────── */
export function CardBody({ children, className = '' }) {
  return <div className={['text-sm text-[var(--color-text)]', className].join(' ')}>{children}</div>;
}

/* ── CardFooter ────────────────────────────────────────────────────────── */
export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={[
        'mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-3',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* ── StatCard (KPI tile) ───────────────────────────────────────────────── */

const accentColorMap = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger:  'var(--color-danger)',
  info:    'var(--color-info)',
};

/**
 * StatCard
 *
 * @param {string|number} value     - big number / text to display
 * @param {string}        label     - descriptor beneath the value
 * @param {string}        accent    - left-border color: primary|success|warning|danger|info
 * @param {ReactNode}     icon      - optional icon in top-right
 * @param {string}        sub       - optional small sub-text (e.g. "+5% from last month")
 * @param {string}        subVariant- success|warning|danger|neutral for sub text colour
 */
export function StatCard({
  value,
  label,
  accent      = 'primary',
  icon,
  sub,
  subVariant  = 'neutral',
  className   = '',
}) {
  const accentColor = accentColorMap[accent] ?? accentColorMap.primary;

  const subColorMap = {
    success: 'text-[var(--color-success)]',
    warning: 'text-[var(--color-warning)]',
    danger:  'text-[var(--color-danger)]',
    neutral: 'text-[var(--color-text-muted)]',
  };

  const valStr = value != null ? String(value) : '';
  const isLongVal = valStr.length > 9;
  const isMediumVal = valStr.length > 6;

  const valueFontSize = isLongVal
    ? 'text-lg sm:text-xl lg:text-2xl xl:text-3xl'
    : isMediumVal
    ? 'text-xl sm:text-2xl lg:text-3xl'
    : 'text-2xl sm:text-3xl';

  return (
    <div
      className={[
        'relative bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
        'border border-[var(--color-border)] shadow-[var(--shadow-sm)]',
        'px-3.5 sm:px-4 lg:px-5 py-3.5 sm:py-4 overflow-hidden',
        className,
      ].join(' ')}
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`${valueFontSize} font-bold leading-tight tracking-tight truncate`}
            style={{ color: 'var(--color-text)' }}
            title={valStr}
          >
            {value}
          </p>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest text-[var(--color-text-muted)] truncate" title={label}>
            {label}
          </p>
          {sub && (
            <p className={['mt-1 text-[11px] sm:text-xs font-medium truncate', subColorMap[subVariant] ?? subColorMap.neutral].join(' ')} title={sub}>
              {sub}
            </p>
          )}
        </div>

        {icon && (
          <div
            className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-[var(--radius-md)] flex items-center justify-center [&_svg]:w-4 sm:[&_svg]:w-4.5 lg:[&_svg]:w-5 [&_svg]:h-4 sm:[&_svg]:h-4.5 lg:[&_svg]:h-5 transition-all"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}