// src/pages/customers/CustomerProfile.jsx
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Star, ShieldX,
  ShoppingCart, FileText, CreditCard, TrendingUp, Clock, ChevronDown,
  Pencil, Trash2, RefreshCw, Building2, Link2, Plus,
  AlertTriangle, Eye, ArrowUpRight, History, X, IndianRupee, Layers,
  CheckCircle2,
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

import { formatToDMY, formatDateTime } from '@/utils/helpers';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt   = (d) => formatToDMY(d);
const fmtDt = (d) => formatDateTime(d);
const inr   = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

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
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount]               = useState('');
  const [paymentMode, setPaymentMode]     = useState('CASH');
  const [paymentDate, setPaymentDate]     = useState(() => today);
  const [reference, setReference]         = useState('');
  const [notes, setNotes]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const totalAmount   = Number(order.finalAmount) || Number(order.subtotal) || 0;
  const currentPaid   = Number(order.paidAmount) || 0;
  const currentPending = Math.max(0, totalAmount - currentPaid);

  // Amount field starts empty - user enters the amount they wish to pay

  const enteredAmt = Number(amount) || 0;
  const projectedRemaining = Math.max(0, currentPending - enteredAmt);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (order.billingStatus !== 'COMPLETED') {
      setError('Payment can only be recorded after billing status is completed.');
      return;
    }
    if (!enteredAmt || enteredAmt <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (enteredAmt > currentPending + 0.01) {
      setError(`Payment amount cannot exceed the pending balance (₹${currentPending.toLocaleString('en-IN')}).`);
      return;
    }
    if (paymentDate > today) {
      setError('Payment date cannot be in the future. Please select today or a previous date.');
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
              ₹
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Record Payment</h3>
              <p className="text-xs text-slate-600 font-mono font-bold">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        {/* Balance Overview */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-200 grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-slate-700">Total Bill</p>
            <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{inr(totalAmount)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-800">Paid</p>
            <p className="text-sm sm:text-base font-black text-emerald-800 mt-0.5">{inr(currentPaid)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 shadow-2xs">
            <p className="text-[11px] uppercase tracking-wider font-black text-rose-900">Pending</p>
            <p className="text-sm sm:text-base font-black text-rose-800 mt-0.5">{inr(currentPending)}</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800">
              {error}
            </div>
          )}

          {order.billingStatus !== 'COMPLETED' && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-700" />
              <span>Billing is not yet completed for this order. Payments can only be recorded after billing status is completed.</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                Amount Paid (₹) <span className="text-rose-600">*</span>
              </label>
              {currentPending > 0 && order.billingStatus === 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentPending))}
                  className="text-xs font-extrabold text-blue-700 hover:underline"
                >
                  Pay Full Balance ({inr(currentPending)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-base text-slate-700">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentPending}
                required
                disabled={order.billingStatus !== 'COMPLETED'}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 text-base font-black rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {enteredAmt > 0 && (
              <p className="text-xs text-slate-700 font-bold mt-1.5 flex items-center justify-between">
                <span>Remaining Balance after payment:</span>
                <span className={`font-black ${projectedRemaining === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {inr(projectedRemaining)} {projectedRemaining === 0 ? '(Fully Paid ✓)' : '(Partial)'}
                </span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-800 mb-1.5">
                Payment Mode <span className="text-rose-600">*</span>
              </label>
              <select
                value={paymentMode}
                disabled={order.billingStatus !== 'COMPLETED'}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer (RTGS/NEFT/IMPS)</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-800 mb-1.5">
                Payment Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                max={today}
                disabled={order.billingStatus !== 'COMPLETED'}
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-800 mb-1.5">
              Transaction / Cheque Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #, Cheque #, RTGS/NEFT UTR"
              disabled={order.billingStatus !== 'COMPLETED'}
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed placeholder:font-normal"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-800 mb-1.5">
              Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received via PhonePe, advance payment on site..."
              disabled={order.billingStatus !== 'COMPLETED'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              maxLength={255}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold">Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={loading || order.billingStatus !== 'COMPLETED'}
              icon={<CheckCircle2 size={18} />}
              className="font-black px-5"
            >
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
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg my-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Payment History</h3>
              <p className="text-xs text-slate-600 font-mono font-bold">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {payments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <CreditCard size={36} className="mx-auto mb-2 text-slate-400" />
              <p className="font-bold">No recorded payments yet for this order.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 shadow-2xs hover:border-blue-400 transition"
                >
                  {/* Left Column: Amount + Payment Mode + Transaction Ref */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-base sm:text-lg text-emerald-600 font-mono tracking-tight">
                        + {inr(p.amount)}
                      </span>
                      <Badge variant="info" size="sm" className="font-semibold">{p.paymentMode}</Badge>
                    </div>
                    {p.transactionReference && (
                      <p className="text-xs text-slate-600 font-medium">
                        Ref: <span className="font-mono font-bold text-slate-900">{p.transactionReference}</span>
                      </p>
                    )}
                  </div>

                  {/* Right Column: Date + Notes */}
                  <div className="shrink-0 text-right space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 shadow-2xs">
                      <Calendar size={14} className="text-blue-600" />
                      <span>{fmt(p.paymentDate)}</span>
                    </div>
                    {p.notes && (
                      <p className="text-xs text-slate-600 italic font-medium truncate max-w-[180px] sm:max-w-[220px]">
                        "{p.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-800 font-medium">
            Total Paid: <strong className="text-emerald-800 font-black text-base">{inr(totalPaid)}</strong> ({payments.length} payment{payments.length !== 1 ? 's' : ''})
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="font-bold">Close</Button>
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
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* ── TOP BREADCRUMB & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => navigate(ROUTES.CUSTOMERS)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition shadow-xs shrink-0"
            title="Back to Customers"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{displayName}</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Customer Account & Payment Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button variant="ghost" size="sm" icon={<RefreshCw size={15} className="text-slate-700" />} onClick={fetchProfile} className="text-slate-700 font-semibold border border-slate-200 bg-white hover:bg-slate-100">
            Refresh
          </Button>
          <Button variant="outline" size="sm" icon={<Pencil size={15} className="text-slate-700" />} onClick={() => setEditOpen(true)} className="text-slate-800 font-semibold border-slate-200 bg-white hover:bg-slate-50 shadow-xs">
            Edit Details
          </Button>
        </div>
      </div>

      {/* ── 1. CUSTOMER PROFILE DETAILS (TOP CARD) ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-4 sm:p-6 w-full max-w-full min-w-0">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-5 sm:gap-6 min-w-0">
          {/* Main Info */}
          <div className="space-y-3 min-w-0 flex-1 w-full">
            {/* Top row: Avatar + Customer Name + Status badges */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-bold text-white shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #2563EB, #0284C7)' }}
              >
                {profile.name?.charAt(0)?.toUpperCase() ?? 'C'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate tracking-tight">{profile.name}</h2>
                  <Badge variant={statusVariant(profile.customerStatus)} dot size="sm" className="font-semibold uppercase text-[11px] sm:text-xs">
                    {profile.customerStatus || 'ACTIVE'}
                  </Badge>
                  {profile.isRegular && (
                    <Badge variant="warning" size="sm" className="font-semibold text-[11px] sm:text-xs">⭐ Regular</Badge>
                  )}
                </div>

                {/* Firm Name */}
                {profile.firmName && (
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 text-sm font-semibold text-slate-800 bg-slate-100/90 px-2.5 sm:px-3 py-1 rounded-lg border border-slate-200 mt-1 max-w-full">
                    <Building2 size={15} className="text-slate-600 shrink-0" />
                    <span className="truncate">{profile.firmName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact info list - balanced, clean, legible weights */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 max-w-full">
              {/* Primary Mobile */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs max-w-full">
                <Phone size={14} className="text-slate-500 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold uppercase text-slate-500 shrink-0">Mob:</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {profile.mobile ? `+91 ${profile.mobile}` : '-'}
                </span>
              </div>

              {/* Alternate Mobile */}
              {profile.alternateMobile && (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs max-w-full">
                  <Phone size={14} className="text-slate-500 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold uppercase text-slate-500 shrink-0">Alt:</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                    +91 {profile.alternateMobile}
                  </span>
                </div>
              )}

              {/* Date Joined */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs max-w-full">
                <Calendar size={14} className="text-slate-500 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold uppercase text-slate-500 shrink-0">Joined:</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                  {fmt(profile.dateJoined)}
                </span>
              </div>
            </div>
          </div>

          {/* Address & Remarks side box */}
          <div className="w-full lg:w-[380px] xl:w-[420px] rounded-xl bg-slate-50/80 p-3.5 sm:p-4 border border-slate-200 space-y-2.5 min-w-0 max-w-full shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-600 shrink-0" /> Customer Address
              </p>
              <p className="text-slate-800 leading-relaxed font-semibold text-xs sm:text-sm break-words">
                {profile.address || <span className="text-slate-400 font-normal italic">No address recorded</span>}
              </p>
            </div>

            {profile.remarks && (
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-0.5">Remarks / Notes</p>
                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-xs sm:text-sm break-words">{profile.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. SUMMARY METRICS (CUSTOMER-WISE STATS) ── */}
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        {/* Total Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Revenue</p>
          <p className="text-xl min-[380px]:text-2xl font-bold text-blue-600 mt-1 tracking-tight truncate">{inr(profile.totalBusinessValue)}</p>
        </div>

        {/* Total Paid */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Paid</p>
          <p className="text-xl min-[380px]:text-2xl font-bold text-emerald-600 mt-1 tracking-tight truncate">{inr(profile.totalPaidAmount)}</p>
        </div>

        {/* Pending Amount */}
        <div className={`rounded-xl p-4 sm:p-5 shadow-xs min-w-0 transition ${
          Number(profile.outstandingDues) > 0
            ? 'border border-rose-300 bg-rose-50/70'
            : 'border border-slate-200 bg-white'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${
            Number(profile.outstandingDues) > 0 ? 'text-rose-700' : 'text-slate-600'
          }`}>
            Pending Amount
          </p>
          <p className={`text-xl min-[380px]:text-2xl font-bold mt-1 tracking-tight truncate ${
            Number(profile.outstandingDues) > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {inr(profile.outstandingDues)}
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Orders</p>
          <p className="text-xl min-[380px]:text-2xl font-bold text-slate-800 mt-1 tracking-tight truncate">{profile.totalOrders ?? 0}</p>
        </div>
      </div>

      {/* ── 3. EXPANDED ORDERS & PAYMENT TRACKING TABLE ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden w-full max-w-full min-w-0">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart size={19} className="text-blue-600" />
              Customer Orders & Payment Ledger
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Complete history of generator bookings, partial payments, and balances.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto shadow-2xs">
            {orders.length} Order{orders.length !== 1 ? 's' : ''} Found
          </span>
        </div>

        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[960px] sm:min-w-[1040px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th className="px-3.5 py-3 text-center w-14">Sr. No.</th>
                <th className="px-4 py-3">Order No.</th>
                <th className="px-4 py-3">Bill No.</th>
                <th className="px-4 py-3">Function Date</th>
                <th className="px-4 py-3 text-center">Billing Status</th>
                <th className="px-4 py-3 text-right">Total Bill</th>
                <th className="px-4 py-3 text-right">Paid Amount</th>
                <th className="px-4 py-3 text-right">Pending Amount</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-4 py-3 text-center">Paid Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-500">
                    <ShoppingCart size={32} className="mx-auto mb-2 text-slate-400 opacity-60" />
                    <p className="font-semibold text-sm text-slate-600">No orders recorded yet for this customer.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord, idx) => {
                  const billAmt     = Number(ord.finalAmount) || 0;
                  const paidAmt     = Number(ord.paidAmount) || 0;
                  const pendingAmt  = Math.max(0, billAmt - paidAmt);
                  const isFullyPaid = ord.paymentStatus === 'PAID' || pendingAmt === 0;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      {/* Sr. No. */}
                      <td className="px-3.5 py-3.5 text-center text-xs font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Order No. */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap">
                          {ord.orderNumber}
                        </div>
                      </td>

                      {/* Bill No. */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {ord.billNumber ? (
                          <div className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                            #{ord.billNumber}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic font-medium">No Bill #</div>
                        )}
                      </td>

                      {/* Function Date */}
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-800 whitespace-nowrap">
                        {ord.functionDate || fmt(ord.deliveryDate)}
                      </td>

                      {/* Billing Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={billingStatusVariant(ord.billingStatus)} size="sm" className="font-medium">
                          {ord.billingStatus || 'PENDING'}
                        </Badge>
                      </td>

                      {/* Total Bill */}
                      <td className="px-4 py-3.5 text-right font-bold text-sm sm:text-base text-slate-900">
                        {inr(billAmt)}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-3.5 text-right font-bold text-sm sm:text-base text-emerald-600">
                        {inr(paidAmt)}
                      </td>

                      {/* Pending Amount */}
                      <td className="px-4 py-3.5 text-right font-bold text-sm sm:text-base">
                        <span className={pendingAmt > 0 ? 'text-rose-600' : 'text-slate-400 font-normal'}>
                          {inr(pendingAmt)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={paymentStatusVariant(ord.paymentStatus)} dot size="sm" className="font-medium">
                          {paymentStatusLabel(ord.paymentStatus)}
                        </Badge>
                      </td>

                      {/* Payment Completion Date */}
                      <td className="px-4 py-3.5 text-center text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                        {ord.paymentCompletionDate ? fmt(ord.paymentCompletionDate) : (
                          isFullyPaid ? fmt(ord.createdAt) : <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Payment Button */}
                          {!isFullyPaid && (
                            <button
                              onClick={() => {
                                if (ord.billingStatus !== 'COMPLETED') return;
                                setPaymentTarget(ord);
                              }}
                              disabled={ord.billingStatus !== 'COMPLETED'}
                              title={ord.billingStatus !== 'COMPLETED' ? "Billing must be completed before recording payment" : "Record Partial or Full Payment"}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs inline-flex items-center gap-1 ${
                                ord.billingStatus === 'COMPLETED'
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none"
                              }`}
                            >
                              <Plus size={14} /> Pay
                            </button>
                          )}

                          {/* Payment History button */}
                          <button
                            onClick={() => setHistoryTarget(ord)}
                            title="View Payment History"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
                          >
                            <History size={15} />
                          </button>

                          {/* View Order / Billing button */}
                          <button
                            onClick={() => navigate(`/generators/orders/${ord.id}/billing`)}
                            title="View Full Order Billing"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition shadow-2xs"
                          >
                            <Eye size={15} />
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
