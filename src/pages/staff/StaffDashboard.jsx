// src/pages/staff/StaffDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { generatorOrderService } from '@/services/generatorOrderService';
import { mockOrders, formatRangeToDMY, parseDateStr } from '@/pages/generators/orders/mockData';
import GeneratorDieselModal from '@/pages/generators/orders/GeneratorDieselModal';
import {
  Shield,
  Calendar,
  Search,
  Fuel,
  Phone,
  MapPin,
  ExternalLink,
  Zap,
  RefreshCw,
  FileText,
  X,
  Clock,
} from 'lucide-react';

/** Extract start and end Date objects from order function date fields */
const getFunctionDates = (o) => {
  if (!o) return { fFrom: null, fTo: null };
  const fFrom = o.functionDateFrom
    ? (typeof o.functionDateFrom === 'string' ? parseDateStr(o.functionDateFrom) : new Date(o.functionDateFrom))
    : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[0]) : null);
  const fTo = o.functionDateTo
    ? (typeof o.functionDateTo === 'string' ? parseDateStr(o.functionDateTo) : new Date(o.functionDateTo))
    : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[1] || o.functionDate) : null);
  return { fFrom, fTo: fTo || fFrom };
};

/**
 * Checks if an order is scheduled for today according to its function / booking date.
 */
const isOrderForToday = (o) => {
  if (!o) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  // 1. Function Date range check: today falls within [fFrom, fTo]
  const { fFrom, fTo } = getFunctionDates(o);
  if (fFrom && fTo) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate()).getTime();
    const toTime = new Date(fTo.getFullYear(), fTo.getMonth(), fTo.getDate(), 23, 59, 59, 999).getTime();
    if (todayStart >= fromTime && todayStart <= toTime) {
      return true;
    }
  } else if (fFrom) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate()).getTime();
    if (fromTime >= todayStart && fromTime <= todayEnd) {
      return true;
    }
  }

  // 2. String comparison safeguard
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayYMD = `${y}-${m}-${d}`;
  const todayDMY = `${d}-${m}-${y}`;
  const todaySlashDMY = `${d}/${m}/${y}`;

  const checkMatch = (val) => {
    if (!val) return false;
    const str = String(val).trim();
    return str.includes(todayYMD) || str.includes(todayDMY) || str.includes(todaySlashDMY);
  };

  if (checkMatch(o.functionDate) || checkMatch(o.functionDateFrom) || checkMatch(o.functionDateTo)) {
    return true;
  }

  if (checkMatch(o.bookingDate) || checkMatch(o.deliveryDate)) {
    return true;
  }

  return false;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatFunctionDate = (o) => {
  if (o.functionDateFrom) {
    const fromStr = formatDate(o.functionDateFrom);
    if (o.functionDateTo && o.functionDateTo !== o.functionDateFrom) {
      return `${fromStr} to ${formatDate(o.functionDateTo)}`;
    }
    return fromStr;
  }
  if (o.functionDate) {
    return formatRangeToDMY(o.functionDate);
  }
  if (o.deliveryDate) {
    return formatDate(o.deliveryDate);
  }
  return '—';
};

/** Helper to extract cable description */
const getCableDisplay = (o) => {
  if (!o) return 'No';

  // 1. Collect all cable sizes from generators or order items
  const sizes = [];
  if (Array.isArray(o.generators)) {
    o.generators.forEach((g) => {
      if (g.cableSize && !sizes.includes(g.cableSize)) {
        sizes.push(g.cableSize);
      }
    });
  }
  if (Array.isArray(o.items)) {
    o.items.forEach((item) => {
      if (item.cableSize && !sizes.includes(item.cableSize)) {
        sizes.push(item.cableSize);
      }
    });
  }
  if (sizes.length === 0 && o.cableSize) {
    sizes.push(o.cableSize);
  }

  // 2. Fallback to cable or cableType if not generic phrases
  const rawCable = (o.cable || o.cableType || '').trim();
  const isGeneric = !rawCable || ['required', 'not required', 'none', 'no', '—', 'null', 'undefined'].includes(rawCable.toLowerCase());
  if (sizes.length === 0 && !isGeneric) {
    sizes.push(rawCable);
  }

  // If specific sizes found: format each (append mm² if purely numeric)
  if (sizes.length > 0) {
    return sizes
      .map((s) => (/^\d+$/.test(String(s).trim()) ? `${s} mm²` : String(s).trim()))
      .join(', ');
  }

  // 3. If cableRequired is false or not set
  if (o.cableRequired === false || !o.cableRequired) {
    return 'No';
  }

  // 4. If cableRequired is true but no specific size was specified
  return 'Yes';
};

/** Determine if an order is assigned to the currently logged in staff user */
const isOrderAssignedToUser = (o, currentUser) => {
  if (!o) return false;
  if (!currentUser) return true;

  const userId = currentUser.id ? String(currentUser.id) : null;
  const userName = (currentUser.name || currentUser.username || '').toLowerCase().trim();

  // 1. By ID match
  if (userId) {
    if (o.assignedToId && String(o.assignedToId) === userId) return true;
    if (o.assignedStaffId && String(o.assignedStaffId) === userId) return true;
    if (o.staffId && String(o.staffId) === userId) return true;
    if (o.assignedTo?.id && String(o.assignedTo.id) === userId) return true;
  }

  // 2. By Name match
  const assignedName = (
    o.assignedToName ||
    o.assignedStaffName ||
    o.assignedTo?.name ||
    o.operatorName ||
    ''
  ).toLowerCase().trim();

  if (userName && assignedName) {
    if (assignedName === userName || assignedName.includes(userName) || userName.includes(assignedName)) {
      return true;
    }
  }

  // 3. Demo fallback: if user role is STAFF or user name is 'staff'
  const isStaffRole = currentUser.role === 'STAFF' || currentUser.role === 'ROLE_STAFF';
  if (isStaffRole && (assignedName === 'staff' || !assignedName)) {
    return true;
  }

  return false;
};

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dieselModalTarget, setDieselModalTarget] = useState(null);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await generatorOrderService.getAll('', '', 0, 100, 'createdAt', 'desc');
      let list = res?.content || [];
      if (list.length === 0 && mockOrders && mockOrders.length > 0) {
        list = mockOrders;
      }
      setOrders(list);
    } catch (err) {
      console.warn('API error fetching orders, fallback to mockOrders:', err);
      setOrders(mockOrders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Today's orders assigned to currently logged in staff
  const todaysOrders = useMemo(() => {
    return orders.filter((o) => isOrderForToday(o) && isOrderAssignedToUser(o, user));
  }, [orders, user]);

  // Active list based on search query
  const displayedOrders = useMemo(() => {
    if (!search.trim()) return todaysOrders;
    const q = search.toLowerCase().trim();
    return todaysOrders.filter((o) => {
      const client = (o.clientName || o.customerName || o.customer?.name || '').toLowerCase();
      const orderNo = (o.orderNumber || `#${o.id}` || '').toLowerCase();
      const contact = (o.contactNumber || o.customerMobile || o.customer?.mobile || '').toLowerCase();
      const altContact = (o.alternateNumber || o.alternateMobile || o.customer?.alternateMobile || '').toLowerCase();
      const address = (o.siteAddress || o.customer?.address || '').toLowerCase();
      const diesel = (o.dieselType || (o.withDiesel ? 'With Diesel' : 'Party Diesel')).toLowerCase();
      const cable = getCableDisplay(o).toLowerCase();
      return (
        client.includes(q) ||
        orderNo.includes(q) ||
        contact.includes(q) ||
        altContact.includes(q) ||
        address.includes(q) ||
        diesel.includes(q) ||
        cable.includes(q)
      );
    });
  }, [todaysOrders, search]);

  const todayDisplayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen pb-14" style={{ background: 'var(--color-bg)' }}>
      {/* ── Top Hero Banner with Staff Portal Badge & Logged In As ───────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {/* Staff Portal Badge & Logged in as ... */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs">
                  <Shield size={13} />
                  Staff Portal
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-300">
                  Logged in as <strong className="text-white font-bold">{user?.name || 'Staff Member'}</strong>
                  {user?.mobile && <span className="text-slate-400 ml-1">(+91 {user.mobile})</span>}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
                <span>Today's Bookings</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                  <Calendar size={12} />
                  {todayDisplayDate}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Track schedule for today and log generator diesel operating timing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer shadow-xs active:scale-98"
                title="Refresh bookings"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Downside: List of Today's Bookings ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 space-y-4">
        {/* Toolbar: View Toggle & Search */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span>Today's Bookings</span>
            </h2>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search client, order no, mobile, site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Bookings Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mobile swipe hint */}
          <div className="sm:hidden px-3.5 py-2 text-[11px] font-medium text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 select-none">
            <span>👉 Scroll table horizontally to view full booking details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-12 text-center whitespace-nowrap">Sr no.</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Order no.</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Client name</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Client mb. no.</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Client alt. no.</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Site address</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Site addresss link</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Diesel type</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Cable</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Function date</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-blue-600" />
                        <span className="text-sm font-medium">Loading bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-14 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <FileText size={24} />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">
                          {search
                            ? 'No matching bookings found'
                            : 'No bookings assigned to you for today'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {search
                            ? 'Try searching with a different client name, order number, or mobile.'
                            : `There are no generator bookings assigned to you for ${todayDisplayDate}.`}
                        </p>
                        {search && (
                          <button
                            onClick={() => setSearch('')}
                            className="mt-3.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedOrders.map((o, idx) => {
                    const clientName = o.clientName || o.customerName || o.customer?.name || '—';
                    const contactNo = o.contactNumber || o.customerMobile || o.customer?.mobile || '';
                    const altContactNo = o.alternateNumber || o.alternateMobile || o.customer?.alternateMobile || '';
                    const siteAddress = o.siteAddress || o.customer?.address || '';
                    const siteLink = o.siteAddressLink || (siteAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress)}` : '');
                    const dieselType = o.dieselType || (o.withDiesel ? 'With Diesel' : 'Party Diesel');
                    const cableDisplay = getCableDisplay(o);
                    const isWithDiesel = dieselType === 'With Diesel' || o.withDiesel;

                    return (
                      <tr key={o.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                        {/* 1. Sr no. */}
                        <td className="py-3 px-3 text-center text-xs font-semibold text-slate-400 whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* 2. Order no. */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {o.orderNumber || `#${o.id}`}
                          </span>
                          {o.billNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">Bill: {o.billNumber}</div>
                          )}
                        </td>

                        {/* 3. Client name */}
                        <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-800">
                          {clientName}
                        </td>

                        {/* 4. Client contact no */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                          {contactNo ? (
                            <a
                              href={`tel:${contactNo}`}
                              className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                            >
                              <Phone size={12} className="text-blue-600 shrink-0" />
                              <span>+91 {contactNo}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 5. Client alternate number */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                          {altContactNo ? (
                            <a
                              href={`tel:${altContactNo}`}
                              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                            >
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>+91 {altContactNo}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 6. Site address */}
                        <td className="py-3 px-3.5 max-w-[220px]">
                          {siteAddress ? (
                            <div className="text-xs text-slate-700 flex items-start gap-1">
                              <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 break-words font-medium">{siteAddress}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No address</span>
                          )}
                        </td>

                        {/* 7. Site addresss link */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                          {siteLink ? (
                            <a
                              href={siteLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <span>Open Map</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 8. Diesel type */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isWithDiesel
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Fuel size={12} />
                            {dieselType}
                          </span>
                        </td>

                        {/* 9. Cable */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                          {cableDisplay !== 'No' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Zap size={11} />
                              {cableDisplay}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">No</span>
                          )}
                        </td>

                        {/* 10. Function date */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-xs font-semibold text-slate-800">
                          {formatFunctionDate(o)}
                        </td>

                        {/* 11. Action (Add diesel timing modal same as in order management) */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setDieselModalTarget(o)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
                            title="Add or edit generator operating diesel timings"
                          >
                            <Fuel size={13} />
                            <span>Add Diesel Timing</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Diesel Timings Modal (same as in Order Management) ─────────────── */}
      {dieselModalTarget && (
        <GeneratorDieselModal
          isOpen={!!dieselModalTarget}
          onClose={() => setDieselModalTarget(null)}
          order={dieselModalTarget}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
