// src/components/shared/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Barrel export — import everything from one place:
//   import { Button, Badge, DataTable, StatCard } from '@/components/shared';
// ─────────────────────────────────────────────────────────────────────────────

// Badge
export { default as Badge } from './Badge';

// SearchableSelect
export { default as SearchableSelect } from './SearchableSelect';

// Button
export { default as Button } from './Button';
export { IconButton }        from './Button';

// Card
export { default as Card }   from './Card';
export { CardHeader }        from './Card';
export { CardBody }          from './Card';
export { CardFooter }        from './Card';
export { StatCard }          from './Card';

// DataTable
export { default as DataTable } from './DataTable';

// EmptyState
export { default as EmptyState } from './EmptyState';
export { NoSearchResults }       from './EmptyState';
export { NoData }                from './EmptyState';

// Input
export { default as Input } from './Input';
export { SearchInput }      from './Input';

// PageHeader
export { default as PageHeader }       from './PageHeader';
export { PageHeaderDivider }           from './PageHeader';

// Spinner
export { default as Spinner }   from './Spinner';
export { SpinnerOverlay }       from './Spinner';
export { SpinnerInline }        from './Spinner';
export { ButtonSpinner }        from './Spinner';