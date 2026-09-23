// src/pages/staff/StaffOrderList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import {
  getStaffOrdersList,
  saveStaffOrderTimes,
  calculateDuration,
  formatDurationDisplay,
  getDatesFromFunctionDate,
  DIESEL_TYPES,
} from '@/pages/generators/orders/mockData';
import {
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Fuel,
  Phone,
  MapPin,
  User,
  Calendar,
  Zap,
  X,
  Plus,
  Trash2,
  Save,
  Home,
  Info,
} from 'lucide-react';

export default function StaffOrderList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Time Logging Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingGenerators, setEditingGenerators] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const list = getStaffOrdersList(user);
    setOrders(list);
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [user]);

  // Compute live stats
  const stats = useMemo(() => ({
    total: orders.length,
    inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
  }), [orders]);

  // Filter orders by search and status
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(o => {
      const matchStatus = filterStatus === 'ALL' || o.status === filterStatus;
      const genNames = (o.generators || []).map(g => g.generatorName || '').join(' ').toLowerCase();
      const matchSearch =
        !q ||
        o.id?.toLowerCase().includes(q) ||
        o.clientName?.toLowerCase().includes(q) ||
        o.contactNumber?.includes(q) ||
        o.siteAddress?.toLowerCase().includes(q) ||
        o.operatorName?.toLowerCase().includes(q) ||
        genNames.includes(q);

      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

  // Open modal for adding/editing times
  const openTimeModal = (order) => {
    setSelectedOrder(order);

    const dates = getDatesFromFunctionDate(order.functionDate);

    // Initialize generators with dieselSlots for each date
    const gens = (order.generators || []).map((g, gIdx) => {
      let slots = g.dieselSlots && g.dieselSlots.length > 0 ? [...g.dieselSlots] : [];

      // If no slots exist yet, create 1 initial slot for the first date
      if (slots.length === 0 && order.dieselType === DIESEL_TYPES.WITH_OWNER) {
        slots = [
          {
            id: `slot-${order.id}-${gIdx}-${Date.now()}-0`,
            date: dates[0],
            startTime: g.dieselStartTime || '09:00',
            endTime: g.dieselEndTime || '17:00',
            duration: g.dieselDuration || '08:00',
          },
        ];
      }

      return {
        ...g,
        dieselSlots: slots,
      };
    });

    setEditingGenerators(gens);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
    setEditingGenerators([]);
  };

  // Add another time slot for a specific date (like Super Admin in billing)
  const handleAddSlotForDate = (genIdx, date) => {
    setEditingGenerators(prev => {
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

      // Insert immediately after the last slot for that date
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

  // Remove a specific time slot
  const handleRemoveSlot = (genIdx, slotId) => {
    setEditingGenerators(prev => {
      const copy = [...prev];
      const gen = { ...copy[genIdx] };
      gen.dieselSlots = (gen.dieselSlots || []).filter(s => s.id !== slotId);
      copy[genIdx] = gen;
      return copy;
    });
  };

  // Handle slot time change
  const handleSlotChange = (genIdx, slotId, field, val) => {
    setEditingGenerators(prev => {
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

  // Save times from modal
  const handleSaveTimes = () => {
    if (!selectedOrder) return;
    setSaving(true);

    setTimeout(() => {
      // Sync the primary dieselStartTime / dieselEndTime from first slot for backwards compatibility
      const preparedGens = editingGenerators.map(g => {
        const firstSlot = (g.dieselSlots || [])[0];
        return {
          ...g,
          dieselStartTime: firstSlot?.startTime || '',
          dieselEndTime: firstSlot?.endTime || '',
          dieselDuration: firstSlot?.duration || '',
        };
      });

      const updated = saveStaffOrderTimes(selectedOrder.id, preparedGens);
      if (updated) {
        setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      }
      setSaving(false);
      closeModal();
      showToast(`Diesel operating times saved for Order ${selectedOrder.id}!`);
    }, 300);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen pb-14" style={{ background: 'var(--color-bg)' }}>
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-medium animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors"
            >
              <Home size={12} />
              Home
            </span>
            <span>›</span>
            <span className="text-slate-700 font-medium">My Orders</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                My Assigned Orders
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review assigned bookings and add diesel running time slots for With-Diesel orders.
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search orders, clients, phones…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ── 4 Simple Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { id: 'ALL', label: 'TOTAL ASSIGNED', value: stats.total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            { id: 'IN_PROGRESS', label: 'IN PROGRESS', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
            { id: 'PENDING', label: 'PENDING', value: stats.pending, icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            { id: 'COMPLETED', label: 'COMPLETED', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          ].map(stat => {
            const IconComp = stat.icon;
            const active = filterStatus === stat.id;
            return (
              <div
                key={stat.id}
                onClick={() => setFilterStatus(stat.id)}
                role="button"
                tabIndex={0}
                className={`p-3.5 sm:p-4 rounded-xl bg-white border ${stat.border} shadow-2xs transition-all cursor-pointer hover:shadow-sm ${
                  active ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <IconComp size={16} />
                  </div>
                  {active && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-white">
                      Selected
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {loading ? '—' : stat.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Table Card ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">
              Assigned Orders List ({filteredOrders.length})
            </span>
            {filterStatus !== 'ALL' && (
              <button
                onClick={() => setFilterStatus('ALL')}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Clear Filter ({filterStatus})
              </button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <ClipboardList size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No orders found</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Try resetting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-3.5">Order No</th>
                    <th className="py-3 px-3.5">Client Name</th>
                    <th className="py-3 px-3.5">Client Contact</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Site Address</th>
                    <th className="py-3 px-3.5">Diesel Type</th>
                    <th className="py-3 px-3.5">Cable</th>
                    <th className="py-3 px-3.5">Operator Name</th>
                    <th className="py-3 px-3.5">Function Date</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => {
                    const isWithOwner = o.dieselType === DIESEL_TYPES.WITH_OWNER;
                    const cableList = (o.generators || [])
                      .map(g => g.cableSize)
                      .filter(Boolean);
                    const cableText = cableList.length > 0 ? cableList.join(', ') + ' mm²' : (o.cableRequired ? 'Required' : 'No Cable');

                    const totalSlotsCount = (o.generators || []).reduce(
                      (acc, g) => acc + (g.dieselSlots?.length || (g.dieselStartTime ? 1 : 0)),
                      0
                    );

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Order No */}
                        <td className="py-3 px-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                          {o.id}
                        </td>

                        {/* 2. Client Name */}
                        <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          {o.clientName || '—'}
                        </td>

                        {/* 3. Client Contact Number */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 font-mono">
                          <span className="flex items-center gap-1.5">
                            <Phone size={11} className="text-slate-400" />
                            {o.contactNumber || '—'}
                          </span>
                        </td>

                        {/* 4. Site Address */}
                        <td className="py-3 px-3.5 text-slate-600 max-w-xs">
                          <span className="flex items-start gap-1.5 line-clamp-2">
                            <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>{o.siteAddress || '—'}</span>
                          </span>
                        </td>

                        {/* 5. Diesel Type */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isWithOwner
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <Fuel size={10} />
                            {isWithOwner ? 'With Diesel' : 'Party Diesel'}
                          </span>
                        </td>

                        {/* 6. Cable */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {cableText}
                          </span>
                        </td>

                        {/* 7. Operator Name */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-700">
                          <span className="flex items-center gap-1.5 font-medium">
                            <User size={11} className="text-slate-400" />
                            {o.operatorName || '—'}
                          </span>
                        </td>

                        {/* 8. Function Date */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-slate-400" />
                            {o.functionDate || '—'}
                          </span>
                        </td>

                        {/* 9. Action Button */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {isWithOwner ? (
                            <button
                              onClick={() => openTimeModal(o)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-2xs"
                              title="Add / Update Diesel Running Time Slots"
                            >
                              <Clock size={12} />
                              <span>{totalSlotsCount > 0 ? `Edit Times (${totalSlotsCount})` : 'Add Time Slot'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openTimeModal(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                              title="Party Diesel — View Info"
                            >
                              <Info size={12} />
                              <span>Party Diesel</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── TIME LOGGING MODAL WITH MULTI-SLOT ADD PER DATE ──────────── */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {selectedOrder.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedOrder.dieselType === DIESEL_TYPES.WITH_OWNER
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <Fuel size={10} />
                    {selectedOrder.dieselType === DIESEL_TYPES.WITH_OWNER ? 'With Diesel' : 'Party Diesel'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedOrder.dieselType === DIESEL_TYPES.WITH_OWNER
                    ? `Diesel Operating Time Slots — ${selectedOrder.clientName}`
                    : `Order Details — ${selectedOrder.clientName}`}
                </h3>
              </div>

              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {selectedOrder.dieselType !== DIESEL_TYPES.WITH_OWNER ? (
                /* Party Diesel Info Box */
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                    <Fuel size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Party Diesel Booking</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    This order is booked under <strong>Party Diesel</strong> terms. Fuel is arranged and provided directly by the client. Operating time slots are only required for With-Diesel bookings.
                  </p>
                </div>
              ) : (
                /* With Diesel Time Slots */
                <>
                  <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                    <Info size={15} className="text-blue-600 shrink-0" />
                    <span>
                      Enter start and end times for each shift/date. Click <strong>+ Add Slot</strong> to add another time slot for the same date.
                    </span>
                  </div>

                  {editingGenerators.map((gen, gIdx) => {
                    const orderDates = getDatesFromFunctionDate(selectedOrder.functionDate);
                    const slots = gen.dieselSlots || [];

                    return (
                      <div
                        key={gen._id || gIdx}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4"
                      >
                        {/* Unit Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">
                              #{gIdx + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-800">
                              {gen.generatorName || 'Generator Set'}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {slots.length} Time Slot{slots.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Dates Grouping */}
                        <div className="space-y-4">
                          {orderDates.map(dateStr => {
                            const dateSlots = slots.filter(s => s.date === dateStr);

                            return (
                              <div
                                key={dateStr}
                                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5"
                              >
                                {/* Date Header + Add Slot Button for this Date */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                    <Calendar size={13} className="text-blue-600" />
                                    <span>Date: {dateStr}</span>
                                  </div>

                                  {/* Add another time slot for this date button */}
                                  <button
                                    type="button"
                                    onClick={() => handleAddSlotForDate(gIdx, dateStr)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                                    title="Add another time slot for this date"
                                  >
                                    <Plus size={11} />
                                    <span>Add Time Slot</span>
                                  </button>
                                </div>

                                {/* Slots list for this date */}
                                {dateSlots.length === 0 ? (
                                  <div className="py-3 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                    No slots logged for this date. Click &ldquo;Add Time Slot&rdquo; above.
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {dateSlots.map((slot, sIdx) => {
                                      return (
                                        <div
                                          key={slot.id}
                                          className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[45px]">
                                              Slot #{sIdx + 1}
                                            </span>

                                            {/* Start Time */}
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-slate-500 font-medium">Start:</span>
                                              <input
                                                type="time"
                                                value={slot.startTime || '09:00'}
                                                onChange={e => handleSlotChange(gIdx, slot.id, 'startTime', e.target.value)}
                                                className="px-2 py-1 text-xs rounded border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                              />
                                            </div>

                                            {/* End Time */}
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-slate-500 font-medium">End:</span>
                                              <input
                                                type="time"
                                                value={slot.endTime || '17:00'}
                                                onChange={e => handleSlotChange(gIdx, slot.id, 'endTime', e.target.value)}
                                                className="px-2 py-1 text-xs rounded border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                                            {/* Calculated Duration */}
                                            <div className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                                              {formatDurationDisplay(slot.duration || calculateDuration(slot.startTime, slot.endTime))}
                                            </div>

                                            {/* Remove Slot Button */}
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
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              {selectedOrder.dieselType === DIESEL_TYPES.WITH_OWNER && (
                <button
                  type="button"
                  onClick={handleSaveTimes}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-all disabled:opacity-60"
                >
                  <Save size={13} />
                  <span>{saving ? 'Saving…' : 'Save Time Slots'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
