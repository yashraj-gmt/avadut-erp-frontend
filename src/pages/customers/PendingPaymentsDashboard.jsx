// src/pages/customers/PendingPaymentsDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, AlertTriangle, ChevronDown, ChevronUp, Eye,
  ArrowUpDown, TrendingDown, Clock,
} from 'lucide-react';
import { customerService } from '@/services/customerService';
import { useToast } from '@/components/shared/toast/ToastProvider';
import PageHeader from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/Card';
import Badge from '@/components/shared/Badge';
import Button from '@/components/shared/Button';
import { ROUTES } from '@/constants/routes';

// ── Helpers ────────────────────────────────────────────────────────────────
const inr    = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmt    = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const overdueBadge = (days) => {
  if (days == null) return <span className="text-[var(--color-text-subtle)]">—</span>;
  if (days > 30) return <Badge variant="danger"  dot size="sm">{days}d overdue</Badge>;
  if (days > 7)  return <Badge variant="warning" dot size="sm">{days}d overdue</Badge>;
  return           <Badge variant="success" dot size="sm">{days}d</Badge>;
};

// ── Expandable Invoice Row ─────────────────────────────────────────────────
function InvoiceBreakdown({ invoices }) {
  if (!invoices?.length) {
    return <p className="text-xs sm:text-sm text-center text-[var(--color-text-subtle)] py-3">No invoice details available.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
      <table className="w-full text-xs sm:text-sm min-w-[480px]">
        <thead>
          <tr className="bg-[var(--color-surface-2)] text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="px-3 sm:px-4 py-2 text-left">Invoice #</th>
            <th className="px-3 sm:px-4 py-2 text-right">Pending Amount</th>
            <th className="px-3 sm:px-4 py-2 text-center">Due Date</th>
            <th className="px-3 sm:px-4 py-2 text-center">Overdue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
          {invoices.map((inv) => (
            <tr key={inv.invoiceId} className="hover:bg-[var(--color-surface-2)] transition">
              <td className="px-3 sm:px-4 py-2 font-mono font-semibold text-[var(--color-primary)]">{inv.invoiceNumber}</td>
              <td className="px-3 sm:px-4 py-2 text-right font-bold text-[var(--color-danger)]">{inr(inv.pendingAmount)}</td>
              <td className="px-3 sm:px-4 py-2 text-center text-[var(--color-text-muted)]">{fmt(inv.dueDate)}</td>
              <td className="px-3 sm:px-4 py-2 text-center">{overdueBadge(inv.overdueDays)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Payment Row ────────────────────────────────────────────────────────────
function PaymentRow({ row, expanded, onToggle, navigate }) {
  return (
    <>
      {/* Main row */}
      <tr
        className="hover:bg-[var(--color-primary-50)] transition cursor-pointer border-b border-[var(--color-border)]"
        onClick={onToggle}
      >
        <td className="px-3 sm:px-4 py-3 sm:py-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #EF4444, #F97316)' }}
            >
              {row.customerName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-[var(--color-text)] truncate">{row.customerName}</p>
              <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] truncate">{row.mobile}</p>
            </div>
          </div>
        </td>
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-[var(--color-text-muted)]">
          <span className="truncate max-w-[120px] sm:max-w-[180px] block">
            {[row.area, row.city].filter(Boolean).join(', ') || row.mobile || '—'}
          </span>
        </td>
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-right">
          <span className="text-xs sm:text-base font-bold text-[var(--color-danger)]">{inr(row.totalDueAmount)}</span>
        </td>
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-center">
          {overdueBadge(row.maxOverdueDays)}
        </td>
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-center text-xs sm:text-sm text-[var(--color-text-muted)] whitespace-nowrap">
          {row.lastPaymentDate ? fmt(row.lastPaymentDate) : <span className="text-[var(--color-danger)]">Never</span>}
        </td>
        <td className="px-3 sm:px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={e => { e.stopPropagation(); navigate(ROUTES.CUSTOMER_PROFILE, { state: { id: row.customerId } }); }}
              title="View Profile"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition"
            >
              <Eye size={15} />
            </button>
            <button
              title={expanded ? 'Collapse' : 'Expand Invoices'}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable invoice breakdown */}
      {expanded && (
        <tr className="border-b border-[var(--color-border)]">
          <td
            colSpan={6}
            className="bg-[var(--color-surface-2)] px-3 sm:px-5 py-3 sm:py-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Invoice Breakdown</p>
            <InvoiceBreakdown invoices={row.overdueInvoices} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── PendingPaymentsDashboard ───────────────────────────────────────────────
export default function PendingPaymentsDashboard() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy,     setSortBy]     = useState('totalDueAmount');
  const [sortDir,    setSortDir]    = useState('desc');
  const [expanded,   setExpanded]   = useState({});   // { [customerId]: boolean }

  const [totalDue, setTotalDue] = useState(0);

  const fetchData = useCallback(async (p, sb, sd) => {
    setLoading(true);
    try {
      const res   = await customerService.getPendingPayments({ page: p, size: 20, sortBy: sb, sortDir: sd });
      const paged = res?.data ?? res;
      const content = paged?.content ?? [];
      setRows(content);
      setTotalPages(paged?.totalPages ?? 0);
      setTotalElements(paged?.totalElements ?? 0);
      // Compute grand total due across this page
      const grand = content.reduce((sum, r) => sum + (Number(r.totalDueAmount) || 0), 0);
      setTotalDue(grand);
    } catch (err) {
      toast({ type: 'error', message: err?.message ?? 'Failed to load pending payments.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(page, sortBy, sortDir); }, [page, sortBy, sortDir, fetchData]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
    setPage(0);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const thCls = (field) =>
    `px-3 sm:px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] cursor-pointer select-none hover:text-[var(--color-text)] transition whitespace-nowrap`;

  const sortIndicator = (field) => sortBy === field
    ? (sortDir === 'asc' ? ' ↑' : ' ↓')
    : '';

  // Compute stats from current page
  const overdueOver30 = rows.filter(r => (r.maxOverdueDays ?? 0) > 30).length;
  const neverPaid     = rows.filter(r => !r.lastPaymentDate).length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Pending Payments"
        subtitle="Accounts receivable — customers with outstanding balances."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers', href: ROUTES.CUSTOMERS },
          { label: 'Pending Payments' },
        ]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon={<TrendingDown size={14} />}
            onClick={() => fetchData(page, sortBy, sortDir)}
          >
            Refresh
          </Button>
        }
      />

      {/* Stat Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          value={totalElements}
          label="Customers with Dues"
          accent="danger"
          icon={<Wallet />}
        />
        <StatCard
          value={inr(totalDue)}
          label="Total Outstanding (this page)"
          accent="warning"
          icon={<TrendingDown />}
          sub="Across current page"
          subVariant="neutral"
        />
        <StatCard
          value={overdueOver30}
          label=">30 Days Overdue"
          accent="danger"
          icon={<AlertTriangle />}
        />
        <StatCard
          value={neverPaid}
          label="Never Paid"
          accent="warning"
          icon={<Clock />}
        />
      </div>

      {/* Table Card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {/* Sort controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 sm:px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${totalElements} customer${totalElements !== 1 ? 's' : ''} with pending dues`}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs text-[var(--color-text-subtle)]">Sort by:</span>
            <button
              onClick={() => toggleSort('totalDueAmount')}
              className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-sm)] border transition font-medium ${sortBy === 'totalDueAmount' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}
            >
              Due Amount <ArrowUpDown size={10} className="inline ml-0.5" />
            </button>
            <button
              onClick={() => toggleSort('maxOverdueDays')}
              className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-sm)] border transition font-medium ${sortBy === 'maxOverdueDays' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}
            >
              Overdue Days <ArrowUpDown size={10} className="inline ml-0.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <th className={thCls('customerName')}>Customer</th>
                <th className={thCls('area')}>Location</th>
                <th className={thCls('totalDueAmount')} onClick={() => toggleSort('totalDueAmount')}>
                  Total Due {sortIndicator('totalDueAmount')}
                </th>
                <th className={thCls('maxOverdueDays')} onClick={() => toggleSort('maxOverdueDays')}>
                  Max Overdue {sortIndicator('maxOverdueDays')}
                </th>
                <th className={`${thCls('lastPaymentDate')} text-center`}>Last Payment</th>
                <th className="px-3 sm:px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-3 sm:px-4 py-4">
                          <div className="h-4 rounded bg-[var(--color-border)] animate-pulse" style={{ width: `${50 + j * 8}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                        <Wallet size={36} className="opacity-30" />
                        <p className="font-semibold">No pending payments 🎉</p>
                        <p className="text-sm">All customers are up to date.</p>
                      </div>
                    </td>
                  </tr>
                )
                : rows.map(row => (
                  <PaymentRow
                    key={row.customerId}
                    row={row}
                    expanded={!!expanded[row.customerId]}
                    onToggle={() => toggleExpand(row.customerId)}
                    navigate={navigate}
                  />
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-5 py-3 border-t border-[var(--color-border)]">
            <span className="text-xs sm:text-sm text-[var(--color-text-muted)] text-center sm:text-left">
              Page {page + 1} of {totalPages} ({totalElements} customers)
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition">‹ Previous</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition">Next ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

