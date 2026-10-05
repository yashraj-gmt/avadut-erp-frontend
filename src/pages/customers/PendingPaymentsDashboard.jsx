// src/pages/customers/PendingPaymentsDashboard.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, AlertTriangle, ChevronDown, ChevronUp, Eye,
  TrendingDown, Search, X, CheckCircle2,
  FileText, IndianRupee, RefreshCw
} from 'lucide-react';
import { customerService } from '@/services/customerService';
import { useToast } from '@/components/shared/toast/ToastProvider';
import PageHeader from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/Card';
import Badge from '@/components/shared/Badge';
import Button from '@/components/shared/Button';
import { ROUTES } from '@/constants/routes';
import OrderPaymentModal from '@/pages/generators/orders/OrderPaymentModal';

import { formatToDMY } from '@/utils/helpers';

// ── Helpers ────────────────────────────────────────────────────────────────
const inr = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
const fmt = (d) => formatToDMY(d);

/** Truncate at 25 characters max, appending '…' if exceeded, full value on tooltip */
function TruncatedText({ text, className = '' }) {
  if (!text) return <span className="text-[var(--color-text-subtle)]">-</span>;
  const isLong = text.length > 25;
  return (
    <span
      title={isLong ? text : undefined}
      className={`inline-block ${className}`}
    >
      {isLong ? `${text.slice(0, 25)}…` : text}
    </span>
  );
}

const overdueBadge = (days) => {
  if (days == null) return <span className="text-[var(--color-text-subtle)]">-</span>;
  if (days > 30) return <Badge variant="danger" dot size="sm">{days}d overdue</Badge>;
  if (days > 0)  return <Badge variant="warning" dot size="sm">{days}d overdue</Badge>;
  if (days === 0) return <Badge variant="info" dot size="sm">Due today</Badge>;
  return <Badge variant="success" dot size="sm">{Math.abs(days)}d left</Badge>;
};

// ── Expandable Invoice/Order Breakdown ─────────────────────────────────────
function InvoiceBreakdown({ invoices, customer, onRecordPayment, navigate }) {
  if (!invoices?.length) {
    return <p className="text-xs sm:text-sm text-center text-[var(--color-text-subtle)] py-4">No order or bill breakdown available.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-xs">
      <table className="w-full text-xs sm:text-sm min-w-[720px]">
        <thead>
          <tr className="bg-[var(--color-surface-2)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="px-3 sm:px-4 py-2.5 text-left">Order & Bill #</th>
            <th className="px-3 sm:px-4 py-2.5 text-left">Function Date</th>
            <th className="px-3 sm:px-4 py-2.5 text-center">Billing Status</th>
            <th className="px-3 sm:px-4 py-2.5 text-right">Total Amount</th>
            <th className="px-3 sm:px-4 py-2.5 text-right">Paid Amount</th>
            <th className="px-3 sm:px-4 py-2.5 text-right">Pending Due</th>
            <th className="px-3 sm:px-4 py-2.5 text-center">Due Date</th>
            <th className="px-3 sm:px-4 py-2.5 text-center">Overdue</th>
            <th className="px-3 sm:px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
          {invoices.map((inv, idx) => {
            const isBilled = inv.billingStatus === 'COMPLETED';
            const orderObj = {
              id: inv.orderId || inv.invoiceId,
              orderNumber: inv.orderNumber || inv.invoiceNumber,
              billNumber: inv.billNumber || (isBilled ? inv.invoiceNumber : null),
              billingStatus: inv.billingStatus || (isBilled ? 'COMPLETED' : 'PENDING'),
              finalAmount: inv.totalAmount || inv.pendingAmount,
              paidAmount: inv.paidAmount || 0,
              pendingAmount: inv.pendingAmount,
              paymentStatus: inv.paymentStatus || 'PENDING',
              customer: {
                id: customer.customerId,
                name: customer.customerName,
                mobile: customer.mobile,
                firmName: customer.firmName,
              },
              clientName: customer.customerName,
            };

            return (
              <tr key={inv.invoiceId || inv.orderId || idx} className="hover:bg-[var(--color-surface-2)] transition">
                {/* Order & Bill */}
                <td className="px-3 sm:px-4 py-2.5 font-mono">
                  <div className="font-bold text-[var(--color-primary)]">
                    {inv.orderNumber || inv.invoiceNumber || '-'}
                  </div>
                  {inv.billNumber ? (
                    <div className="text-[11px] text-[var(--color-text-muted)] font-sans">
                      Bill: <span className="font-mono font-semibold">{inv.billNumber}</span>
                    </div>
                  ) : null}
                </td>

                {/* Function / Booking Date */}
                <td className="px-3 sm:px-4 py-2.5 text-[var(--color-text-muted)] whitespace-nowrap">
                  {inv.functionDate ? fmt(inv.functionDate) : '-'}
                </td>

                {/* Billing Status */}
                <td className="px-3 sm:px-4 py-2.5 text-center">
                  <Badge variant={isBilled ? 'success' : 'warning'} size="sm">
                    {isBilled ? 'Completed' : 'Pending'}
                  </Badge>
                </td>

                {/* Total */}
                <td className="px-3 sm:px-4 py-2.5 text-right font-medium text-[var(--color-text)]">
                  {inv.totalAmount != null ? inr(inv.totalAmount) : inr(inv.pendingAmount)}
                </td>

                {/* Paid */}
                <td className="px-3 sm:px-4 py-2.5 text-right font-semibold text-emerald-600">
                  {inv.paidAmount != null ? inr(inv.paidAmount) : '₹0.00'}
                </td>

                {/* Pending */}
                <td className="px-3 sm:px-4 py-2.5 text-right font-bold text-rose-600">
                  {inr(inv.pendingAmount)}
                </td>

                {/* Due Date */}
                <td className="px-3 sm:px-4 py-2.5 text-center text-[var(--color-text-muted)] whitespace-nowrap">
                  {fmt(inv.dueDate)}
                </td>

                {/* Overdue */}
                <td className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">
                  {overdueBadge(inv.overdueDays)}
                </td>

                {/* Actions */}
                <td className="px-3 sm:px-4 py-2.5 text-right">
                  {isBilled ? (
                    <button
                      onClick={() => onRecordPayment(orderObj)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
                      title="Record Payment for this Bill"
                    >
                      <IndianRupee size={12} />
                      Pay
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const billRoute = ROUTES.GENERATOR_ORDER_BILLING
                          ? ROUTES.GENERATOR_ORDER_BILLING.replace(':id', inv.orderId)
                          : `/generators/orders/${inv.orderId}/billing`;
                        navigate(billRoute, { state: { orderId: inv.orderId } });
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-400 bg-amber-100 hover:bg-amber-200 text-amber-950 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Billing must be completed before recording payment"
                    >
                      <FileText size={12} className="text-amber-900" />
                      Complete Bill
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Payment Row ────────────────────────────────────────────────────────────
function PaymentRow({ row, srNo, expanded, onToggle, navigate, onRecordPayment }) {
  const payableInvoices = (row.overdueInvoices || []).filter(i => i.billingStatus === 'COMPLETED');
  const pendingInvoices = (row.overdueInvoices || []).filter(i => (i.billingStatus || 'PENDING') === 'PENDING');
  const defaultPayable = payableInvoices[0] || (row.overdueInvoices || [])[0];

  const handleQuickPay = (e) => {
    e.stopPropagation();
    if (!defaultPayable) return;
    const isBilled = defaultPayable.billingStatus === 'COMPLETED';
    const orderObj = {
      id: defaultPayable.orderId || defaultPayable.invoiceId,
      orderNumber: defaultPayable.orderNumber || defaultPayable.invoiceNumber,
      billNumber: defaultPayable.billNumber || (isBilled ? defaultPayable.invoiceNumber : null),
      billingStatus: defaultPayable.billingStatus || (isBilled ? 'COMPLETED' : 'PENDING'),
      finalAmount: defaultPayable.totalAmount || defaultPayable.pendingAmount,
      paidAmount: defaultPayable.paidAmount || 0,
      pendingAmount: defaultPayable.pendingAmount,
      paymentStatus: defaultPayable.paymentStatus || 'PENDING',
      customer: {
        id: row.customerId,
        name: row.customerName,
        mobile: row.mobile,
        firmName: row.firmName,
      },
      clientName: row.customerName,
    };
    onRecordPayment(orderObj);
  };

  const invoiceCount = row.pendingOrderCount || row.overdueInvoices?.length || 1;

  return (
    <>
      {/* Main row */}
      <tr
        className="hover:bg-[var(--color-primary-50)] transition cursor-pointer border-b border-[var(--color-border)]"
        onClick={onToggle}
      >
        {/* 1. Sr. No. */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs text-[var(--color-text-muted)] font-semibold text-center whitespace-nowrap">
          {srNo}
        </td>

        {/* 2. Customer Name */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] leading-snug">
              <TruncatedText text={row.customerName} />
            </p>
            {row.totalDueAmount != null && (
              <span className="text-[11px] font-semibold text-rose-600">
                Due: {inr(row.totalDueAmount)} ({invoiceCount} bill{invoiceCount !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </td>

        {/* 3. Firm Name */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-[var(--color-text)] font-medium">
          <TruncatedText text={row.firmName} />
        </td>

        {/* 4. Mob. No. */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-[var(--color-text)] font-mono whitespace-nowrap">
          {row.mobile || '-'}
        </td>

        {/* 5. Alt. Mob. No. */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-[var(--color-text-muted)] font-mono whitespace-nowrap">
          {row.alternateMobile || '-'}
        </td>

        {/* 6. Site Address */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs text-[var(--color-text-muted)]">
          <TruncatedText text={row.siteAddress || row.address || [row.area, row.city].filter(Boolean).join(', ') || '-'} />
        </td>

        {/* 7. Billing Status Badge */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-center whitespace-nowrap">
          {pendingInvoices.length > 0 && payableInvoices.length === 0 ? (
            <Badge variant="warning" size="sm">Pending ({pendingInvoices.length})</Badge>
          ) : payableInvoices.length > 0 && pendingInvoices.length === 0 ? (
            <Badge variant="success" size="sm">Completed ({payableInvoices.length})</Badge>
          ) : (
            <Badge variant="info" size="sm">{payableInvoices.length} Done / {pendingInvoices.length} Pend.</Badge>
          )}
        </td>

        {/* 8. Max Overdue */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-center whitespace-nowrap">
          {overdueBadge(row.maxOverdueDays)}
        </td>

        {/* 9. Last Payment */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-center text-xs text-[var(--color-text-muted)] whitespace-nowrap">
          {row.lastPaymentDate ? fmt(row.lastPaymentDate) : <span className="text-rose-600 font-semibold">Never</span>}
        </td>

        {/* 10. Actions */}
        <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
            {/* Quick Pay button */}
            {defaultPayable && defaultPayable.billingStatus === 'COMPLETED' ? (
              <button
                onClick={handleQuickPay}
                title="Record Payment"
                className="px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
              >
                <IndianRupee size={12} />
                <span className="hidden sm:inline">Pay</span>
              </button>
            ) : null}

            {/* View Profile */}
            <button
              onClick={() => navigate(ROUTES.CUSTOMER_PROFILE, { state: { id: row.customerId } })}
              title="View Customer Profile"
              className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] transition cursor-pointer"
            >
              <Eye size={15} />
            </button>

            {/* Expand / Collapse */}
            <button
              onClick={onToggle}
              title={expanded ? 'Collapse Bills' : 'Expand Bills'}
              className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition cursor-pointer"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable breakdown */}
      {expanded && (
        <tr className="bg-[var(--color-surface-2)]/60 border-b border-[var(--color-border)]">
          <td colSpan={10} className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Bills & Orders Breakdown for {row.customerName}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-subtle)]">
                {row.overdueInvoices?.length || 0} record{(row.overdueInvoices?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            <InvoiceBreakdown
              invoices={row.overdueInvoices}
              customer={row}
              onRecordPayment={onRecordPayment}
              navigate={navigate}
            />
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
  const [stats,      setStats]      = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [page,       setPage]       = useState(0);
  const [pageSize,   setPageSize]   = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [sortBy,     setSortBy]     = useState('totalDueAmount');
  const [sortDir,    setSortDir]    = useState('desc');
  const [search,     setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [billingStatusFilter, setBillingStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'

  const [expanded,   setExpanded]   = useState({});
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch global stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await customerService.getPendingPaymentStats();
      const data = res?.data ?? res;
      setStats(data);
    } catch (err) {
      console.warn('Failed to load pending payments stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch paginated rows
  const fetchData = useCallback(async (p, ps, sb, sd, q, sf, bf) => {
    setLoading(true);
    try {
      const res = await customerService.getPendingPayments({
        page: p,
        size: ps,
        sortBy: sb,
        sortDir: sd,
        search: q?.trim() || undefined,
        status: sf !== 'ALL' ? sf : undefined,
        billingStatus: bf !== 'ALL' ? bf : undefined,
      });
      const paged = res?.data ?? res;
      const content = paged?.content ?? [];
      setRows(content);
      setTotalPages(paged?.totalPages ?? 0);
      setTotalElements(paged?.totalElements ?? 0);
    } catch (err) {
      toast({ type: 'error', message: err?.message ?? 'Failed to load pending payments.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchData(page, pageSize, sortBy, sortDir, debouncedSearch, statusFilter, billingStatusFilter);
  }, [page, pageSize, sortBy, sortDir, debouncedSearch, statusFilter, billingStatusFilter, fetchData]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const expandAll = () => {
    const all = {};
    rows.forEach(r => { all[r.customerId] = true; });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  const handleRefresh = () => {
    fetchStats();
    fetchData(page, pageSize, sortBy, sortDir, debouncedSearch, statusFilter, billingStatusFilter);
  };

  const handlePaymentSuccess = (updatedOrder) => {
    handleRefresh();
    if (updatedOrder) {
      setSelectedOrderForPayment(prev => prev ? { ...prev, ...updatedOrder } : updatedOrder);
    }
  };

  const thCls = (field, align = 'text-left') =>
    `px-3 sm:px-4 py-3 ${align} text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] cursor-pointer select-none hover:text-[var(--color-text)] transition whitespace-nowrap`;

  const sortIndicator = (field) => sortBy === field
    ? (sortDir === 'asc' ? ' ↑' : ' ↓')
    : '';

  // Local fallback stats
  const pageDueTotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.totalDueAmount) || 0), 0);
  }, [rows]);

  const overdueOver30 = rows.filter(r => (r.maxOverdueDays ?? 0) > 30).length;

  // Filter rows by billing status (Instant client-side filter)
  const displayedRows = useMemo(() => {
    if (billingStatusFilter === 'ALL') return rows;
    if (billingStatusFilter === 'PENDING') {
      return rows.filter(r => (r.overdueInvoices || []).some(i => (i.billingStatus || 'PENDING') === 'PENDING'));
    }
    if (billingStatusFilter === 'COMPLETED') {
      return rows.filter(r => (r.overdueInvoices || []).some(i => i.billingStatus === 'COMPLETED'));
    }
    return rows;
  }, [rows, billingStatusFilter]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Pending Payments"
        subtitle="Accounts receivable - track outstanding client balances, overdue invoices, and collect payments."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers', href: ROUTES.CUSTOMERS },
          { label: 'Pending Payments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          value={stats?.totalCustomersWithDues ?? totalElements}
          label="Customers with Dues"
          accent="danger"
          icon={<Wallet />}
          sub={stats?.totalPendingOrders ? `${stats.totalPendingOrders} unpaid orders total` : undefined}
        />
        <StatCard
          value={inr(stats?.totalOutstandingAmount ?? pageDueTotal)}
          label="Total Outstanding"
          accent="warning"
          icon={<TrendingDown />}
          sub="Total ERP receivable"
          subVariant="neutral"
        />
        <StatCard
          value={stats?.overdueOver30Count ?? overdueOver30}
          label=">30 Days Overdue"
          accent="danger"
          icon={<AlertTriangle />}
          sub="High priority collection"
        />
      </div>

      {/* ── Main Data Card (Light surface) ── */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {/* Search, Filter & Controls Bar */}
        <div className="flex flex-col gap-3 p-3.5 sm:p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search box */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by customer name, mobile, firm, or bill #…"
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Chips & Controls */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Billing Status Filter: All | Pending | Completed */}
              <div className="flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-1.5">
                  Billing:
                </span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'COMPLETED', label: 'Completed' },
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { setBillingStatusFilter(b.id); setPage(0); }}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      billingStatusFilter === b.id
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-[var(--color-border)] mx-1 hidden sm:block" />

              {/* Due Status Filter: All Dues | Overdue Only | Critical (>30d) */}
              {[
                { id: 'ALL', label: 'All Dues' },
                { id: 'OVERDUE', label: 'Overdue Only' },
                { id: 'CRITICAL', label: 'Critical (>30d)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setStatusFilter(tab.id); setPage(0); }}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="h-5 w-px bg-[var(--color-border)] mx-1 hidden sm:block" />

              {/* Expand / Collapse all */}
              <button
                type="button"
                onClick={Object.keys(expanded).length > 0 ? collapseAll : expandAll}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition font-medium cursor-pointer"
              >
                {Object.keys(expanded).length > 0 ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>
        </div>

        {/* Results summary and Sorting bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 sm:px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)]">
          <span>
            {loading
              ? 'Loading pending payments…'
              : `Showing ${displayedRows.length} of ${totalElements} customer${totalElements !== 1 ? 's' : ''} ${
                  billingStatusFilter === 'PENDING'
                    ? 'with pending billing'
                    : billingStatusFilter === 'COMPLETED'
                    ? 'with completed billing'
                    : 'with pending dues'
                } (page size 50)`}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--color-text-subtle)] font-medium">Sort by:</span>
            {[
              { id: 'totalDueAmount', label: 'Due Amount' },
              { id: 'maxOverdueDays', label: 'Overdue Days' },
              { id: 'customerName', label: 'Customer Name' },
            ].map(col => (
              <button
                key={col.id}
                onClick={() => toggleSort(col.id)}
                className={`px-2.5 py-1 rounded-[var(--radius-sm)] border text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer ${
                  sortBy === col.id
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-primary)] border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {col.label} {sortIndicator(col.id)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <th className="px-3 sm:px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] w-14">
                  Sr. No.
                </th>
                <th className={thCls('customerName')} onClick={() => toggleSort('customerName')}>
                  Customer Name {sortIndicator('customerName')}
                </th>
                <th className={thCls('firmName')}>
                  Firm Name
                </th>
                <th className={thCls('mobile')}>
                  Mob. No.
                </th>
                <th className={thCls('alternateMobile')}>
                  Alt. Mob. No.
                </th>
                <th className={thCls('siteAddress')}>
                  Site Address
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] whitespace-nowrap">
                  Billing Status
                </th>
                <th className={thCls('maxOverdueDays', 'text-center')} onClick={() => toggleSort('maxOverdueDays')}>
                  Max Overdue {sortIndicator('maxOverdueDays')}
                </th>
                <th className={thCls('lastPaymentDate', 'text-center')}>
                  Last Payment
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                        <td key={j} className="px-3 sm:px-4 py-4">
                          <div className="h-4 rounded bg-[var(--color-border)] animate-pulse" style={{ width: `${50 + (j % 4) * 12}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : displayedRows.length === 0
                ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                        <Wallet size={40} className="opacity-30 text-emerald-500" />
                        <p className="font-bold text-base text-[var(--color-text)]">
                          {search
                            ? 'No matching pending payments found'
                            : billingStatusFilter === 'PENDING'
                            ? 'No customers with pending billing! 🎉'
                            : billingStatusFilter === 'COMPLETED'
                            ? 'No customers with completed billing found.'
                            : 'All accounts are up to date! 🎉'}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] max-w-md">
                          {search
                            ? 'Try adjusting your search or clear filters to see all outstanding accounts.'
                            : 'There are no customers matching the selected criteria.'}
                        </p>
                        {(search || billingStatusFilter !== 'ALL' || statusFilter !== 'ALL') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSearch(''); setBillingStatusFilter('ALL'); setStatusFilter('ALL'); }}
                            className="mt-2"
                          >
                            Reset All Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
                : displayedRows.map((row, idx) => (
                  <PaymentRow
                    key={row.customerId}
                    srNo={page * pageSize + idx + 1}
                    row={row}
                    expanded={!!expanded[row.customerId]}
                    onToggle={() => toggleExpand(row.customerId)}
                    navigate={navigate}
                    onRecordPayment={(order) => setSelectedOrderForPayment(order)}
                  />
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
            <span className="text-xs text-[var(--color-text-muted)] text-center sm:text-left">
              Page {page + 1} of {totalPages} ({totalElements} customers with dues, 50 per page)
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              >
                ‹ Previous
              </button>
              <span className="text-xs font-bold px-2.5 py-1 bg-[var(--color-primary-50)] text-[var(--color-primary)] rounded-lg">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Central Shared OrderPaymentModal ── */}
      {selectedOrderForPayment && (
        <OrderPaymentModal
          order={selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
