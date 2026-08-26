// src/pages/customers/CustomerProfile.jsx
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Star, ShieldX,
  ShoppingCart, FileText, CreditCard, TrendingUp, Clock, ChevronDown,
  Pencil, Trash2, RefreshCw, Building2, Link2, Plus, CheckCircle2,
  AlertTriangle, Eye, ArrowUpRight, History, X, IndianRupee, Layers,
} from 'lucide-react';
import { customerService } from '@/services/customerService';
import { generatorOrderService } from '@/services/generatorOrderService';
import { useToast } from '@/components/shared/toast/ToastProvider';
import PageHeader from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/Card';
import Badge from '@/components/shared/Badge';
import Button from '@/components/shared/Button';
import DataTable from '@/components/shared/DataTable';
import { ROUTES } from '@/constants/routes';
import CustomerFormModal from './CustomerFormModal';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const inr   = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const statusVariant = (s) => ({ ACTIVE: 'success', INACTIVE: 'warning', BLOCKED: 'danger' }[s] ?? 'neutral');

const orderStatusVariant = (s) => ({
  ACTIVE: 'success', COMPLETED: 'success', PENDING: 'warning',
  CONFIRMED: 'info', CANCELLED: 'danger', DRAFT: 'neutral',
}[s] ?? 'neutral');

const billingStatusVariant = (s) => ({
  COMPLETED: 'success', PENDING: 'warning', DRAFT: 'neutral',
}[s] ?? 'warning');

const paymentStatusVariant = (s) => ({
  PAID: 'success', PARTIAL_PAID: 'info', PENDING: 'warning', OVERDUE: 'danger',
}[s] ?? 'warning');

const paymentStatusLabel = (s) => ({
  PAID: 'Paid in Full', PARTIAL_PAID: 'Partially Paid', PENDING: 'Pending', OVERDUE: 'Overdue',
}[s] ?? (s || 'Pending'));

// ── Record Payment Modal ───────────────────────────────────────────────────
function RecordPaymentModal({ order, onClose, onSuccess }) {
  const toast = useToast();
  const [amount, setAmount]               = useState('');
  const [paymentMode, setPaymentMode]     = useState('CASH');
  const [paymentDate, setPaymentDate]     = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference]         = useState('');
  const [notes, setNotes]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const totalAmount   = Number(order.finalAmount) || 0;
  const currentPaid   = Number(order.paidAmount) || 0;
  const currentPending = Math.max(0, totalAmount - currentPaid);

  useEffect(() => {
    if (currentPending > 0) {
      setAmount(String(currentPending));
    }
  }, [currentPending]);

  const enteredAmt = Number(amount) || 0;
  const projectedRemaining = Math.max(0, currentPending - enteredAmt);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enteredAmt || enteredAmt <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (enteredAmt > currentPending + 0.01) {
      setError(`Payment amount cannot exceed the pending balance (₹${currentPending.toLocaleString('en-IN')}).`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await generatorOrderService.recordPayment(order.id, {
        amount: enteredAmt,
        paymentMode,
        paymentDate,
        transactionReference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast({ type: 'success', message: `Recorded payment of ₹${enteredAmt.toLocaleString('en-IN')} for Order #${order.orderNumber}` });
      onSuccess();
    } catch (err) {
      setError(err?.data?.message ?? err?.message ?? 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] w-full max-w-md my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">Record Payment</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] transition">
            <X size={18} />
          </button>
        </div>

        {/* Balance Overview */}
        <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-[var(--color-surface-2)]">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">Total Bill</p>
            <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] mt-0.5">{inr(totalAmount)}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Paid</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{inr(currentPaid)}</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">Pending</p>
            <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{inr(currentPending)}</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Amount Paid (₹) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(currentPending))}
                className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
              >
                Full Pending (₹{currentPending.toLocaleString('en-IN')})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-[var(--color-text-subtle)]">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentPending}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-base font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            {enteredAmt > 0 && (
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1 flex items-center justify-between">
                <span>Remaining Balance after payment:</span>
                <span className={`font-bold ${projectedRemaining === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {inr(projectedRemaining)} {projectedRemaining === 0 ? '(Fully Paid ✓)' : '(Partial)'}
                </span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
              Transaction / Cheque Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #, Cheque #, NEFT UTR"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
              Notes / Remarks (Optional)
            </label>
            <textarea
              placeholder="e.g. Received advance on booking / party settled balance"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" loading={loading} icon={<CheckCircle2 size={16} />}>
              Save Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Payment History Modal ──────────────────────────────────────────────────
function PaymentHistoryModal({ order, onClose }) {
  const payments = order?.payments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] w-full max-w-xl my-auto overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">Payment History</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {payments.length === 0 ? (
            <div className="text-center py-10 text-[var(--color-text-subtle)] text-sm">
              <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
              No recorded payments yet for this order.
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p, idx) => (
                <div key={p.id || idx} className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">+{inr(p.amount)}</span>
                      <Badge variant="info" size="sm">{p.paymentMode}</Badge>
                      <span className="text-xs text-[var(--color-text-muted)] font-medium">on {fmt(p.paymentDate)}</span>
                    </div>
                    {p.transactionReference && (
                      <p className="text-xs text-[var(--color-text-subtle)]">Ref: <span className="font-mono text-[var(--color-text)]">{p.transactionReference}</span></p>
                    )}
                    {p.notes && (
                      <p className="text-xs text-[var(--color-text-muted)] italic">"{p.notes}"</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--color-border)]">
                    <p className="text-[10px] uppercase font-semibold text-[var(--color-text-subtle)]">Balance After</p>
                    <p className={`text-xs font-bold ${Number(p.pendingAfterPayment) === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {inr(p.pendingAfterPayment)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ── CustomerProfile Page Component ─────────────────────────────────────────
export default function CustomerProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast    = useToast();

  // Retrieve customer ID from state or fallback to sessionStorage
  const customerId = location.state?.id || sessionStorage.getItem('activeCustomerId');

  const [profile, setProfile]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [editOpen, setEditOpen]           = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);

  // Store activeCustomerId in sessionStorage whenever present in route state
  useEffect(() => {
    if (location.state?.id) {
      sessionStorage.setItem('activeCustomerId', String(location.state.id));
    }
  }, [location.state]);

  const fetchProfile = useCallback(async () => {
    if (!customerId) {
      navigate(ROUTES.CUSTOMERS);
      return;
    }
    setLoading(true);
    try {
      const res = await customerService.getProfile(customerId);
      setProfile(res?.data ?? res);
    } catch (err) {
      toast({ type: 'error', message: err?.message ?? 'Failed to load customer details.' });
    } finally {
      setLoading(false);
    }
  }, [customerId, navigate, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleMarkPaymentDone = async (order) => {
    try {
      await generatorOrderService.markPaymentDone(order.id);
      toast({ type: 'success', message: `Marked Order #${order.orderNumber} payment as paid in full.` });
      fetchProfile();
    } catch (err) {
      toast({ type: 'error', message: err?.data?.message ?? err?.message ?? 'Failed to mark payment as done.' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse p-4">
        <div className="h-40 rounded-[var(--radius-xl)] bg-[var(--color-border)]" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-[var(--color-border)]" />
          ))}
        </div>
        <div className="h-96 rounded-[var(--radius-xl)] bg-[var(--color-border)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24 text-[var(--color-text-muted)] space-y-3">
        <p className="text-base font-semibold">Customer details could not be found.</p>
        <Button variant="primary" onClick={() => navigate(ROUTES.CUSTOMERS)}>Back to Customer Directory</Button>
      </div>
    );
  }

  const displayName = profile.name ?? 'Customer Profile';
  const orders      = profile.recentOrders ?? [];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* ── TOP BREADCRUMB & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(ROUTES.CUSTOMERS)}
            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text)]">{displayName}</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Customer Account & Payment Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchProfile}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" icon={<Pencil size={14} />} onClick={() => setEditOpen(true)}>
            Edit Details
          </Button>
        </div>
      </div>

      {/* ── 1. CUSTOMER PROFILE DETAILS (TOP CARD) ── */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-5">
          {/* Main Info */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-white shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}
            >
              {profile.name?.charAt(0)?.toUpperCase() ?? 'C'}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-[var(--color-text)] truncate">{profile.name}</h2>
                <Badge variant={statusVariant(profile.customerStatus)} dot size="sm">
                  {profile.customerStatus || 'ACTIVE'}
                </Badge>
                {profile.isRegular && (
                  <Badge variant="warning" size="sm">⭐ Regular Customer</Badge>
                )}
              </div>

              {profile.firmName && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Building2 size={15} className="text-slate-400 shrink-0" />
                  <span>{profile.firmName}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1">
                  <Phone size={12} className="text-[var(--color-text-subtle)]" />
                  <span className="font-medium text-[var(--color-text)]">{profile.mobile}</span>
                  {profile.alternateMobile && <span className="text-[var(--color-text-subtle)]">({profile.alternateMobile})</span>}
                </div>
                {profile.email && (
                  <div className="flex items-center gap-1">
                    <Mail size={12} className="text-[var(--color-text-subtle)]" />
                    <span>{profile.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-[var(--color-text-subtle)]" />
                  <span>Joined: {fmt(profile.dateJoined)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address & Remarks side */}
          <div className="w-full lg:w-96 rounded-xl bg-[var(--color-surface-2)] p-3.5 border border-[var(--color-border)] space-y-2.5 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] mb-1 flex items-center gap-1">
                <MapPin size={12} /> Site Address
              </p>
              <p className="text-[var(--color-text)] leading-relaxed font-medium">
                {profile.address || <span className="text-[var(--color-text-subtle)] italic">No site address recorded</span>}
              </p>
              {profile.addressLocationLink && (
                <a
                  href={profile.addressLocationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--color-primary)] font-semibold mt-1 hover:underline"
                >
                  <Link2 size={11} /> Open in Google Maps <ArrowUpRight size={10} />
                </a>
              )}
            </div>

            {profile.remarks && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] mb-0.5">Remarks / Notes</p>
                <p className="text-[var(--color-text-muted)] italic leading-relaxed whitespace-pre-wrap">{profile.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. SUMMARY METRICS (CUSTOMER-WISE STATS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total Revenue</p>
          <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-1">{inr(profile.totalBusinessValue)}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Paid</p>
          <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{inr(profile.totalPaidAmount)}</p>
        </div>

        <div className={`rounded-xl border p-3.5 shadow-sm ${Number(profile.outstandingDues) > 0 ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${Number(profile.outstandingDues) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--color-text-muted)]'}`}>
            Pending Balance
          </p>
          <p className={`text-base sm:text-lg font-black mt-1 ${Number(profile.outstandingDues) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
            {inr(profile.outstandingDues)}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total Orders</p>
          <p className="text-base sm:text-lg font-black text-[var(--color-text)] mt-1">{profile.totalOrders ?? 0}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed Orders</p>
          <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{profile.completedOrders ?? 0}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Dues Pending Orders</p>
          <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1">{profile.pendingPaymentOrders ?? 0}</p>
        </div>
      </div>

      {/* ── 3. EXPANDED ORDERS & PAYMENT TRACKING TABLE ── */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)] flex items-center gap-2">
              <ShoppingCart size={17} className="text-[var(--color-primary)]" />
              Customer Orders & Payment Ledger
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Complete history of generator bookings, partial payments, and balances.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary)] self-start sm:self-auto">
            {orders.length} Order{orders.length !== 1 ? 's' : ''} Found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="px-4 py-3">Order / Bill #</th>
                <th className="px-4 py-3">Function Date</th>
                <th className="px-4 py-3 text-center">Billing Status</th>
                <th className="px-4 py-3 text-right">Total Bill</th>
                <th className="px-4 py-3 text-right">Paid Amount</th>
                <th className="px-4 py-3 text-right">Pending Balance</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-4 py-3 text-center">Paid Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[var(--color-text-muted)]">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No orders recorded yet for this customer.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const billAmt     = Number(ord.finalAmount) || 0;
                  const paidAmt     = Number(ord.paidAmount) || 0;
                  const pendingAmt  = Math.max(0, billAmt - paidAmt);
                  const isFullyPaid = ord.paymentStatus === 'PAID' || pendingAmt === 0;
                  const hasPayments = (ord.payments && ord.payments.length > 0);

                  return (
                    <tr key={ord.id} className="hover:bg-[var(--color-surface-2)] transition">
                      {/* Order & Bill */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-[var(--color-primary)]">
                          {ord.orderNumber}
                        </div>
                        {ord.billNumber ? (
                          <div className="text-[11px] text-[var(--color-text-muted)] font-mono">
                            Bill #{ord.billNumber}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[var(--color-text-subtle)] italic">No Bill #</div>
                        )}
                      </td>

                      {/* Function Date */}
                      <td className="px-4 py-3.5 text-[var(--color-text)] whitespace-nowrap">
                        {ord.functionDate || fmt(ord.deliveryDate)}
                      </td>

                      {/* Billing Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={billingStatusVariant(ord.billingStatus)} size="sm">
                          {ord.billingStatus || 'PENDING'}
                        </Badge>
                      </td>

                      {/* Total Bill */}
                      <td className="px-4 py-3.5 text-right font-bold text-[var(--color-text)]">
                        {inr(billAmt)}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {inr(paidAmt)}
                      </td>

                      {/* Pending Balance */}
                      <td className="px-4 py-3.5 text-right font-bold">
                        <span className={pendingAmt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                          {inr(pendingAmt)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={paymentStatusVariant(ord.paymentStatus)} dot size="sm">
                          {paymentStatusLabel(ord.paymentStatus)}
                        </Badge>
                      </td>

                      {/* Payment Completion Date */}
                      <td className="px-4 py-3.5 text-center text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        {ord.paymentCompletionDate ? fmt(ord.paymentCompletionDate) : (
                          isFullyPaid ? fmt(ord.createdAt) : <span className="text-[var(--color-text-subtle)]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Payment Button */}
                          {!isFullyPaid && (
                            <button
                              onClick={() => setPaymentTarget(ord)}
                              title="Record Partial or Full Payment"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm inline-flex items-center gap-1"
                            >
                              <Plus size={12} /> Pay
                            </button>
                          )}

                          {/* Quick Mark Paid button if not fully paid */}
                          {!isFullyPaid && (
                            <button
                              onClick={() => handleMarkPaymentDone(ord)}
                              title="Quick Mark as Paid in Full"
                              className="px-2 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-emerald-600 hover:border-emerald-500 transition"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}

                          {/* Payment History button */}
                          <button
                            onClick={() => setHistoryTarget(ord)}
                            title="View Payment History"
                            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition"
                          >
                            <History size={14} />
                          </button>

                          {/* View Order / Billing button */}
                          <button
                            onClick={() => navigate(`/generators/orders/${ord.id}/billing`)}
                            title="View Full Order Billing"
                            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALS ── */}
      {editOpen && (
        <CustomerFormModal
          customer={profile}
          onSuccess={() => { setEditOpen(false); fetchProfile(); }}
          onClose={() => setEditOpen(false)}
        />
      )}

      {paymentTarget && (
        <RecordPaymentModal
          order={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => { setPaymentTarget(null); fetchProfile(); }}
        />
      )}

      {historyTarget && (
        <PaymentHistoryModal
          order={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
