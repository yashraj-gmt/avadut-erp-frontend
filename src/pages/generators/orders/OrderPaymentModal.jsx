// src/pages/generators/orders/OrderPaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, History, CreditCard, CheckCircle2, IndianRupee, Wallet, AlertCircle, Loader2, Calendar
} from 'lucide-react';
import { generatorOrderService } from '@/services/generatorOrderService';
import { ROUTES } from '@/constants/routes';
import Badge from '@/components/shared/Badge';
import Button from '@/components/shared/Button';
import { useToast } from '@/components/shared/toast/ToastProvider';

import { formatToDMY } from '@/utils/helpers';

const inr = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
const fmt = (d) => formatToDMY(d);

export default function OrderPaymentModal({ order, onClose, onSuccess }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab]         = useState('record');
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount]               = useState('');
  const [paymentMode, setPaymentMode]     = useState('CASH');
  const [paymentDate, setPaymentDate]     = useState(() => today);
  const [reference, setReference]         = useState('');
  const [notes, setNotes]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [successMsg, setSuccessMsg]       = useState('');

  // Payment history state
  const [historyList, setHistoryList]     = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Live order snapshot (updates when payment is recorded)
  const [currentOrder, setCurrentOrder]   = useState(order);

  const totalAmount    = Number(currentOrder.finalAmount) || Number(currentOrder.subtotal) || 0;
  const currentPaid    = Number(currentOrder.paidAmount) || 0;
  const currentPending = Math.max(0, totalAmount - currentPaid);

  const enteredAmt = Number(amount) || 0;
  const projectedRemaining = Math.max(0, currentPending - enteredAmt);

  // Load payment history
  const loadPayments = async () => {
    if (!order?.id) return;
    setLoadingHistory(true);
    try {
      const res = await generatorOrderService.getPayments(order.id);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setHistoryList(list);
    } catch (err) {
      console.warn('Failed to load payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // If order is already fully paid, default to history tab
    if (currentPending <= 0) {
      setActiveTab('history');
    }
  }, [order?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentOrder.billingStatus !== 'COMPLETED') {
      setError('Payment can only be recorded after billing status is completed.');
      return;
    }
    if (!enteredAmt || enteredAmt <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (enteredAmt > currentPending + 0.01) {
      setError(`Payment amount cannot exceed the pending balance (${inr(currentPending)}).`);
      return;
    }
    if (paymentDate > today) {
      setError('Payment date cannot be in the future. Please select today or a previous date.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await generatorOrderService.recordPayment(order.id, {
        amount: enteredAmt,
        paymentMode,
        paymentDate,
        transactionReference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Fetch fresh order details from server
      let updatedOrder = null;
      try {
        const orderRes = await generatorOrderService.getById(order.id);
        updatedOrder = orderRes?.data || orderRes;
        if (updatedOrder) {
          setCurrentOrder(updatedOrder);
        }
      } catch (err) {
        console.warn('Could not re-fetch order details:', err);
      }

      // Reload payment history
      await loadPayments();

      setSuccessMsg(`Recorded payment of ${inr(enteredAmt)} successfully!`);
      toast({
        type: 'success',
        title: 'Payment Recorded!',
        message: `Payment of ${inr(enteredAmt)} recorded successfully for Order ${order?.orderNumber || `#${order?.id}`}.`,
      });
      setAmount('');
      setReference('');
      setNotes('');

      if (onSuccess) {
        onSuccess(updatedOrder || {
          ...order,
          paidAmount: currentPaid + enteredAmt,
          pendingAmount: Math.max(0, currentPending - enteredAmt),
          paymentStatus: (currentPending - enteredAmt) <= 0 ? 'PAID' : 'PARTIAL_PAID',
        });
      }

      // Switch to history tab after brief delay to show the recorded payment
      setTimeout(() => {
        setActiveTab('history');
      }, 700);

    } catch (err) {
      const errMsg = err?.data?.message ?? err?.message ?? 'Failed to record payment. Please try again.';
      setError(errMsg);
      toast({
        type: 'error',
        title: 'Payment Failed',
        message: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shadow-sm">
              ₹
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">
                Record Payment
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">
                Order #{order.orderNumber || order.id} • <span className="text-[var(--color-text)] font-sans font-medium">{order.clientName || 'Client'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Balance Overview (Cards) */}
        <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">Total Bill</p>
            <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] mt-0.5">{inr(totalAmount)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Paid</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{inr(currentPaid)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">Pending</p>
            <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{inr(currentPending)}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4">
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`py-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 -mb-px ${
              activeTab === 'record'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <CreditCard size={14} />
            Record Payment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 -mb-px ${
              activeTab === 'history'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <History size={14} />
            Payment History
            {historyList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--color-primary-50,#eff6ff)] text-[var(--color-primary,#2563eb)]">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Record Payment Form */}
        {activeTab === 'record' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {currentOrder.billingStatus !== 'COMPLETED' ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={24} />
                </div>
                <h4 className="font-bold text-sm text-[var(--color-text)]">Billing Not Completed</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs mx-auto">
                  Payments can only be recorded after the order's billing status has been marked as <strong>Completed</strong>.
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', order.id));
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
                  >
                    Complete Billing Now
                  </button>
                </div>
              </div>
            ) : currentPending <= 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-bold text-sm text-[var(--color-text)]">Order Paid in Full</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs mx-auto">
                  There is no outstanding balance for this order. All payments have been settled.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="mt-4 px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] inline-flex items-center gap-1.5"
                >
                  <History size={13} /> View Payment History
                </button>
              </div>
            ) : (
              <>
                {/* Amount Paid */}
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
                      Pay Full Balance ({inr(currentPending)})
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
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 flex items-center justify-between">
                      <span>Remaining Balance after payment:</span>
                      <span className={`font-bold ${projectedRemaining === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {inr(projectedRemaining)} {projectedRemaining === 0 ? '(Fully Paid ✓)' : '(Partial)'}
                      </span>
                    </p>
                  )}
                </div>

                {/* Mode & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <option value="BANK_TRANSFER">Bank Transfer (RTGS/NEFT/IMPS)</option>
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
                      max={today}
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">
                    Transaction / Cheque Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref #, Cheque #, RTGS/NEFT UTR"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    maxLength={100}
                  />
                </div>

                {/* Notes */}
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
                <div className="flex gap-2.5 pt-2 justify-end border-t border-[var(--color-border)]">
                  <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" loading={loading} icon={<CheckCircle2 size={16} />}>
                    Save Payment
                  </Button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Tab 2: Payment History */}
        {activeTab === 'history' && (
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {loadingHistory ? (
              <div className="py-12 text-center text-[var(--color-text-muted)] flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
                <span className="text-xs">Loading payment history...</span>
              </div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-10 text-[var(--color-text-subtle)] text-sm">
                <CreditCard size={36} className="mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-[var(--color-text-muted)]">No recorded payments yet</p>
                <p className="text-xs text-[var(--color-text-subtle)] mt-0.5">
                  Payments recorded for this order will appear here.
                </p>
                {currentPending > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('record')}
                    className="mt-3 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    + Record First Payment
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3 shadow-xs hover:border-[var(--color-primary-300,#93c5fd)] transition"
                  >
                    {/* Left Column: Amount + Payment Mode + Transaction Ref */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-base text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                          + {inr(p.amount)}
                        </span>
                        <Badge variant="info" size="sm">{p.paymentMode}</Badge>
                      </div>
                      {p.transactionReference && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          Ref: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{p.transactionReference}</span>
                        </p>
                      )}
                    </div>

                    {/* Right Column: Date + Notes */}
                    <div className="shrink-0 text-right space-y-1">
                      <div
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md"
                        style={{
                          background: '#F1F5F9',
                          color: '#0F172A',
                          border: '1px solid #CBD5E1',
                        }}
                      >
                        <Calendar size={13} style={{ color: '#2563EB' }} />
                        <span style={{ color: '#0F172A', fontWeight: 700 }}>
                          {fmt(p.paymentDate)}
                        </span>
                      </div>
                      {p.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic font-medium truncate max-w-[180px] sm:max-w-[220px]">
                          "{p.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-[var(--color-border)]">
              {currentPending > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('record')}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <CreditCard size={14} /> Record Another Payment
                </button>
              ) : (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Fully Paid
                </span>
              )}
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
