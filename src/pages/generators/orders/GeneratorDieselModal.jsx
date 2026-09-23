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
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'gdm-fadein 0.2s ease-out'
      }}
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
        style={{
          background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '960px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden', animation: 'gdm-scaleup 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: '#fef3c7', color: '#b45309',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(180, 83, 9, 0.15)'
            }}>
              <Fuel size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Diesel Running Hours Log
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Order: <strong style={{ color: '#1e293b' }}>{order?.orderNumber || `#${order?.id}`}</strong></span>
                <span>•</span>
                <span>Client: <strong style={{ color: '#1e293b' }}>{order?.clientName || '—'}</strong></span>
                {order?.functionDate && (
                  <>
                    <span>•</span>
                    <span>Date: <strong style={{ color: '#1e293b' }}>{formatRangeToDMY(order.functionDate)}</strong></span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#fff', color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <div style={{
                display: 'inline-block', width: '32px', height: '32px',
                border: '3px solid #e2e8f0', borderTopColor: '#3b82f6',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite'
              }} />
              <div style={{ marginTop: '12px', fontSize: '13.5px', fontWeight: 600 }}>Loading diesel timings...</div>
            </div>
          ) : errorMsg && !fullOrder ? (
            <div style={{
              padding: '16px', borderRadius: '10px', background: '#fef2f2',
              border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <>
              {/* Instructions banner */}
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                color: '#1e40af', fontSize: '12.5px', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px'
              }}>
                <Clock size={16} style={{ flexShrink: 0 }} />
                <span>
                  Specify start and end times for each day. Use the green <strong>(+)</strong> button to add multiple generator operating slots for any date.
                </span>
              </div>

              {errorMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', background: '#fef2f2',
                  border: '1px solid #fecaca', color: '#991b1b', fontSize: '12.5px',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', background: '#f0fdf4',
                  border: '1px solid #bbf7d0', color: '#166534', fontSize: '12.5px',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Table of Diesel Running Hours */}
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: '12px',
                overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '70px' }}>Days</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '120px' }}>Date</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '125px' }}>Start Time</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '125px' }}>End Time</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '140px' }}>Diesel Hrs</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', width: '70px' }}>Action</th>
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
            </>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e2e8f0',
          background: '#f8fafc', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Total Diesel Duration:</span>
            <span style={{
              fontSize: '13.5px', fontWeight: 800, color: '#92400e',
              background: '#fef3c7', border: '1px solid #fde68a',
              padding: '3px 10px', borderRadius: '8px'
            }}>
              {formatDurationDisplay(totalAllDieselHours)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 18px', borderRadius: '8px', border: '1.5px solid #cbd5e1',
                background: '#fff', color: '#475569', fontSize: '13.5px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || hasConflicts}
              style={{
                padding: '9px 22px', borderRadius: '8px', border: 'none',
                background: (hasConflicts || loading) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff', fontSize: '13.5px', fontWeight: 700,
                cursor: (hasConflicts || loading || saving) ? 'not-allowed' : 'pointer',
                boxShadow: (hasConflicts || loading) ? 'none' : '0 4px 12px rgba(37,99,235,0.25)',
                display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite'
                  }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Fuel size={16} />
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
