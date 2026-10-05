// src/pages/staff/StaffDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { generatorOrderService } from '@/services/generatorOrderService';
import { formatRangeToDMY, parseDateStr } from '@/pages/generators/orders/mockData';
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
  LayoutGrid,
  List,
  CheckCircle2,
  User,
  Lock,
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

import { formatToDMY } from '@/utils/helpers';

const formatDate = (dateStr) => formatToDMY(dateStr);

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
  return '-';
};

/** Calculate rental duration in days (inclusive: 1 Oct to 2 Oct = 2 days) */
const getRentalDays = (o) => {
  if (!o) return null;

  let from = null;
  let to   = null;

  if (o.functionDateFrom) {
    from = typeof o.functionDateFrom === 'string'
      ? parseDateStr(o.functionDateFrom)
      : new Date(o.functionDateFrom);
  }
  if (o.functionDateTo) {
    to = typeof o.functionDateTo === 'string'
      ? parseDateStr(o.functionDateTo)
      : new Date(o.functionDateTo);
  }

  // Fall back to functionDate range string (e.g. "01-10-2026 to 02-10-2026")
  if (!from && o.functionDate) {
    const parts = String(o.functionDate).split(' to ');
    from = parseDateStr(parts[0].trim());
    to   = parts[1] ? parseDateStr(parts[1].trim()) : from;
  }

  if (!from) return null;
  if (!to)   to = from;

  // Strip time portion for clean day diff
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const t = new Date(to.getFullYear(),   to.getMonth(),   to.getDate());
  const diffMs = t - f;
  const days   = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
  return days;
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
  const isGeneric = !rawCable || ['required', 'not required', 'none', 'no', '-', 'null', 'undefined'].includes(rawCable.toLowerCase());
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

/**
 * Helper to determine diesel short code:
 * - 'WD' for With Diesel / Owner
 * - 'PD' for Party Diesel
 */
export const getDieselShortCode = (o) => {
  if (!o) return 'PD';
  const val = String(o.dieselType || (o.withDiesel ? 'WD' : 'PD')).trim().toUpperCase();
  if (
    val.includes('WITH') ||
    val.includes('OWNER') ||
    val === 'WD' ||
    val === 'WITH_OWNER' ||
    val === 'WITH_DIESEL' ||
    o.withDiesel === true
  ) {
    return 'WD';
  }
  return 'PD';
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

/**
 * ── Mobile & Responsive Booking Card Component ─────────────────────────────
 * Optimized for touchscreens, mobile devices, and small dimensions.
 */
function BookingCard({ order: o, idx, onAddDiesel }) {
  const clientName = o.clientName || o.customerName || o.customer?.name || '-';
  const contactNo = o.contactNumber || o.customerMobile || o.customer?.mobile || '';
  const altContactNo = o.alternateNumber || o.alternateMobile || o.customer?.alternateMobile || '';
  const siteAddress = o.siteAddress || o.customer?.address || '';
  const siteLink = o.siteAddressLink || (siteAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress)}` : '');
  const dieselCode = getDieselShortCode(o);
  const cableDisplay = getCableDisplay(o);
  const isWithDiesel = dieselCode === 'WD';
  const isCompleted = o.billingStatus === 'COMPLETED' || o.status === 'COMPLETED' || o.billingCompleted === true || Boolean(o.billNumber);

  return (
    <div
      className={`rounded-2xl transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between gap-4 border relative ${
        isCompleted
          ? 'bg-slate-100/90 border-slate-300 shadow-none opacity-65 grayscale-[35%] hover:grayscale-0'
          : 'bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400 group'
      }`}
      style={
        isCompleted
          ? {
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(241, 245, 249, 0.95) 12px, rgba(226, 232, 240, 0.6) 12px, rgba(226, 232, 240, 0.6) 24px)',
            }
          : undefined
      }
    >
      <div>
        {/* Top Header: Order number, Sr No & Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}
            >
              #{idx + 1}
            </span>
            <span
              className={`font-black text-base sm:text-lg tracking-tight ${
                isCompleted
                  ? 'text-slate-600'
                  : 'text-slate-900 group-hover:text-blue-600 transition-colors'
              }`}
            >
              {o.orderNumber || `#${o.id}`}
            </span>
            {o.billNumber && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 border border-slate-300">
                Bill: {o.billNumber}
              </span>
            )}
          </div>

          {/* Status badge */}
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600 border border-slate-300 shrink-0 select-none">
              <CheckCircle2 size={13} className="text-slate-500" />
              Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 select-none shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          )}
        </div>

        {/* Client Name & Phone Tap-to-Call Buttons */}
        <div
          className={`rounded-xl p-3 sm:p-3.5 border space-y-2.5 ${
            isCompleted
              ? 'bg-slate-200/60 border-slate-300/80'
              : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div
            className={`text-base sm:text-lg font-black leading-snug tracking-tight ${
              isCompleted ? 'text-slate-600' : 'text-slate-900'
            }`}
          >
            {clientName}
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {contactNo ? (
              <a
                href={`tel:${contactNo}`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-2xs active:scale-95 transition-all ${
                  isCompleted
                    ? 'bg-white/70 border-slate-300 text-slate-600'
                    : 'bg-white border-emerald-200/80 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
                title="Tap to call client"
              >
                <Phone size={14} className={isCompleted ? 'text-slate-500 shrink-0' : 'text-emerald-600 shrink-0'} />
                <span>+91 {contactNo}</span>
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">No mobile</span>
            )}

            {altContactNo && (
              <a
                href={`tel:${altContactNo}`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold shadow-2xs active:scale-95 transition-all ${
                  isCompleted
                    ? 'bg-white/70 border-slate-300 text-slate-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
                }`}
                title="Tap to call alternate mobile"
              >
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>Alt: +91 {altContactNo}</span>
              </a>
            )}
          </div>
        </div>

        {/* Site Address & Open Map Button */}
        <div className="mt-3 flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2 text-xs sm:text-sm flex-1 min-w-0">
            <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <span
              className={`line-clamp-2 font-semibold ${
                isCompleted ? 'text-slate-500' : 'text-slate-800'
              }`}
            >
              {siteAddress || <span className="text-slate-400 italic">No site address</span>}
            </span>
          </div>

          {siteLink && (
            <a
              href={siteLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-colors border shadow-2xs ${
                isCompleted
                  ? 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/70'
              }`}
              title="Open location in Google Maps"
            >
              <span>Map</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Specs Pills (Function Date, Diesel, Cable) */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border ${
              isCompleted
                ? 'bg-slate-200/70 text-slate-600 border-slate-300'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Calendar size={13} className="text-slate-500 shrink-0" />
            <span>{formatFunctionDate(o)}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border ${
              isCompleted
                ? 'bg-slate-200/70 text-slate-600 border-slate-300'
                : isWithDiesel
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title={isWithDiesel ? 'WD (With Diesel / Owner)' : 'PD (Party Diesel)'}
          >
            <Fuel size={13} className={isWithDiesel && !isCompleted ? 'text-amber-600' : ''} />
            <span>{dieselCode}</span>
          </span>

          {cableDisplay !== 'No' && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border ${
                isCompleted
                  ? 'bg-slate-200/70 text-slate-600 border-slate-300'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Zap size={13} />
              <span>{cableDisplay}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-1.5">
        {isCompleted ? (
          <div className="w-full py-3 px-4 rounded-xl bg-slate-200/90 text-slate-500 font-extrabold text-xs sm:text-sm border border-slate-300 flex items-center justify-center gap-2 select-none cursor-not-allowed shadow-2xs">
            <Lock size={15} className="text-slate-400" />
            <span>Billing Completed (Entries Locked)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAddDiesel(o)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Fuel size={16} />
            <span>Add Diesel Timing</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'cards' | 'table'
  const [dieselModalTarget, setDieselModalTarget] = useState(null);

  // Fetch all assigned orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [assignedRes, allRes] = await Promise.allSettled([
        generatorOrderService.getAssignedToMe(),
        generatorOrderService.getAll('', '', 0, 100, 'createdAt', 'desc')
      ]);

      const assignedList = assignedRes.status === 'fulfilled'
        ? (Array.isArray(assignedRes.value) ? assignedRes.value : (assignedRes.value?.content || []))
        : [];

      const allList = allRes.status === 'fulfilled'
        ? (Array.isArray(allRes.value?.content) ? allRes.value.content : (Array.isArray(allRes.value) ? allRes.value : []))
        : [];

      setOrders(assignedList.length > 0 ? assignedList : allList);
    } catch (err) {
      console.error('Error fetching orders for staff dashboard:', err);
      setOrders([]);
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
      const diesel = (o.dieselType || (o.withDiesel ? 'WD' : 'PD')).toLowerCase();
      const dieselCode = getDieselShortCode(o).toLowerCase();
      const cable = getCableDisplay(o).toLowerCase();
      return (
        client.includes(q) ||
        orderNo.includes(q) ||
        contact.includes(q) ||
        altContact.includes(q) ||
        address.includes(q) ||
        diesel.includes(q) ||
        dieselCode.includes(q) ||
        cable.includes(q)
      );
    });
  }, [todaysOrders, search]);

  const now = new Date();
  const todayDisplayDate = `${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${formatToDMY(now)}`;

  return (
    <div className="min-h-screen pb-14" style={{ background: 'var(--color-bg)' }}>
      {/* ── Top Hero Banner with Staff Portal Badge & Logged In As ───────── */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 shadow-md">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div className="space-y-3">
              {/* Badges: Staff Portal & Logged in as User */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs tracking-wide">
                  <Shield size={15} className="text-emerald-400" />
                  Staff Portal
                </span>

                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm bg-white/10 text-slate-100 border border-white/15 backdrop-blur-sm shadow-xs">
                  <User size={15} className="text-blue-300 shrink-0" />
                  <span className="text-slate-300">Logged in as:</span>
                  <strong className="text-white font-bold">{user?.name || 'Staff Member'}</strong>
                  {user?.mobile && (
                    <span className="text-slate-300 font-medium">
                      ({user.mobile.startsWith('+') ? user.mobile : `+91 ${user.mobile}`})
                    </span>
                  )}
                </div>
              </div>

              {/* Main Heading: Today's Bookings + Count Badge + Formatted Date */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                  <span>Today's Bookings</span>
                  <span className="inline-flex items-center justify-center min-w-[2.25rem] h-8 sm:h-9 px-3 rounded-full bg-blue-600 text-white font-black text-sm sm:text-base shadow-md ring-2 ring-blue-400/40">
                    {todaysOrders.length}
                  </span>
                </h1>

                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 text-slate-100 border border-slate-700/80 font-bold text-xs sm:text-sm shadow-xs backdrop-blur-sm">
                  <Calendar size={16} className="text-amber-400 shrink-0" />
                  <span>{todayDisplayDate}</span>
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs sm:text-sm font-bold border border-white/20 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                title="Refresh bookings"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content: Today's Bookings ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 -mt-2 sm:-mt-4 space-y-4">
        {/* Toolbar: Title, View Toggles & Search Box */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Calendar size={18} />
              </span>
              <span>Today's Bookings <span className="text-blue-600 font-bold">({displayedOrders.length})</span></span>
            </h2>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards' || (viewMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 1024)
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card View (Mobile friendly)"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View (Full columns)"
              >
                <List size={15} />
              </button>
            </div>
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

        {/* ── Content: Loading State ── */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-blue-600" />
              <span className="text-sm font-medium">Loading bookings...</span>
            </div>
          </div>
        )}

        {/* ── Content: Empty State ── */}
        {!loading && displayedOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
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
                  className="mt-3.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Content: Bookings List ── */}
        {!loading && displayedOrders.length > 0 && (
          <>
            {/* 1. Mobile & Tablet Cards View */}
            <div className={viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block lg:hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayedOrders.map((o, idx) => (
                  <BookingCard
                    key={o.id || idx}
                    order={o}
                    idx={idx}
                    onAddDiesel={(target) => setDieselModalTarget(target)}
                  />
                ))}
              </div>
            </div>

            {/* 2. Desktop Table View */}
            <div className={viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden lg:block'}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                        <th className="py-3 px-3.5 text-center whitespace-nowrap">Days</th>
                        <th className="py-3 px-3.5 text-center whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedOrders.map((o, idx) => {
                        const clientName = o.clientName || o.customerName || o.customer?.name || '-';
                        const contactNo = o.contactNumber || o.customerMobile || o.customer?.mobile || '';
                        const altContactNo = o.alternateNumber || o.alternateMobile || o.customer?.alternateMobile || '';
                        const siteAddress = o.siteAddress || o.customer?.address || '';
                        const siteLink = o.siteAddressLink || (siteAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress)}` : '');
                        const dieselCode = getDieselShortCode(o);
                        const cableDisplay = getCableDisplay(o);
                        const isWithDiesel = dieselCode === 'WD';
                        const isCompleted = o.billingStatus === 'COMPLETED' || o.status === 'COMPLETED' || o.billingCompleted === true || Boolean(o.billNumber);

                        return (
                          <tr
                            key={o.id || idx}
                            className={`transition-colors group relative ${
                              isCompleted
                                ? 'bg-slate-100/90 text-slate-500 opacity-70 hover:opacity-95'
                                : 'hover:bg-blue-50/40 text-slate-800'
                            }`}
                            style={
                              isCompleted
                                ? {
                                    backgroundImage:
                                      'repeating-linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(241, 245, 249, 0.95) 10px, rgba(226, 232, 240, 0.6) 10px, rgba(226, 232, 240, 0.6) 20px)',
                                  }
                                : undefined
                            }
                          >
                            {/* 1. Sr no. */}
                            <td className="py-3 px-3 text-center text-xs font-bold text-slate-400 whitespace-nowrap">
                              {idx + 1}
                            </td>

                            {/* 2. Order no. */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className={`font-black text-sm ${isCompleted ? 'text-slate-600' : 'text-slate-900 group-hover:text-blue-600 transition-colors'}`}>
                                {o.orderNumber || `#${o.id}`}
                              </span>
                              {o.billNumber && (
                                <div className="text-[11px] text-slate-400 font-mono font-bold">Bill: {o.billNumber}</div>
                              )}
                            </td>

                            {/* 3. Client name */}
                            <td className={`py-3 px-3.5 whitespace-nowrap font-extrabold text-sm sm:text-base ${isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>
                              {clientName}
                            </td>

                            {/* 4. Client contact no */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                              {contactNo ? (
                                <a
                                  href={`tel:${contactNo}`}
                                  className={`inline-flex items-center gap-1.5 font-bold transition-colors ${
                                    isCompleted ? 'text-slate-600 hover:text-slate-800' : 'text-emerald-700 hover:text-emerald-800'
                                  }`}
                                >
                                  <Phone size={13} className={isCompleted ? 'text-slate-400 shrink-0' : 'text-emerald-600 shrink-0'} />
                                  <span>+91 {contactNo}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
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
                                <span className="text-slate-400">-</span>
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
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* 8. Diesel type */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isCompleted
                                    ? 'bg-slate-200/80 text-slate-600 border border-slate-300'
                                    : isWithDiesel
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                                title={isWithDiesel ? 'WD (With Diesel / Owner)' : 'PD (Party Diesel)'}
                              >
                                <Fuel size={12} />
                                <span>{dieselCode}</span>
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

                            {/* 11. Days */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {(() => {
                                const days = getRentalDays(o);
                                return days ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    isCompleted
                                      ? 'bg-slate-200 text-slate-500 border border-slate-300'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    <Calendar size={11} />
                                    {days} {days === 1 ? 'day' : 'days'}
                                  </span>
                                ) : <span className="text-slate-400">-</span>;
                              })()}
                            </td>

                            {/* 12. Action */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {isCompleted ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-500 border border-slate-300 select-none cursor-not-allowed shadow-2xs"
                                  title="Billing is completed — diesel timing entries are locked"
                                >
                                  <Lock size={13} className="text-slate-400" />
                                  <span>Billing Completed (Locked)</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDieselModalTarget(o)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-extrabold shadow-sm shadow-amber-500/25 hover:shadow-md cursor-pointer active:scale-95 transition-all"
                                  title="Add or edit generator operating diesel timings"
                                >
                                  <Fuel size={14} />
                                  <span>Add Diesel Timing</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
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
