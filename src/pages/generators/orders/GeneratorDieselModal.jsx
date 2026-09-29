// src/pages/generators/orders/GeneratorDieselModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { generatorOrderService } from '@/services/generatorOrderService';
import {
  calcDuration,
  formatDurationDisplay,
  formatToDMY,
  formatRangeToDMY,
  parseDateStr,
} from './mockData';
import { X, Fuel, AlertCircle, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';

/** Helper: "HH:MM" duration string -> decimal hours */
const parseDurationToHours = (durStr) => {
  if (!durStr) return 0;
  const [h, m] = durStr.split(':').map(Number);
  return (h || 0) + ((m || 0) / 60);
};

const parseRentalDays = (functionDate) => {
  if (!functionDate) return 1;
  const parts = functionDate.split(' to ');
  if (parts.length !== 2) return 1;
  try {
    const from = parseDateStr(parts[0].trim());
    const to   = parseDateStr(parts[1].trim());
    if (!from || !to) return 1;
    const diffMs = to - from;
    if (diffMs < 0) return 1;
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
  } catch { return 1; }
};

export default function GeneratorDieselModal({ isOpen, onClose, order, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullOrder, setFullOrder] = useState(null);
  const [dieselEntries, setDieselEntries] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load order data whenever modal opens
  useEffect(() => {
    if (!isOpen || !order?.id) {
      setFullOrder(null);
      setDieselEntries({});
      setErrorMsg('');
      setSuccessMsg('');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    generatorOrderService.getById(order.id)
      .then(foundOrder => {
        setFullOrder(foundOrder);

        // Compute dates from functionDate / functionDateFrom-To
        const dates = [];
        if (foundOrder.functionDateFrom && foundOrder.functionDateTo) {
          let curr = new Date(foundOrder.functionDateFrom);
          const end = new Date(foundOrder.functionDateTo);
          while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
          }
        } else if (foundOrder.functionDate && foundOrder.functionDate.includes(' to ')) {
          const parts = foundOrder.functionDate.split(' to ');
          const fromD = parseDateStr(parts[0].trim());
          const toD = parseDateStr(parts[1].trim());
          if (fromD && toD) {
            let curr = new Date(fromD);
            while (curr <= toD) {
              dates.push(curr.toISOString().split('T')[0]);
              curr.setDate(curr.getDate() + 1);
            }
          }
        }
        if (dates.length === 0) {
          dates.push(new Date().toISOString().split('T')[0]);
        }

        const entriesMap = {};
        (foundOrder.generators || []).forEach(g => {
          const gId = g.id || g._id;
          if (g.dieselEntries && g.dieselEntries.length > 0) {
            entriesMap[gId] = g.dieselEntries.map(e => ({
              date: e.entryDate || e.date,
              startTime: e.startTime || '00:00',
              endTime: e.endTime || '00:00',
              duration: e.duration != null ? e.duration : parseDurationToHours(calcDuration(e.startTime, e.endTime))
            }));
          } else {
            entriesMap[gId] = dates.map(d => ({
              date: d,
              startTime: '00:00',
              endTime: '00:00',
              duration: 0
            }));
          }
        });

        setDieselEntries(entriesMap);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load order for diesel log', err);
        setErrorMsg('Failed to load order details. Please try again.');
        setLoading(false);
      });
  }, [isOpen, order?.id]);

  // Handle start/end time change
  const handleDieselEntryChange = (gId, idx, field, val) => {
    setDieselEntries(prev => {
      const next = { ...prev };
      if (!next[gId]) return prev;
      const arr = [...next[gId]];
      arr[idx] = { ...arr[idx], [field]: val };
      arr[idx].duration = parseDurationToHours(calcDuration(arr[idx].startTime, arr[idx].endTime));
      next[gId] = arr;
      return next;
    });
  };

  // Add time slot for specific date
  const handleAddSlotForDate = (gId, date) => {
    setDieselEntries(prev => {
      const arr = [...(prev[gId] || [])];
      const lastIdx = arr.reduce((acc, e, i) => (e.date === date ? i : acc), -1);
      const newSlot = { date, startTime: '00:00', endTime: '00:00', duration: 0 };
      if (lastIdx === -1) {
        arr.push(newSlot);
      } else {
        arr.splice(lastIdx + 1, 0, newSlot);
      }
      return { ...prev, [gId]: arr };
    });
  };

  // Remove time slot
  const handleRemoveSlot = (gId, idx) => {
    setDieselEntries(prev => {
      const arr = [...(prev[gId] || [])];
      arr.splice(idx, 1);
      return { ...prev, [gId]: arr };
    });
  };

  // Conflict detection for overlapping time slots on same date
  const dieselConflicts = useMemo(() => {
    const toMin = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const result = {};
    Object.entries(dieselEntries).forEach(([gId, entries]) => {
      const byDate = {};
      entries.forEach((e, i) => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(i);
      });
      const gConflicts = {};
      Object.values(byDate).forEach(idxGroup => {
        if (idxGroup.length < 2) return;
        for (let a = 0; a < idxGroup.length; a++) {
          for (let b = a + 1; b < idxGroup.length; b++) {
            const slotA = entries[idxGroup[a]];
            const slotB = entries[idxGroup[b]];
            const aS = toMin(slotA.startTime), aE = toMin(slotA.endTime);
            const bS = toMin(slotB.startTime), bE = toMin(slotB.endTime);
            if (aS < bE && bS < aE) {
              const msg = (aS === bS && aE === bE)
                ? 'Identical time as another slot'
                : 'Overlaps with another slot';
              gConflicts[idxGroup[a]] = msg;
              gConflicts[idxGroup[b]] = msg;
            }
          }
        }
      });
      result[gId] = gConflicts;
    });
    return result;
  }, [dieselEntries]);

  const hasConflicts = useMemo(() => {
    return Object.values(dieselConflicts).some(cg => Object.keys(cg).length > 0);
  }, [dieselConflicts]);

  // Total diesel hours across all generators
  const totalAllDieselHours = useMemo(() => {
    let sum = 0;
    Object.values(dieselEntries).forEach(entries => {
      (entries || []).forEach(e => {
        sum += (parseFloat(e.duration) || 0);
      });
    });
    return sum;
  }, [dieselEntries]);

  const rentalDays = useMemo(() => {
    return parseRentalDays(fullOrder?.functionDate || (fullOrder?.functionDateFrom && fullOrder?.functionDateTo ? `${fullOrder.functionDateFrom} to ${fullOrder.functionDateTo}` : fullOrder?.functionDateFrom));
  }, [fullOrder]);

  // Save changes
  const handleSave = () => {
    if (hasConflicts) {
      setErrorMsg('Please resolve overlapping time slots before saving.');
      return;
    }
    if (!fullOrder) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const req = {
      discountAmount: fullOrder.discountAmount || 0,
      paymentDueDate: fullOrder.paymentDueDate || null,
      generators: (fullOrder.generators || []).map(g => {
        const gKey = g.id || g._id;
        return {
          orderItemId: g.id,
          rentPerDay: g.rate != null ? g.rate : 0,
          dieselPerHour: g.dieselRate != null ? g.dieselRate : 0,
          cableRate: g.cableRate != null ? g.cableRate : 0,
          dieselEntries: (dieselEntries[gKey] || []).map(e => {
            const parsed = parseDateStr(e.date);
            const ymd = parsed ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` : e.date;
            return {
              entryDate: ymd,
              startTime: e.startTime,
              endTime: e.endTime,
              duration: e.duration
            };
          })
        };
      }),
      otherCharges: (fullOrder.otherCharges || []).map(oc => ({
        name: oc.name || 'Other Charge',
        amount: parseFloat(oc.amount) || 0
      }))
    };

    generatorOrderService.updateBilling(fullOrder.id, req)
      .then((updatedOrder) => {
        setSuccessMsg('Diesel timings updated successfully!');
        if (onSuccess) onSuccess(updatedOrder);
        setTimeout(() => {
          onClose();
        }, 800);
      })
      .catch(err => {
        console.error('Failed to save diesel timings', err);
        setErrorMsg(err?.response?.data?.message || 'Failed to save diesel timings. Please try again.');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <style>{`
        @keyframes gdm-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gdm-scaleup { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .gdm-inp-time {
          padding: 6px 8px; border: 1.5px solid #cbd5e1; border-radius: 6px;
          font-family: inherit; font-size: 13px; outline: none; transition: all 0.2s;
          background: #fff; color: #1e293b; width: 105px; font-weight: 600;
        }
        .gdm-inp-time:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
        .gdm-slot-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid;
          cursor: pointer; font-size: 15px; line-height: 1; font-weight: 700;
          transition: all 0.15s; padding: 0; font-family: inherit; flex-shrink: 0;
        }
        .gdm-slot-btn-add { color: #16a34a; border-color: #86efac; background: #f0fdf4; }
        .gdm-slot-btn-add:hover { background: #dcfce7; border-color: #16a34a; transform: scale(1.1); }
        .gdm-slot-btn-remove { color: #dc2626; border-color: #fca5a5; background: #fff5f5; }
        .gdm-slot-btn-remove:hover { background: #fee2e2; border-color: #dc2626; transform: scale(1.1); }
      `}</style>

      <div
        className="w-full max-w-4xl max-h-[94vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        style={{ animation: 'gdm-scaleup 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-start justify-between gap-2.5 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <Fuel size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Diesel Running Hours Log
              </h2>
              <div className="text-[11px] sm:text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>Order: <strong className="text-slate-800">{order?.orderNumber || `#${order?.id}`}</strong></span>
                <span>•</span>
                <span className="truncate max-w-[140px] sm:max-w-none">Client: <strong className="text-slate-800">{order?.clientName || '—'}</strong></span>
                {order?.functionDate && (
                  <>
                    <span>•</span>
                    <span className="truncate">Date: <strong className="text-slate-800">{formatRangeToDMY(order.functionDate)}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1 sm:p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="inline-block w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="mt-3 text-xs sm:text-sm font-semibold">Loading diesel timings...</div>
            </div>
          ) : errorMsg && !fullOrder ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <>
              {/* Instructions banner */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-start gap-2">
                <Clock size={15} className="shrink-0 mt-0.5" />
                <span>
                  Specify start and end times for each day. Use the green <strong>(+)</strong> button to add multiple generator operating slots for any date.
                </span>
              </div>

              {errorMsg && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Table of Diesel Running Hours with horizontal scroll */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                {/* Mobile scroll hint */}
                <div className="md:hidden px-3 py-1.5 text-[11px] font-medium text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center gap-1 select-none">
                  <span>👉 Scroll table horizontally to edit times & add slots</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs sm:text-sm text-left min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-2.5 w-10 text-center whitespace-nowrap">#</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Description</th>
                        <th className="py-2.5 px-3 text-center w-14 whitespace-nowrap">Days</th>
                        <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Date</th>
                        <th className="py-2.5 px-3 text-center w-32 whitespace-nowrap">Start Time</th>
                        <th className="py-2.5 px-3 text-center w-32 whitespace-nowrap">End Time</th>
                        <th className="py-2.5 px-3 text-center w-32 whitespace-nowrap">Diesel Hrs</th>
                        <th className="py-2.5 px-3 text-center w-16 whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                  <tbody>
                    {(fullOrder?.generators || []).map((g, gIdx) => {
                      const gKey = g.id || g._id;
                      const entries = dieselEntries[gKey] || [];
                      const conflicts = dieselConflicts[gKey] || {};

                      // Date grouping
                      const dateGroupMap = {};
                      entries.forEach((e, i) => {
                        if (!dateGroupMap[e.date]) dateGroupMap[e.date] = [];
                        dateGroupMap[e.date].push(i);
                      });

                      let genTotalHours = 0;
                      entries.forEach(e => { genTotalHours += (parseFloat(e.duration) || 0); });

                      return (
                        <React.Fragment key={gKey}>
                          {entries.map((de, dIdx) => {
                            const slotsForDate = dateGroupMap[de.date] || [];
                            const isFirstForDate = slotsForDate.length === 0 || slotsForDate[0] === dIdx;
                            const slotCount = slotsForDate.length;
                            const hasConflict = !!conflicts[dIdx];

                            return (
                              <tr
                                key={`row-${gKey}-${dIdx}`}
                                style={{
                                  background: dIdx % 2 === 0 ? '#ffffff' : '#fcfcfc',
                                  borderBottom: '1px solid #f1f5f9'
                                }}
                              >
                                {/* Sr. No */}
                                {dIdx === 0 && (
                                  <td
                                    rowSpan={entries.length}
                                    style={{
                                      padding: '12px 8px', textAlign: 'center',
                                      fontWeight: 700, color: '#64748b', verticalAlign: 'top',
                                      borderRight: '1px solid #f1f5f9', background: '#fafafa'
                                    }}
                                  >
                                    {gIdx + 1}
                                  </td>
                                )}

                                {/* Description */}
                                {dIdx === 0 && (
                                  <td
                                    rowSpan={entries.length}
                                    style={{
                                      padding: '12px 14px', verticalAlign: 'top',
                                      borderRight: '1px solid #f1f5f9', background: '#fafafa'
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13.5px' }}>
                                      {g.generatorName || 'Generator'}
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', marginTop: '4px' }}>
                                      ⛽ Diesel
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
                                      Total: {formatDurationDisplay(genTotalHours)}
                                    </div>
                                  </td>
                                )}

                                {/* Days */}
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#92400e', fontWeight: 600 }}>
                                  —
                                </td>

                                {/* Date */}
                                <td style={{
                                  padding: '10px 12px', textAlign: 'center',
                                  color: isFirstForDate ? '#92400e' : '#b45309',
                                  fontWeight: isFirstForDate ? 600 : 400
                                }}>
                                  {isFirstForDate ? (
                                    formatToDMY(de.date)
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#d97706', fontStyle: 'italic' }}>
                                      ↳ same day
                                    </span>
                                  )}
                                </td>

                                {/* Start Time */}
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <input
                                    type="time"
                                    className="gdm-inp-time"
                                    disabled={saving}
                                    style={{ borderColor: hasConflict ? '#ef4444' : '#cbd5e1' }}
                                    value={de.startTime || '00:00'}
                                    onChange={(e) => handleDieselEntryChange(gKey, dIdx, 'startTime', e.target.value)}
                                  />
                                </td>

                                {/* End Time */}
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <input
                                    type="time"
                                    className="gdm-inp-time"
                                    disabled={saving}
                                    style={{ borderColor: hasConflict ? '#ef4444' : '#cbd5e1' }}
                                    value={de.endTime || '00:00'}
                                    onChange={(e) => handleDieselEntryChange(gKey, dIdx, 'endTime', e.target.value)}
                                  />
                                </td>

                                {/* Diesel Hrs */}
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <div style={{
                                    fontWeight: 700,
                                    color: hasConflict ? '#dc2626' : '#92400e',
                                    whiteSpace: 'nowrap',
                                    fontSize: '12.5px'
                                  }}>
                                    {formatDurationDisplay(de.duration)}
                                  </div>
                                  {hasConflict && (
                                    <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '2px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      ⚠ {conflicts[dIdx]}
                                    </div>
                                  )}
                                </td>

                                {/* Actions */}
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                                    {slotCount > 1 && (
                                      <button
                                        type="button"
                                        className="gdm-slot-btn gdm-slot-btn-remove"
                                        disabled={saving}
                                        onClick={() => handleRemoveSlot(gKey, dIdx)}
                                        title="Remove this time slot"
                                      >
                                        ×
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="gdm-slot-btn gdm-slot-btn-add"
                                      disabled={saving}
                                      onClick={() => handleAddSlotForDate(gKey, de.date)}
                                      title="Add another time slot on this date"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs sm:text-sm">
            <span className="text-slate-500 font-medium">Total Duration:</span>
            <span className="font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
              {formatDurationDisplay(totalAllDieselHours)}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || hasConflicts}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Fuel size={14} />
                  <span>Save Diesel Timings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
