// src/pages/staff/StaffOrderList.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { generatorOrderService } from '@/services/generatorOrderService';
import {
  mockOrders,
  formatRangeToDMY,
  parseDateStr,
} from '@/pages/generators/orders/mockData';
import GeneratorDieselModal from '@/pages/generators/orders/GeneratorDieselModal';
import {
  Home,
  Search,
  Calendar,
  Fuel,
  Phone,
  MapPin,
  ExternalLink,
  Zap,
  RefreshCw,
  FileText,
  X,
} from 'lucide-react';

/** Format single date string to "DD MMM YYYY" */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/** Format function date range or single date */
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
export const getCableDisplay = (o) => {
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

/** Check if order matches selected date string (YYYY-MM-DD) */
const doesOrderMatchDate = (order, dateString) => {
  if (!dateString) return true;
  if (!order) return false;

  const [y, m, d] = dateString.split('-').map(Number);
  const targetStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const targetEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();

  // 1. Check functionDateFrom / To
  let fFrom = null;
  let fTo = null;
  if (order.functionDateFrom) {
    fFrom = typeof order.functionDateFrom === 'string' ? parseDateStr(order.functionDateFrom) : new Date(order.functionDateFrom);
  }
  if (order.functionDateTo) {
    fTo = typeof order.functionDateTo === 'string' ? parseDateStr(order.functionDateTo) : new Date(order.functionDateTo);
  }

  // 2. Check functionDate range
  if (!fFrom && order.functionDate) {
    const parts = String(order.functionDate).split(' to ');
    fFrom = parseDateStr(parts[0].trim());
    fTo = parts.length > 1 ? parseDateStr(parts[1].trim()) : fFrom;
  }

  if (fFrom && fTo) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate(), 0, 0, 0, 0).getTime();
    const toTime = new Date(fTo.getFullYear(), fTo.getMonth(), fTo.getDate(), 23, 59, 59, 999).getTime();
    if (targetStart >= fromTime && targetStart <= toTime) return true;
  } else if (fFrom) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate(), 0, 0, 0, 0).getTime();
    const toTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate(), 23, 59, 59, 999).getTime();
    if (targetStart >= fromTime && targetStart <= toTime) return true;
  }

  // 3. String matches
  const targetYMD = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const targetDMY = `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
  const targetSlashDMY = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;

  const allDateText = `${order.functionDate || ''} ${order.bookingDate || ''} ${order.deliveryDate || ''} ${order.createdAt || ''}`;
  return allDateText.includes(targetYMD) || allDateText.includes(targetDMY) || allDateText.includes(targetSlashDMY);
};

/** Determine if an order is assigned to the currently logged in staff user */
export const isOrderAssignedToUser = (o, currentUser) => {
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

export default function StaffOrderList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'assigned' (default) vs 'all'
  const [viewMode, setViewMode] = useState('assigned');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Diesel Timing Modal Target
  const [dieselModalTarget, setDieselModalTarget] = useState(null);

  // Fetch orders from API with fallback to mock data
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await generatorOrderService.getAll('', '', 0, 200, 'createdAt', 'desc');
      let list = res?.content || [];
      if (list.length === 0 && mockOrders && mockOrders.length > 0) {
        list = mockOrders;
      }
      setAllOrders(list);
    } catch (err) {
      console.warn('API error fetching orders, fallback to mockOrders:', err);
      setAllOrders(mockOrders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // List of orders assigned to currently logged in staff
  const assignedOrders = useMemo(() => {
    return allOrders.filter((o) => isOrderAssignedToUser(o, user));
  }, [allOrders, user]);

  // Current base list depending on selected viewMode
  const currentBaseList = viewMode === 'assigned' ? assignedOrders : allOrders;

  // Final filtered list for the table
  const displayedOrders = useMemo(() => {
    return currentBaseList.filter((o) => {
      // 1. Date filter
      if (selectedDate && !doesOrderMatchDate(o, selectedDate)) {
        return false;
      }

      // 2. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
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
      }

      return true;
    });
  }, [currentBaseList, selectedDate, search]);

  return (
    <div className="min-h-screen pb-14" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header: Breadcrumb, Title & Search ──────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Breadcrumb */}
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

          {/* Heading & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                My Assigned Orders
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Search */}
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search orders, clients, phones, sites…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-200/50"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Refresh orders"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4">
        {/* ── Toolbar: Primary View Toggle + Date Filter + Smaller Status Tabs ── */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: View Mode Toggle (Assigned Orders [default] vs All Orders) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setViewMode('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'assigned'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assigned Orders
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Orders
            </button>
          </div>

          {/* Right: Calendar Date Filter */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs transition-colors">
              <Calendar size={13} className="text-slate-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer font-medium"
                title="Select date to filter orders"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-200/60 transition-colors"
                  title="Clear date filter"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Table Container ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mobile swipe hint */}
          <div className="sm:hidden px-3.5 py-2 text-[11px] font-medium text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 select-none">
            <span>👉 Scroll table horizontally to view all booking columns</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[1100px] border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-12 text-center whitespace-nowrap">Sr no.</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Order no.</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Client name</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Client contact no</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Client alternate number</th>
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
                    <td colSpan={11} className="py-14 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-blue-600" />
                        <span className="text-xs font-medium">Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <FileText size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {search
                            ? `No orders matching "${search}"`
                            : selectedDate
                            ? `No orders found for ${formatDate(selectedDate)}`
                            : viewMode === 'assigned'
                            ? 'No orders currently assigned to you.'
                            : 'No order records found.'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                          {viewMode === 'assigned' && allOrders.length > 0
                            ? 'Click "All Orders" above to view bookings in the system.'
                            : 'Try adjusting your search query or date filter.'}
                        </p>
                        {(search || selectedDate) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch('');
                              setSelectedDate('');
                            }}
                            className="mt-3.5 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                          >
                            Reset Filters
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
                    const siteLink =
                      o.siteAddressLink ||
                      (siteAddress
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress)}`
                        : '');
                    const dieselType = o.dieselType || (o.withDiesel ? 'With Diesel' : 'Party Diesel');
                    const cableDisplay = getCableDisplay(o);
                    const isWithDiesel = dieselType === 'With Diesel' || dieselType === 'WITH_OWNER' || o.withDiesel;

                    // Check if assigned to current user
                    const isAssigned = isOrderAssignedToUser(o, user);

                    return (
                      <tr key={o.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                        {/* 1. Sr no. */}
                        <td className="py-3 px-3 text-center text-xs font-semibold text-slate-400 whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* 2. Order no. */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-mono">
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
                            {isWithDiesel ? 'With Diesel' : 'Party Diesel'}
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
                          {isAssigned ? (
                            <button
                              type="button"
                              onClick={() => setDieselModalTarget(o)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
                              title="Add or edit generator operating diesel timings"
                            >
                              <Fuel size={13} />
                              <span>Add Diesel Timing</span>
                            </button>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-400 border border-slate-200 select-none"
                              title="Only orders assigned to you allow logging diesel timing"
                            >
                              Not Assigned
                            </span>
                          )}
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

      {/* ── Add Diesel Timing Modal (Same modal as Order Management) ─────── */}
      <GeneratorDieselModal
        isOpen={!!dieselModalTarget}
        onClose={() => setDieselModalTarget(null)}
        order={dieselModalTarget}
        onSuccess={() => {
          fetchOrders();
        }}
      />
    </div>
  );
}
