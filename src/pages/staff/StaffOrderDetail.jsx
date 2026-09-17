// src/pages/staff/StaffOrderDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import {
  getStaffOrdersList,
  saveStaffOrderTimes,
  calculateDuration,
  getDatesFromFunctionDate,
  STATUS_CONFIG,
  DIESEL_TYPES,
} from '@/pages/generators/orders/mockData';
import {
  ArrowLeft,
  User,
  Zap,
  MapPin,
  Clock,
  Calendar,
  Phone,
  MessageSquare,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  Fuel,
  Lock,
  Info,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export default function StaffOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Load order data
  const [order, setOrder] = useState(null);
  const [generators, setGenerators] = useState([]);

  useEffect(() => {
    const list = getStaffOrdersList(user);
    const found = list.find(o => o.id === id);
    if (found) {
      setOrder(found);
      const dates = getDatesFromFunctionDate(found.functionDate);

      // Ensure generators have dieselSlots
      const gens = (found.generators || []).map((g, gIdx) => {
        let slots = g.dieselSlots && g.dieselSlots.length > 0 ? [...g.dieselSlots] : [];
        if (slots.length === 0 && found.dieselType === DIESEL_TYPES.WITH_OWNER) {
          slots = [
            {
              id: `slot-${found.id}-${gIdx}-${Date.now()}-0`,
              date: dates[0],
              startTime: g.dieselStartTime || '09:00',
              endTime: g.dieselEndTime || '17:00',
              duration: g.dieselDuration || '08:00',
            },
          ];
        }
        return { ...g, dieselSlots: slots };
      });

      setGenerators(gens);
    }
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [id, user]);

  // Add another time slot for a date
  const handleAddSlotForDate = (genIdx, date) => {
    setGenerators(prev => {
      const copy = [...prev];
      const gen = { ...copy[genIdx] };
      const currentSlots = [...(gen.dieselSlots || [])];

      const newSlot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date,
        startTime: '18:00',
        endTime: '22:00',
        duration: '04:00',
      };

      const lastIdx = currentSlots.reduce((acc, s, i) => (s.date === date ? i : acc), -1);
      if (lastIdx === -1) {
        currentSlots.push(newSlot);
      } else {
        currentSlots.splice(lastIdx + 1, 0, newSlot);
      }

      gen.dieselSlots = currentSlots;
      copy[genIdx] = gen;
      return copy;
    });
  };

  // Remove a slot
  const handleRemoveSlot = (genIdx, slotId) => {
    setGenerators(prev => {
      const copy = [...prev];
      const gen = { ...copy[genIdx] };
      gen.dieselSlots = (gen.dieselSlots || []).filter(s => s.id !== slotId);
      copy[genIdx] = gen;
      return copy;
    });
  };

  // Change slot time
  const handleSlotChange = (genIdx, slotId, field, val) => {
    setGenerators(prev => {
      const copy = [...prev];
      const gen = { ...copy[genIdx] };
      gen.dieselSlots = (gen.dieselSlots || []).map(s => {
        if (s.id !== slotId) return s;
        const updated = { ...s, [field]: val };
        if (field === 'startTime' || field === 'endTime') {
          updated.duration = calculateDuration(updated.startTime, updated.endTime);
        }
        return updated;
      });
      copy[genIdx] = gen;
      return copy;
    });
  };

  // Save changes
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const preparedGens = generators.map(g => {
        const firstSlot = (g.dieselSlots || [])[0];
        return {
          ...g,
          dieselStartTime: firstSlot?.startTime || '',
          dieselEndTime: firstSlot?.endTime || '',
          dieselDuration: firstSlot?.duration || '',
        };
      });

      const updated = saveStaffOrderTimes(id, preparedGens);
      if (updated) {
        setOrder(updated);
      }
      setSaving(false);
      showToast('Diesel operating time slots saved successfully!');
    }, 350);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const isWithOwner = order?.dieselType === DIESEL_TYPES.WITH_OWNER;
  const statusCfg = STATUS_CONFIG?.[order?.status] || {
    label: order?.status || '—',
    bg: '#F1F5F9',
    color: '#475569',
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="text-xs text-slate-500 font-medium">Loading order details…</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen p-8" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-800">Order Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            Order #{id} was not found in your assigned bookings.
          </p>
          <button
            onClick={() => navigate(ROUTES.STAFF_ORDERS)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Assigned Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-medium animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(ROUTES.STAFF_ORDERS)}
                className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                title="Back to Assigned Orders"
              >
                <ArrowLeft size={16} />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {order.id}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.color }} />
                    {statusCfg.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isWithOwner
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <Fuel size={11} />
                    {isWithOwner ? 'With Diesel' : 'Party Diesel'}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {order.clientName}
                </h1>
              </div>
            </div>

            {/* Staff Permissions Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Shield size={14} />
                <span>Staff: Time Logging Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Form Container ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ── SECTION 1: CLIENT & SITE DETAILS (VIEW ONLY) ─────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <User size={15} className="text-blue-600" />
              <span>Client & Site Information</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
              <Lock size={11} /> View Only
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Client Name
              </label>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                {order.clientName || '—'}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Contact Number
              </label>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium flex items-center gap-2">
                <Phone size={13} className="text-slate-400" />
                <span>{order.contactNumber || '—'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Function Date
              </label>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium flex items-center gap-2">
                <Calendar size={13} className="text-slate-400" />
                <span>{order.functionDate || '—'}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Site Address
              </label>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span>{order.siteAddress || '—'}</span>
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Assigned Operator
              </label>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium flex items-center gap-2">
                <User size={13} className="text-slate-400 shrink-0" />
                <span>{order.operatorName || 'Suresh Kumar'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: DIESEL TIME SLOTS (ONLY WHEN WITH DIESEL) ───────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Fuel size={15} className="text-amber-600" />
              <span>Diesel Operating Time Slots</span>
            </div>
            {isWithOwner ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                ✏️ Multiple Time Slots Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Party Diesel (Not Required)
              </span>
            )}
          </div>

          <div className="p-5">
            {!isWithOwner ? (
              /* Party Diesel Notice */
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <Fuel size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Party Diesel Booking</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  This order is booked under <strong>Party Diesel</strong> terms. Fuel is arranged directly by the client. Operating hours are only tracked when booked With Diesel.
                </p>
              </div>
            ) : (
              /* With Diesel Time Slots with + Add Slot for Date */
              <div className="space-y-5">
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                  <Info size={15} className="text-blue-600 shrink-0" />
                  <span>
                    Log diesel running hours for each generator. Click <strong>+ Add Time Slot</strong> to add another time slot for the same date.
                  </span>
                </div>

                {generators.map((gen, gIdx) => {
                  const orderDates = getDatesFromFunctionDate(order.functionDate);
                  const slots = gen.dieselSlots || [];

                  return (
                    <div
                      key={gen._id || gIdx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4"
                    >
                      {/* Generator Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                            #{gIdx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-slate-900">
                              {gen.generatorName || 'Generator Set'}
                            </span>
                            <span className="text-xs text-slate-400 font-mono ml-2">
                              ({gen.generatorId})
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          {slots.length} Slot{slots.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Dates with Multi-Slots */}
                      <div className="space-y-4">
                        {orderDates.map(dateStr => {
                          const dateSlots = slots.filter(s => s.date === dateStr);

                          return (
                            <div
                              key={dateStr}
                              className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <Calendar size={13} className="text-blue-600" />
                                  <span>Date: {dateStr}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddSlotForDate(gIdx, dateStr)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Plus size={11} />
                                  <span>Add Time Slot</span>
                                </button>
                              </div>

                              {dateSlots.length === 0 ? (
                                <div className="py-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                  No slots logged for this date. Click &ldquo;Add Time Slot&rdquo; above.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {dateSlots.map((slot, sIdx) => (
                                    <div
                                      key={slot.id}
                                      className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[45px]">
                                          Slot #{sIdx + 1}
                                        </span>

                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-500 font-medium">Start:</span>
                                          <input
                                            type="time"
                                            value={slot.startTime || '09:00'}
                                            onChange={e => handleSlotChange(gIdx, slot.id, 'startTime', e.target.value)}
                                            className="px-2 py-1 text-xs rounded border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                          />
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-500 font-medium">End:</span>
                                          <input
                                            type="time"
                                            value={slot.endTime || '17:00'}
                                            onChange={e => handleSlotChange(gIdx, slot.id, 'endTime', e.target.value)}
                                            className="px-2 py-1 text-xs rounded border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                                        <div className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                                          {slot.duration || calculateDuration(slot.startTime, slot.endTime)} hrs
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSlot(gIdx, slot.id)}
                                          className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                          title="Remove this slot"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM ACTION BAR ─────────────────────────────────────────── */}
        {isWithOwner && (
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Info size={14} className="text-blue-500 shrink-0" />
              <span>Verify all added time slots before clicking Save.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate(ROUTES.STAFF_ORDERS)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Back to Orders
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                <Save size={14} />
                <span>{saving ? 'Saving…' : 'Save Time Slots'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
