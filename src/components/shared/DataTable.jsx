// src/components/shared/DataTable.jsx
import { useState, useMemo, useCallback } from 'react';

/**
 * DataTable — fully-featured, sortable, paginated table.
 *
 * columns[] shape:
 *   {
 *     key:        string           — unique key (also used to read row[key])
 *     header:     string           — column heading text
 *     sortable?:  boolean          — allow sorting on this column (default false)
 *     width?:     string           — Tailwind width class e.g. "w-16"
 *     align?:     'left'|'center'|'right'  (default 'left')
 *     render?:    (value, row, index) => ReactNode — custom cell renderer
 *   }
 *
 * Props:
 *   data          — array of row objects
 *   columns       — column definition array (see above)
 *   keyField      — property name to use as React key (default 'id')
 *   loading       — show skeleton rows
 *   emptyState    — ReactNode shown when data is empty and not loading
 *   pageSize      — rows per page (default 8); pass 0 to disable pagination
 *   pageSizeOptions — array of numbers for the page-size selector
 *   striped       — alternate row shading
 *   stickyHeader  — make thead sticky (useful inside a scrollable container)
 *   className     — extra classes on the wrapper
 *   onRowClick    — (row) => void  — makes rows clickable
 *
 * Usage:
 *   const columns = [
 *     { key: 'name',  header: 'Product', sortable: true },
 *     { key: 'price', header: 'Price',   sortable: true, align: 'right',
 *       render: v => `₹${v.toLocaleString()}` },
 *     { key: 'status', header: 'Status',
 *       render: (_, row) => <Badge variant={row.inStock ? 'success' : 'danger'} dot>{row.status}</Badge> },
 *   ];
 *   <DataTable data={products} columns={columns} keyField="sku" />
 */

/* ── Sort icon ─────────────────────────────────────────────────────────── */
function SortIcon({ direction }) {
  return (
    <span className="inline-flex flex-col gap-[1px] ml-1 opacity-60">
      <svg
        width="8" height="5" viewBox="0 0 8 5" fill="currentColor"
        style={{ opacity: direction === 'asc' ? 1 : 0.35 }}
      >
        <path d="M4 0 L8 5 L0 5 Z" />
      </svg>
      <svg
        width="8" height="5" viewBox="0 0 8 5" fill="currentColor"
        style={{ opacity: direction === 'desc' ? 1 : 0.35 }}
      >
        <path d="M0 0 L8 0 L4 5 Z" />
      </svg>
    </span>
  );
}

/* ── Skeleton row ──────────────────────────────────────────────────────── */
function SkeletonRow({ colCount }) {
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-[var(--color-border)] animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Pagination control ────────────────────────────────────────────────── */
function Pagination({ page, totalPages, total, pageSize, pageSizeOptions, onPage, onPageSize }) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const btnCls = (enabled) =>
    [
      'inline-flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] text-sm font-medium',
      'border border-[var(--color-border)] transition-colors duration-100',
      enabled
        ? 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)] cursor-pointer'
        : 'text-[var(--color-text-subtle)] cursor-not-allowed',
    ].join(' ');

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
      {/* Left: total + page-size */}
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <span>{total} {total === 1 ? 'record' : 'records'}</span>
        {pageSizeOptions?.length > 0 && (
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-8 px-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}
      </div>

      {/* Right: page controls */}
      <div className="flex items-center gap-1">
        <button className={btnCls(canPrev)} disabled={!canPrev} onClick={() => onPage(1)}>«</button>
        <button className={btnCls(canPrev)} disabled={!canPrev} onClick={() => onPage(page - 1)}>‹</button>

        <span className="px-3 text-sm text-[var(--color-text-muted)]">
          {page} / {totalPages || 1}
        </span>

        <button className={btnCls(canNext)} disabled={!canNext} onClick={() => onPage(page + 1)}>›</button>
        <button className={btnCls(canNext)} disabled={!canNext} onClick={() => onPage(totalPages)}>»</button>
      </div>
    </div>
  );
}

/* ── Alignment helper ──────────────────────────────────────────────────── */
const alignCls = { left: 'text-left', center: 'text-center', right: 'text-right' };

/* ── DataTable ─────────────────────────────────────────────────────────── */
export default function DataTable({
  data             = [],
  columns          = [],
  keyField         = 'id',
  loading          = false,
  emptyState,
  pageSize: initPS = 8,
  pageSizeOptions  = [8, 16, 32, 64],
  striped          = false,
  stickyHeader     = false,
  className        = '',
  onRowClick,
}) {
  const [sortKey,  setSortKey]  = useState(null);
  const [sortDir,  setSortDir]  = useState('asc');   // 'asc' | 'desc'
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(initPS);

  /* ── Sorting ─────────────────────────────────────────────────── */
  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      setSortDir(prev === key ? (d) => (d === 'asc' ? 'desc' : 'asc') : () => 'asc');
      return key;
    });
    setPage(1);
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  /* ── Pagination ──────────────────────────────────────────────── */
  const paginated = useMemo(() => {
    if (pageSize === 0) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(sorted.length / pageSize);

  /* ── Render ──────────────────────────────────────────────────── */
  const SKELETON_ROWS = 5;
  const isEmpty = !loading && data.length === 0;

  return (
    <div className={['w-full', className].join(' ')}>
      <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          {/* HEAD */}
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    'px-4 py-3 font-semibold text-[10px] uppercase tracking-widest',
                    'text-[var(--color-text-muted)]',
                    alignCls[col.align] ?? alignCls.left,
                    col.width ?? '',
                    col.sortable ? 'cursor-pointer select-none hover:text-[var(--color-text)] transition-colors' : '',
                  ].join(' ')}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={sortKey === col.key ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <SkeletonRow key={i} colCount={columns.length} />
                ))
              : isEmpty
              ? (
                <tr>
                  <td colSpan={columns.length} className="py-12">
                    {emptyState ?? (
                      <p className="text-center text-sm text-[var(--color-text-subtle)]">No records found.</p>
                    )}
                  </td>
                </tr>
              )
              : paginated.map((row, rowIdx) => (
                <tr
                  key={row[keyField] ?? rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={[
                    'transition-colors duration-100',
                    striped && rowIdx % 2 === 1 ? 'bg-[var(--color-surface-2)]' : '',
                    onRowClick ? 'cursor-pointer hover:bg-[var(--color-primary-50)]' : 'hover:bg-[var(--color-surface-2)]',
                  ].join(' ')}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        'px-4 py-3 text-[var(--color-text)]',
                        alignCls[col.align] ?? alignCls.left,
                        col.width ?? '',
                      ].join(' ')}
                    >
                      {col.render
                        ? col.render(row[col.key], row, rowIdx)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {!isEmpty && !loading && pageSize !== 0 && (
        <div className="mt-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={sorted.length}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPage={(p) => setPage(p)}
            onPageSize={(ps) => { setPageSize(ps); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
}