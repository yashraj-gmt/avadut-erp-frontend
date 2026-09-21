// src/pages/dashboard/components/Last7DaysCompletedOrders.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Search,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { generatorOrderService } from '@/services/generatorOrderService';
import { mockOrders, formatRangeToDMY, parseDateStr } from '@/pages/generators/orders/mockData';

const PAGE_SIZE = 10;

/** Extract start and end Date objects from order function date fields */
const getFunctionDates = (o) => {
  if (!o) return { fFrom: null, fTo: null };
  const fFrom = o.functionDateFrom
    ? parseDateStr(o.functionDateFrom)
    : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[0]) : null);
  const fTo = o.functionDateTo
    ? parseDateStr(o.functionDateTo)
    : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[1] || o.functionDate) : null);
  return { fFrom, fTo: fTo || fFrom };
};

/** Determine order status and label (Ongoing, Completed, Confirmed, Booked) */
const getOrderStatusInfo = (o) => {
  const isCompleted = o.orderStatus === 'COMPLETED' || o.status === 'COMPLETED';
  if (isCompleted) {
    return { label: 'Completed', type: 'completed' };
  }

  const { fFrom, fTo } = getFunctionDates(o);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  if (fFrom && fTo) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate()).getTime();
    const toTime = new Date(fTo.getFullYear(), fTo.getMonth(), fTo.getDate()).getTime();
    if (fromTime <= todayEnd && toTime >= todayStart) {
      return { label: 'Ongoing', type: 'ongoing' };
    }
  }

  if (o.orderStatus === 'IN_PROGRESS' || o.status === 'IN_PROGRESS') {
    return { label: 'Ongoing', type: 'ongoing' };
  }

  if (o.orderStatus === 'CONFIRMED' || o.bookingStatus === 'Confirmed') {
    return { label: 'Confirmed', type: 'confirmed' };
  }

  return { label: o.bookingStatus || 'Booked', type: 'booked' };
};

/** Checks if an order is ongoing or has a function date / completion within the last 7 days */
const isOrderRelevant = (o) => {
  if (!o) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const sevenDaysAgoTime = sevenDaysAgo.getTime();

  const bufferTomorrow = new Date();
  bufferTomorrow.setDate(now.getDate() + 1);
  bufferTomorrow.setHours(23, 59, 59, 999);
  const bufferTomorrowTime = bufferTomorrow.getTime();

  // 1. Ongoing order (today falls within function date range)
  const { fFrom, fTo } = getFunctionDates(o);
  if (fFrom && fTo) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate()).getTime();
    const toTime = new Date(fTo.getFullYear(), fTo.getMonth(), fTo.getDate()).getTime();

    // Ongoing today
    if (fromTime <= todayEnd && toTime >= todayStart) {
      return true;
    }
    // Function date overlaps with the last 7 days
    if (fromTime <= bufferTomorrowTime && toTime >= sevenDaysAgoTime) {
      return true;
    }
  } else if (fFrom) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate()).getTime();
    if (fromTime >= sevenDaysAgoTime && fromTime <= bufferTomorrowTime) {
      return true;
    }
  }

  // 2. Explicitly in progress status
  if (o.orderStatus === 'IN_PROGRESS' || o.status === 'IN_PROGRESS') {
    return true;
  }

  // 3. Completed or updated within last 7 days
  const otherDates = [o.returnedAt, o.updatedAt, o.createdAt];
  for (const d of otherDates) {
    if (!d) continue;
    const p = typeof d === 'string' ? parseDateStr(d) || new Date(d) : new Date(d);
    if (p && !isNaN(p.getTime())) {
      const pTime = p.getTime();
      if (pTime >= sevenDaysAgoTime && pTime <= bufferTomorrowTime) {
        return true;
      }
    }
  }

  return false;
};

export default function Last7DaysCompletedOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch all orders (ongoing, completed, confirmed, etc.) from API, fallback to mock data
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch all orders without restricting to completed only
      const res = await generatorOrderService.getAll('', '', 0, 100, 'createdAt', 'desc');
      let fetched = res?.content || [];

      // Fallback to mock data if API returned empty (e.g. offline dev)
      if (fetched.length === 0 && mockOrders && mockOrders.length > 0) {
        fetched = mockOrders;
      }

      setOrders(fetched);
    } catch (err) {
      console.warn('Backend API request failed, loading orders from mock data:', err);
      setOrders(mockOrders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders: ongoing or function date / completion within last 7 days & search query
  const filteredOrders = useMemo(() => {
    const matched = orders.filter((o) => {
      if (!isOrderRelevant(o)) return false;

      // Search match
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const client = (o.clientName || '').toLowerCase();
        const orderNo = (o.orderNumber || `#${o.id}` || '').toLowerCase();
        const contact = (o.contactNumber || '').toLowerCase();
        const address = (o.siteAddress || '').toLowerCase();
        const operator = (o.operatorName || '').toLowerCase();
        const gens = (o.generators || [])
          .map((g) => (g.generatorName || '').toLowerCase())
          .join(' ');

        return (
          client.includes(query) ||
          orderNo.includes(query) ||
          contact.includes(query) ||
          address.includes(query) ||
          operator.includes(query) ||
          gens.includes(query)
        );
      }

      return true;
    });

    // Sort: Ongoing orders first, then by function date / updated date descending
    return matched.sort((a, b) => {
      const aStatus = getOrderStatusInfo(a);
      const bStatus = getOrderStatusInfo(b);

      if (aStatus.type === 'ongoing' && bStatus.type !== 'ongoing') return -1;
      if (bStatus.type === 'ongoing' && aStatus.type !== 'ongoing') return 1;

      const aDates = getFunctionDates(a);
      const bDates = getFunctionDates(b);
      const aTime = aDates.fFrom ? aDates.fFrom.getTime() : 0;
      const bTime = bDates.fFrom ? bDates.fFrom.getTime() : 0;
      return bTime - aTime;
    });
  }, [orders, search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Date range label for last 7 days
  const dateRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    const fmt = (d) =>
      `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 border-b border-slate-200/90 bg-gradient-to-r from-slate-50/70 via-white to-blue-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Generator Order Management
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <Calendar size={12} className="text-slate-500" />
                {dateRangeLabel}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Last 7 Days &amp; Ongoing Orders</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </h2>
          </div>

          {/* Action Tools: Search, Refresh, View All in Orders */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              title="Refresh orders"
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Jump to Generator Order Management */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-xs"
            >
              <span>Manage All Orders</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Search Bar & Result Count */}
        <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by order #, client, generator, operator, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 self-end sm:self-center">
            Showing <strong className="text-slate-700">{pagedOrders.length}</strong> of{' '}
            <strong className="text-slate-700">{filteredOrders.length}</strong> orders
          </div>
        </div>
      </div>

      {/* ── Table (Desktop) ────────────────────────────────────────────── */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-600 tracking-wider">
              <th className="py-3 px-3 text-center w-14 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-xs">
                Sr. No.
              </th>
              <th className="py-3 px-3.5 whitespace-nowrap">Generator Name</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Order No.</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Client Name</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Contact</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Site Address</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Diesel Type</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Cable</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Operator Name</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Function Date</th>
              <th className="py-3 px-3 text-center w-24 sticky right-0 bg-slate-50 z-10 border-l border-slate-200 shadow-xs">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-3 text-center">
                    <div className="h-4 w-6 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="h-5 w-12 bg-slate-200 rounded-full mx-auto" />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="h-5 w-10 bg-slate-200 rounded-full mx-auto" />
                  </td>
                  <td className="py-4 px-3.5">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="h-4 w-24 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="h-7 w-7 bg-slate-200 rounded-lg mx-auto" />
                  </td>
                </tr>
              ))
            ) : pagedOrders.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ClipboardCheck size={26} />
                    </div>
                    <div className="font-semibold text-slate-700 text-sm">
                      {search ? 'No matching orders found' : 'No ongoing or recent orders in the last 7 days'}
                    </div>
                    <p className="text-xs text-slate-400">
                      {search
                        ? 'Try modifying your search keywords or clear the filter.'
                        : 'No generator orders found for this period.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedOrders.map((o, idx) => {
                const gens = o.generators || [];
                const firstName = gens[0]?.generatorName || '—';
                const extraGens = gens.length > 1 ? ` +${gens.length - 1} more` : '';
                const isWithDiesel = o.withDiesel !== false && o.dieselType !== 'PARTY';
                const hasCable = o.cableRequired !== false;
                const srNo = (page - 1) * PAGE_SIZE + idx + 1;
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                const statusInfo = getOrderStatusInfo(o);

                return (
                  <tr
                    key={o.id}
                    className={`${rowBg} hover:bg-blue-50/40 transition-colors duration-100`}
                  >
                    {/* 1. Sr. No. (Sticky Left) */}
                    <td className={`py-3 px-3 text-center text-slate-500 font-medium sticky left-0 ${rowBg} z-10 border-r border-slate-200 shadow-xs`}>
                      {srNo}
                    </td>

                    {/* 2. Generator Name */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-800 whitespace-nowrap">
                        {firstName}
                      </div>
                      {extraGens && (
                        <div
                          className="text-[11px] font-semibold text-blue-600 mt-0.5 whitespace-nowrap cursor-help"
                          title={gens.map((g) => g.generatorName).join(', ')}
                        >
                          {extraGens}
                        </div>
                      )}
                    </td>

                    {/* 3. Order No. */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono text-[12px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {o.orderNumber || `#${o.id}`}
                      </span>
                    </td>

                    {/* 4. Client Name */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-900">
                      {o.clientName || '—'}
                    </td>

                    {/* 5. Contact */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                      {o.contactNumber ? (
                        <a
                          href={`tel:${o.contactNumber}`}
                          className="hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                        >
                          <Phone size={11} className="text-slate-400" />
                          <span>{o.contactNumber}</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* 6. Site Address */}
                    <td className="py-3 px-3.5">
                      <div
                        className="max-w-[170px] truncate text-slate-600"
                        title={o.siteAddress || '—'}
                      >
                        {o.siteAddressLink ? (
                          <a
                            href={o.siteAddressLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <MapPin size={12} className="shrink-0 text-blue-500" />
                            <span className="truncate">{o.siteAddress || 'View on Map'}</span>
                          </a>
                        ) : (
                          o.siteAddress || '—'
                        )}
                      </div>
                    </td>

                    {/* 7. Diesel Type [PD / WD] */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        title={isWithDiesel ? 'WD (With Diesel)' : 'PD (Party Diesel)'}
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide border ${
                          isWithDiesel
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isWithDiesel ? 'WD' : 'PD'}
                      </span>
                    </td>

                    {/* 8. Cable (Yes/No) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          hasCable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {hasCable ? 'Yes' : 'No'}
                      </span>
                    </td>

                    {/* 9. Operator Name */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 font-medium">
                      {o.operatorName || '—'}
                    </td>

                    {/* 10. Function Date */}
                    <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                      {formatRangeToDMY(
                        o.functionDate ||
                          (o.functionDateFrom && o.functionDateTo
                            ? `${o.functionDateFrom} to ${o.functionDateTo}`
                            : o.functionDateFrom)
                      ) || '—'}
                    </td>

                    {/* 11. Action: View Only (Sticky Right) */}
                    <td className={`py-3 px-3 text-center sticky right-0 ${rowBg} z-10 border-l border-slate-200 shadow-xs`}>
                      <button
                        type="button"
                        id={`btn-view-order-${o.id}`}
                        onClick={() =>
                          navigate(
                            ROUTES.GENERATOR_ORDER_DETAIL.replace(':id', o.id)
                          )
                        }
                        title="View Order Details"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-2xs group"
                      >
                        <Eye size={15} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View (Small screens) ──────────────────────────── */}
      <div className="md:hidden divide-y divide-slate-200">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-xs">Loading orders...</div>
        ) : pagedOrders.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No orders found for this period.
          </div>
        ) : (
          pagedOrders.map((o) => {
            const gens = o.generators || [];
            const firstName = gens[0]?.generatorName || '—';
            const extraGens = gens.length > 1 ? ` +${gens.length - 1} more` : '';
            const isWithDiesel = o.withDiesel !== false && o.dieselType !== 'PARTY';
            const hasCable = o.cableRequired !== false;
            const statusInfo = getOrderStatusInfo(o);

            return (
              <div key={o.id} className="p-4 space-y-2.5 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {o.orderNumber || `#${o.id}`}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {firstName} {extraGens}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(ROUTES.GENERATOR_ORDER_DETAIL.replace(':id', o.id))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Client</span>
                    <span className="font-medium text-slate-700">{o.clientName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact</span>
                    <span className="text-slate-700">{o.contactNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Operator</span>
                    <span className="text-slate-700">{o.operatorName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Function Date</span>
                    <span className="text-slate-700">
                      {formatRangeToDMY(o.functionDate || o.functionDateFrom) || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isWithDiesel
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    Diesel: {isWithDiesel ? 'WD' : 'PD'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      hasCable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    Cable: {hasCable ? 'Yes' : 'No'}
                  </span>
                  {o.siteAddress && (
                    <span
                      className="text-[11px] text-slate-500 truncate max-w-[140px]"
                      title={o.siteAddress}
                    >
                      📍 {o.siteAddress}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <strong className="text-slate-800">{page}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
