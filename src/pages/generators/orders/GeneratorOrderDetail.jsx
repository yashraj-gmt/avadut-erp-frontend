// src/pages/generators/orders/GeneratorOrderDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  FileText,
  Calendar,
  Clock,
  Phone,
  MapPin,
  User,
  Fuel,
  Receipt,
  ExternalLink,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { generatorOrderService } from '@/services/generatorOrderService';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/shared/Button';
import { formatToDMY, parseDateStr } from './mockData';

/* ─── Business Constants ─────────────────────────────────────────────────── */
const CABLE_SIZES = [
  { size: '10',        rate: 10  },
  { size: '16',        rate: 10  },
  { size: '25',        rate: 10  },
  { size: '35',        rate: 15  },
  { size: '50',        rate: 15  },
  { size: '70',        rate: 15  },
  { size: '95',        rate: 20  },
  { size: '120',       rate: 20  },
  { size: '150',       rate: 20  },
  { size: '185',       rate: 30  },
  { size: '240',       rate: 30  },
  { size: '300',       rate: 30  },
  { size: 'Earth Rod', rate: 500 },
  { size: 'Other',     rate: 0   },
];

function getCableRate(size) {
  if (size === undefined || size === null || size === '') return 0;
  const str = String(size).trim();
  const found = CABLE_SIZES.find(c => c.size.toLowerCase() === str.toLowerCase());
  if (found) return found.rate;
  const cleaned = str.replace(/mm²|mm2|sqmm|\s/gi, '');
  const foundClean = CABLE_SIZES.find(c => c.size.toLowerCase() === cleaned.toLowerCase());
  return foundClean ? foundClean.rate : 0;
}

function numberToWords(num) {
  if (!num || num === 0) return 'ZERO ONLY';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
                'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
                'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertHundreds(n) {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
      if (n > 0) str += 'AND ';
    }
    if (n >= 20)  { str += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    if (n > 0)    { str += ones[n] + ' '; }
    return str;
  }

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  let result = '';
  if (intPart >= 10000000) result += convertHundreds(Math.floor(intPart / 10000000)) + 'CRORE ';
  if (intPart >= 100000)   result += convertHundreds(Math.floor((intPart % 10000000) / 100000)) + 'LAKH ';
  if (intPart >= 1000)     result += convertHundreds(Math.floor((intPart % 100000) / 1000)) + 'THOUSAND ';
  result += convertHundreds(intPart % 1000);
  if (decPart > 0) result = result.trim() + ' AND PAISE ' + convertHundreds(decPart);
  return 'RUPEES ' + result.trim() + ' ONLY.';
}

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

const fmtDate = (d) => formatToDMY(d);

const fmtCur = (n) =>
  `₹${(parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtTime = (t) => {
  if (!t) return '';
  const s = String(t).trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
    return s.slice(0, 5);
  }
  return s;
};

/* ─── Status Configurations ─────────────────────────────────────────────── */
const ORDER_STATUS_CFG = {
  PENDING:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-900 border-amber-300 font-bold' },
  CONFIRMED:  { label: 'Confirmed',  cls: 'bg-sky-50 text-sky-900 border-sky-300 font-bold' },
  PROCESSING: { label: 'Processing', cls: 'bg-blue-50 text-blue-900 border-blue-300 font-bold' },
  COMPLETED:  { label: 'Completed',  cls: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold' },
  CANCELLED:  { label: 'Cancelled',  cls: 'bg-rose-50 text-rose-900 border-rose-300 font-bold' },
};

const BILLING_STATUS_CFG = {
  COMPLETED: { label: 'Billed',          cls: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold' },
  PENDING:   { label: 'Pending Billing', cls: 'bg-amber-50 text-amber-900 border-amber-300 font-bold' },
};

function StatusPill({ status, map }) {
  const cfg = map[status] || { label: status, cls: 'bg-slate-100 text-slate-800 border-slate-300 font-bold' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function GeneratorOrderDetail() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    generatorOrderService.getById(id)
      .then(found => setOrder(found))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Derived calculations ── */
  const rentalDays    = useMemo(() => parseRentalDays(order?.functionDate), [order]);
  const withDiesel    = order?.dieselType !== 'PARTY';
  const cableRequired = order?.cableRequired ?? true;

  const calculations = useMemo(() => {
    if (!order) return { items: [], totalAmount: 0 };
    let totalAmount = 0;

    const items = (order.generators || []).map(g => {
      const gKey = g.id ?? g._id;

      // Base Rent
      const rentDay   = parseFloat(g.rate) || 0;
      const genAmount = parseFloat((rentDay * rentalDays).toFixed(2));

      // Diesel Charge
      const dPrice = parseFloat(g.dieselRate) || 0;
      let dieselAmount = 0;
      let totalDieselHours = 0;
      const entries = (g.dieselEntries || []).map(e => {
        const dur = e.durHours != null
          ? Number(e.durHours)
          : (e.duration
              ? (typeof e.duration === 'number'
                  ? e.duration
                  : (() => {
                      const [h, m] = String(e.duration).split(':').map(Number);
                      return (h || 0) + (m || 0) / 60;
                    })()
                )
              : (e.startTime && e.endTime
                  ? (() => {
                      const [h1, m1] = e.startTime.split(':').map(Number);
                      const [h2, m2] = e.endTime.split(':').map(Number);
                      let diffMins = (h2 * 60 + m2) - (h1 * 60 + m1);
                      if (diffMins < 0) diffMins += 24 * 60;
                      return diffMins / 60;
                    })()
                  : 0
                )
            );
        return { ...e, durHours: dur };
      });

      if (withDiesel) {
        entries.forEach(e => { totalDieselHours += e.durHours; });
        dieselAmount = parseFloat((dPrice * totalDieselHours).toFixed(2));
      }

      // Cable Charge
      const cableSize   = g.cableSize || '';
      const cableRate   = (cableRequired && cableSize)
        ? (g.cableRate != null && Number(g.cableRate) > 0 ? parseFloat(g.cableRate) : getCableRate(cableSize))
        : 0;
      const cableAmount = parseFloat((cableRate * rentalDays).toFixed(2));

      // Row Total
      const rowTotal = genAmount + dieselAmount + cableAmount;
      totalAmount += rowTotal;

      return {
        ...g,
        _key: gKey,
        rentDay,
        genAmount,
        entries,
        totalDieselHours,
        dPrice,
        dieselAmount,
        cableSize,
        cableRate,
        cableAmount,
        rowTotal,
      };
    });

    return { items, totalAmount: parseFloat(totalAmount.toFixed(2)) };
  }, [order, rentalDays, withDiesel, cableRequired]);

  const discountVal        = order ? (parseFloat(order.discountAmount) || 0) : 0;
  const taxAmount          = order ? (parseFloat(order.taxAmount) || 0) : 0;
  const otherChargesTotal  = order
    ? (order.otherCharges || []).reduce((sum, oc) => sum + (parseFloat(oc.amount) || 0), 0)
    : 0;
  // ✅ Correct formula: Generator Total + Other Charges - Discount (matches invoice page)
  const netTotal    = order
    ? Math.max(0, parseFloat((calculations.totalAmount + otherChargesTotal - discountVal).toFixed(2)))
    : 0;
  const amountWords = numberToWords(netTotal);

  /* ── Skeleton Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-10 bg-[var(--color-surface-2)] rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl" />
      </div>
    );
  }

  /* ── Not Found State ── */
  if (notFound || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Order Not Found</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          The requested generator order does not exist or may have been deleted.
        </p>
        <Button variant="primary" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const gens = calculations.items;
  const formattedFunctionDate = order.functionDate
    ? (order.functionDate.includes(' to ')
        ? order.functionDate.split(' to ').map(fmtDate).join(' → ')
        : fmtDate(order.functionDate))
    : '-';

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full">

      {/* ── Page Header ── */}
      <PageHeader
        title={`Order #${order.orderNumber || order.id}`}
        subtitle={`Booked on ${fmtDate(order.createdAt)} • Generator Rental`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Generator Orders', href: ROUTES.GENERATOR_ORDERS },
          { label: order.orderNumber || String(order.id) },
        ]}
        actions={
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              icon={<Pencil size={14} />}
              className="flex-1 sm:flex-none font-bold"
              disabled={order.billingStatus === 'COMPLETED'}
              title={order.billingStatus === 'COMPLETED' ? 'Order cannot be edited after billing is completed' : 'Edit Order'}
              onClick={() => {
                if (order.billingStatus !== 'COMPLETED') {
                  navigate(ROUTES.GENERATOR_ORDER_EDIT.replace(':id', order.id));
                }
              }}
            >
              Edit Order
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Receipt size={14} />}
              className="flex-1 sm:flex-none font-bold"
              onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', order.id))}
            >
              {order.billingStatus === 'COMPLETED' ? 'View Invoice' : 'Invoice & Billing'}
            </Button>
          </div>
        }
      />

      {/* ── Overview Cards Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Status & Specs */}
        <div className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Status</span>
            <StatusPill status={order.orderStatus} map={ORDER_STATUS_CFG} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={order.billingStatus || 'PENDING'} map={BILLING_STATUS_CFG} />
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${withDiesel ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-emerald-50 text-emerald-900 border-emerald-300'}`}>
              {withDiesel ? '⛽ With Diesel' : '🟢 Party Diesel'}
            </span>
          </div>
        </div>

        {/* Card 2: Function Schedule */}
        <div className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Schedule</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
              <Calendar size={11} /> {rentalDays} Day{rentalDays !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={formattedFunctionDate}>
            {formattedFunctionDate}
          </div>
        </div>

        {/* Card 3: Client Details */}
        <div className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Client</span>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 truncate" title={order.clientName}>
              {order.clientName || '-'}
            </div>
            {order.contactNumber && (
              <a
                href={`tel:${order.contactNumber}`}
                className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <Phone size={11} /> {order.contactNumber}
              </a>
            )}
          </div>
        </div>

        {/* Card 4: Total Amount */}
        <div className="p-4 bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-[var(--radius-xl)] shadow-xs flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-blue-100 text-xs font-bold uppercase tracking-wider">
            <span>Net Amount</span>
            <Receipt size={14} className="opacity-80" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
            {fmtCur(netTotal)}
          </div>
          <div className="text-[11px] font-semibold text-blue-100 truncate">
            {gens.length} Generator{gens.length !== 1 ? 's' : ''} • {order.billingStatus === 'COMPLETED' ? 'Billed' : 'Pending billing'}
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Left Column (2 Cols): Generator Equipment & Breakdown */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Section: Equipment Breakdown */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-xs overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-blue-600 fill-blue-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Generators & Rent Breakdown
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900">
                {gens.length} Unit{gens.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
              {gens.map((g, gi) => (
                <div
                  key={g._key || gi}
                  className="rounded-[var(--radius-lg)] border-2 border-blue-200/80 bg-[var(--color-surface)] overflow-hidden shadow-2xs"
                >
                  {/* Generator Header Banner (Blue Theme & High Contrast) */}
                  <div className="flex items-center justify-between px-3.5 sm:px-5 py-3.5 bg-blue-50/90 border-b-2 border-blue-200 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                        {gi + 1}
                      </span>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="font-black text-sm sm:text-base text-blue-950 truncate block">
                          {g.generatorName}
                        </span>
                        {g.generatorCode && (
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100/90 text-blue-900 border border-blue-300/80">
                            Code: {g.generatorCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-black text-base sm:text-lg text-blue-950 shrink-0">
                      {fmtCur(g.rowTotal)}
                    </span>
                  </div>

                  {/* Desktop Table View (>= 768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">Item / Description</th>
                          <th className="py-2.5 px-4 text-right">Rate</th>
                          <th className="py-2.5 px-4 text-center">Qty / Duration</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* Base Rent Row */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <span className="inline-flex items-center gap-1.5">
                              <Zap size={14} className="text-amber-500 fill-amber-500" /> Generator Base Rent
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                            {fmtCur(g.rentDay)} / day
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-blue-950">
                            {fmtCur(g.genAmount)}
                          </td>
                        </tr>

                        {/* Diesel Rows */}
                        {withDiesel && (
                          <tr className="bg-amber-50/60 border-t border-amber-200/80">
                            <td className="py-3 px-4">
                              <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                                <Fuel size={14} className="text-amber-600 shrink-0" /> Diesel Consumption
                              </div>
                              {g.entries && g.entries.length > 0 ? (
                                <div className="mt-1.5 space-y-1 pl-4">
                                  {g.entries.map((de, di) => (
                                    <div key={di} className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                      <span>• {de.entryDate ? fmtDate(de.entryDate) : (de.date ? fmtDate(de.date) : 'Entry')}</span>
                                      {de.startTime && de.endTime && (
                                        <span className="font-mono font-bold text-slate-900">
                                          ({fmtTime(de.startTime)} – {fmtTime(de.endTime)})
                                        </span>
                                      )}
                                      <span className="font-mono font-extrabold text-slate-950 bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded text-[11px]">
                                        = {Number(de.durHours || 0).toFixed(1)} hrs
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 pl-4 block mt-1 font-medium">No diesel runtime logged</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                              {fmtCur(g.dPrice)} / hr
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-black text-slate-900">
                              {g.totalDieselHours.toFixed(1)} hrs
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-950">
                              {fmtCur(g.dieselAmount)}
                            </td>
                          </tr>
                        )}

                        {/* Cable Row */}
                        {g.cableSize && cableRequired && (
                          <tr className="bg-blue-50/40 border-t border-blue-200/60">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              🔌 Cable {g.cableSize}{g.cableSize !== 'Earth Rod' && g.cableSize !== 'Other' ? ' mm²' : ''}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-blue-950">
                              {fmtCur(g.cableRate)} / day
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                              {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-blue-950">
                              {fmtCur(g.cableAmount)}
                            </td>
                          </tr>
                        )}

                        {/* Subtotal Row */}
                        <tr className="bg-blue-50/80 font-bold text-xs border-t-2 border-blue-200">
                          <td colSpan={3} className="py-2.5 px-4 text-right uppercase tracking-wider text-blue-950 font-extrabold">
                            Generator Subtotal
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-base text-blue-950">
                            {fmtCur(g.rowTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Breakdown (< 768px, perfect for 320px) */}
                  <div className="block md:hidden p-3.5 space-y-3">
                    {/* Base Rent Line */}
                    <div className="flex items-start justify-between text-xs py-1">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Zap size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                          <span>Base Rent</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 pl-5 mt-0.5">
                          {rentalDays} day{rentalDays !== 1 ? 's' : ''} × {fmtCur(g.rentDay)}/day
                        </div>
                      </div>
                      <span className="font-mono font-black text-blue-950 shrink-0">
                        {fmtCur(g.genAmount)}
                      </span>
                    </div>

                    {/* Diesel Line */}
                    {withDiesel && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <div className="flex items-start justify-between py-1">
                          <div className="min-w-0 pr-2">
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <Fuel size={13} className="text-amber-600 shrink-0" />
                              <span>Diesel Charges</span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-700 pl-5 mt-0.5">
                              {g.totalDieselHours.toFixed(1)} hrs @ {fmtCur(g.dPrice)}/hr
                            </div>
                          </div>
                          <span className="font-mono font-black text-slate-950 shrink-0">
                            {fmtCur(g.dieselAmount)}
                          </span>
                        </div>

                        {/* Diesel Logs Badges */}
                        {g.entries && g.entries.length > 0 && (
                          <div className="mt-2 pl-4 space-y-1.5">
                            {g.entries.map((de, di) => (
                              <div
                                key={di}
                                className="text-[11px] p-2 rounded-lg bg-amber-100/90 border border-amber-300 text-slate-900 flex flex-wrap items-center justify-between gap-1 font-bold"
                              >
                                <div className="flex items-center gap-1 font-bold text-slate-900">
                                  <Calendar size={11} className="text-amber-600 shrink-0" />
                                  <span>{de.entryDate ? fmtDate(de.entryDate) : (de.date ? fmtDate(de.date) : `Entry ${di + 1}`)}</span>
                                  {de.startTime && de.endTime && (
                                    <span className="text-[10px] text-slate-900 font-mono font-extrabold">
                                      ({fmtTime(de.startTime)}–{fmtTime(de.endTime)})
                                    </span>
                                  )}
                                </div>
                                <span className="font-black text-[10px] bg-amber-300 text-slate-950 px-1.5 py-0.5 rounded">
                                  {Number(de.durHours || 0).toFixed(1)} hrs
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cable Line */}
                    {g.cableSize && cableRequired && (
                      <div className="pt-2 border-t border-slate-200 flex items-start justify-between text-xs py-1">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>🔌 Cable ({g.cableSize}{g.cableSize !== 'Earth Rod' && g.cableSize !== 'Other' ? ' mm²' : ''})</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 pl-5 mt-0.5">
                            {rentalDays} day{rentalDays !== 1 ? 's' : ''} × {fmtCur(g.cableRate)}/day
                          </div>
                        </div>
                        <span className="font-mono font-black text-blue-950 shrink-0">
                          {fmtCur(g.cableAmount)}
                        </span>
                      </div>
                    )}

                    {/* Subtotal Pill */}
                    <div className="pt-2.5 border-t-2 border-blue-200 flex items-center justify-between bg-blue-50 -mx-3.5 -mb-3.5 p-3 rounded-b-[var(--radius-lg)]">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-950">Subtotal</span>
                      <span className="text-sm font-black text-blue-950 font-mono">{fmtCur(g.rowTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Event Logistics & Location */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <MapPin size={18} className="text-blue-600" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Site Location & Logistics
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Site / Installation Address
                </label>
                <p className="text-xs sm:text-sm text-slate-900 font-bold leading-relaxed">
                  {order.siteAddress || 'No site address provided.'}
                </p>
                {order.siteAddressLink && (
                  <a
                    href={order.siteAddressLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-extrabold mt-2 hover:underline"
                  >
                    <ExternalLink size={13} /> Open in Google Maps
                  </a>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Assigned Operator
                </label>
                <div className="text-xs sm:text-sm text-slate-900 font-bold">
                  {order.operatorName ? (
                    <div>
                      <div className="font-extrabold text-slate-950">{order.operatorName}</div>
                      {order.operatorMobile && (
                        <a
                          href={`tel:${order.operatorMobile}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-700 font-bold hover:underline mt-1"
                        >
                          <Phone size={12} /> {order.operatorMobile}
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic font-medium">No operator assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks */}
            {(order.remarks || order.notes) && (
              <div className="pt-3 border-t border-[var(--color-border)]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Order Remarks / Special Notes
                </label>
                <div className="p-3 rounded-lg bg-blue-50/50 text-xs sm:text-sm text-slate-900 font-bold italic leading-relaxed border border-blue-200">
                  "{order.remarks || order.notes}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Consolidated Billing & Summary */}
        <div className="space-y-4 sm:space-y-6">

          {/* Payment & Billing Summary Card */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-xs overflow-hidden sticky top-4">
            <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={17} className="text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Billing Summary</h3>
              </div>
              <StatusPill status={order.billingStatus || 'PENDING'} map={BILLING_STATUS_CFG} />
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {order.billNumber && (
                <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border)] pb-2.5">
                  <span className="text-slate-600 font-bold">Bill Reference</span>
                  <span className="font-mono font-bold text-slate-950">#{order.billNumber}</span>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700">
                <span className="font-bold">Gross Equipment Total</span>
                <span className="font-mono font-black text-slate-950">{fmtCur(calculations.totalAmount)}</span>
              </div>

              {/* Other Charges */}
              {otherChargesTotal > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-indigo-600 font-bold">
                  <span>Other Charges</span>
                  <span className="font-mono font-black">+ {fmtCur(otherChargesTotal)}</span>
                </div>
              )}

              {/* Discount */}
              {discountVal > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-rose-600 font-bold">
                  <span>Discount Applied</span>
                  <span className="font-mono font-black">- {fmtCur(discountVal)}</span>
                </div>
              )}

              {/* Tax */}
              {taxAmount > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-bold">
                  <span>Tax / GST</span>
                  <span className="font-mono font-black text-slate-950">+ {fmtCur(taxAmount)}</span>
                </div>
              )}

              {/* Net Total Box */}
              <div className="pt-2">
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100 block">
                      Net Payable
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono tracking-tight text-white">
                      {fmtCur(netTotal)}
                    </span>
                  </div>
                  <CheckCircle2 size={24} className="text-blue-200 opacity-90" />
                </div>
              </div>

              {/* Amount in words (Theme-matched Blue card with crisp dark text) */}
              {amountWords && (
                <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-200 text-xs font-black text-blue-950 leading-snug tracking-wide uppercase shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block mb-1">
                    Amount in words:
                  </span>
                  {amountWords}
                </div>
              )}

              {/* Invoice Action Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  icon={<Receipt size={15} />}
                  onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', order.id))}
                  className="font-bold shadow-xs py-2.5"
                >
                  {order.billingStatus === 'COMPLETED' ? 'Open Invoice' : 'Generate Bill & Invoice'}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Client & Contact Card */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-xs p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Client & Contact Summary
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Client Name</span>
                <span className="font-black text-slate-950">{order.clientName || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Primary Mobile</span>
                {order.contactNumber ? (
                  <a href={`tel:${order.contactNumber}`} className="font-mono font-black text-blue-700 hover:underline">
                    {order.contactNumber}
                  </a>
                ) : (
                  <span className="text-slate-400 font-bold">-</span>
                )}
              </div>
              {order.alternateMobile && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-bold">Alt. Mobile</span>
                  <a href={`tel:${order.alternateMobile}`} className="font-mono font-black text-blue-700 hover:underline">
                    {order.alternateMobile}
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-[var(--color-border)]">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={15} />}
          onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
          className="w-full sm:w-auto font-bold"
        >
          Back to Orders
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            icon={<Pencil size={15} />}
            disabled={order.billingStatus === 'COMPLETED'}
            title={order.billingStatus === 'COMPLETED' ? 'Order cannot be edited after billing is completed' : 'Edit Order'}
            onClick={() => {
              if (order.billingStatus !== 'COMPLETED') {
                navigate(ROUTES.GENERATOR_ORDER_EDIT.replace(':id', order.id));
              }
            }}
            className="flex-1 sm:flex-none font-bold"
          >
            Edit Order
          </Button>
          <Button
            variant="primary"
            icon={<Receipt size={15} />}
            onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', order.id))}
            className="flex-1 sm:flex-none font-bold"
          >
            {order.billingStatus === 'COMPLETED' ? 'View Invoice' : 'Go to Billing'}
          </Button>
        </div>
      </div>

    </div>
  );
}
