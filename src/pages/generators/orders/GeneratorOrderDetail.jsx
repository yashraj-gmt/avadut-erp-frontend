// src/pages/generators/orders/GeneratorOrderDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { generatorOrderService } from '@/services/generatorOrderService';
import {
  formatToDMY,
  formatRangeToDMY,
  parseDateStr,
  formatDurationDisplay,
} from './mockData';

/* ─── Pure utility functions (no mock data dependency) ───────────────────── */

/** Cable sizes with per-day rates — these are business-rule constants, not mock data */
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
];

/** Returns the per-day rate for a given cable size string */
function getCableRate(size) {
  const found = CABLE_SIZES.find(c => c.size === size);
  return found ? found.rate : 0;
}

/** Calculate HH:MM duration between two HH:MM time strings (handles next-day wrap) */
function calcDuration(start, end) {
  if (!start || !end) return '00:00';
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  let totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins < 0) totalMins += 24 * 60;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Converts a number to Indian Rupees in words (for invoice amount-in-words display) */
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

/* ─── Date / currency helpers ────────────────────────────────────────────── */
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

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Invoice: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
      <path d="M16 8H8m8 4H8"/>
    </svg>
  ),
  User: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Zap: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Calculator: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M8 6h8M8 10h2m4 0h2M8 14h2m4 0h2M8 18h2m4 0h2"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  FileText: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Phone: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Receipt: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 0 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Fuel: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 22h12M4 9h10M4 2h10a1 1 0 0 1 1 1v18H3V3a1 1 0 0 1 1-1z"/>
      <path d="M19 2l2 2v10l-2 2"/>
    </svg>
  ),
  Cable: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M20 9l-3 3 3 3"/>
      <path d="M6 12h12M12 6v12"/>
    </svg>
  ),
  NotFound: () => (
    <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes gd2-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gd2-pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }

  .gd2-page {
    min-height:100vh;
    background:var(--color-bg);
    font-family:'DM Sans','Segoe UI',sans-serif;
    padding:28px 32px;
  }

  /* ── Header ── */
  .gd2-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
  .gd2-header-left { display:flex; align-items:flex-start; gap:14px; }
  .gd2-back-btn {
    display:flex; align-items:center; justify-content:center;
    width:38px; height:38px; border-radius:10px;
    border:1.5px solid var(--color-border); background:var(--color-surface);
    cursor:pointer; color:var(--color-text-muted); transition:all .2s; flex-shrink:0; margin-top:2px;
  }
  .gd2-back-btn:hover { border-color:var(--color-primary); color:var(--color-primary); background:var(--color-primary-50); }
  .gd2-page-title { font-size:clamp(18px,3vw,22px); font-weight:700; color:var(--color-text); letter-spacing:-.4px; margin:0 0 3px; }
  .gd2-breadcrumb { font-size:13px; color:var(--color-text-subtle); }
  .gd2-breadcrumb a { color:var(--color-primary); text-decoration:none; }
  .gd2-edit-btn {
    display:inline-flex; align-items:center; gap:7px;
    background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark));
    color:#fff; border:none; border-radius:var(--radius-md);
    padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer;
    box-shadow:var(--shadow-md); transition:all .2s; font-family:inherit;
  }
  .gd2-edit-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,.35); }
  .gd2-invoice-btn {
    display:inline-flex; align-items:center; gap:7px;
    background:var(--color-surface); color:var(--color-primary);
    border:1.5px solid var(--color-primary); border-radius:var(--radius-md);
    padding:9px 16px; font-size:14px; font-weight:600; cursor:pointer;
    transition:all .2s; font-family:inherit;
  }
  .gd2-invoice-btn:hover { background:var(--color-primary-50); }

  /* ── Banner ── */
  .gd2-banner {
    background:linear-gradient(135deg,var(--color-primary) 0%,var(--color-primary-dark) 100%);
    border-radius:var(--radius-xl); padding:20px 28px;
    display:flex; align-items:center; justify-content:space-between;
    flex-wrap:wrap; gap:12px; margin-bottom:20px;
    box-shadow:0 8px 24px rgba(37,99,235,.25);
    animation:gd2-fadein .3s ease;
  }
  .gd2-banner-id { font-size:24px; font-weight:800; color:#fff; letter-spacing:.5px; font-family:monospace; }
  .gd2-banner-sub { font-size:11px; font-weight:600; color:rgba(255,255,255,.6); text-transform:uppercase; letter-spacing:.6px; margin-bottom:4px; }
  .gd2-banner-meta { font-size:13px; color:rgba(255,255,255,.7); display:flex; align-items:center; gap:6px; }
  .gd2-banner-statuses { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }

  /* ── Cards ── */
  .gd2-card {
    background:var(--color-surface); border-radius:var(--radius-xl);
    box-shadow:var(--shadow-sm); border:1px solid var(--color-border);
    margin-bottom:20px; overflow:hidden; animation:gd2-fadein .3s ease;
  }
  .gd2-card-header {
    display:flex; align-items:center; gap:10px;
    padding:15px 24px; background:var(--color-surface-2);
    border-bottom:1.5px solid var(--color-border);
  }
  .gd2-card-icon { display:flex; color:var(--color-primary); }
  .gd2-card-title { font-size:14px; font-weight:700; color:var(--color-text); margin:0; }
  .gd2-card-body { padding:24px; }

  /* ── Detail fields ── */
  .gd2-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px 24px; }
  .gd2-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px 24px; }
  .gd2-field label { font-size:11px; font-weight:700; color:var(--color-text-subtle); text-transform:uppercase; letter-spacing:.5px; display:block; }
  .gd2-field-val { font-size:14px; font-weight:600; color:var(--color-text); margin-top:6px; display:flex; align-items:center; gap:7px; }
  .gd2-field-val.muted { color:var(--color-text-muted); font-weight:500; }

  /* ── Generator table ── */
  .gd2-gen-table { width:100%; border-collapse:collapse; }
  .gd2-gen-th {
    padding:10px 14px; text-align:left; font-size:11px; font-weight:700;
    color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.5px;
    background:var(--color-surface-2); border-bottom:1.5px solid var(--color-border);
  }
  .gd2-gen-td { padding:13px 14px; font-size:13.5px; color:var(--color-text); border-bottom:1px solid var(--color-surface-2); vertical-align:middle; }
  .gd2-gen-tr:last-child .gd2-gen-td { border-bottom:none; }
  .gd2-gen-tr:hover .gd2-gen-td { background:rgba(37,99,235,.03); }

  /* ── Duration chip ── */
  .gd2-dur-chip {
    display:inline-flex; align-items:center; gap:6px;
    background:linear-gradient(135deg,var(--color-primary-50),var(--color-primary-100));
    border:1.5px solid var(--color-primary-100); border-radius:8px;
    padding:5px 12px; font-size:14px; font-weight:800; color:var(--color-primary-dark);
  }

  /* ── Rent calculation section ── */
  .gd2-calc-table { width:100%; border-collapse:collapse; }
  .gd2-calc-th {
    padding:10px 14px; text-align:left; font-size:11px; font-weight:700;
    color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.5px;
    background:var(--color-surface-2); border-bottom:1.5px solid var(--color-border);
  }
  .gd2-calc-th:last-child, .gd2-calc-td:last-child { text-align:right; }
  .gd2-calc-td { padding:11px 14px; font-size:13.5px; color:var(--color-text); border-bottom:1px solid var(--color-surface-2); vertical-align:middle; }
  .gd2-calc-tr-diesel .gd2-calc-td { background:#fffbeb; color:#78350f; font-size:13px; }
  .gd2-calc-tr-cable  .gd2-calc-td { background:#eff6ff; color:#1e3a8a; font-size:13px; }
  .gd2-calc-tr-gen > .gd2-calc-td { font-weight:600; }

  /* ── Summary panel ── */
  .gd2-summary-panel {
    background:var(--color-surface-2); border-radius:var(--radius-lg);
    border:1.5px solid var(--color-border); overflow:hidden;
  }
  .gd2-summary-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 20px; border-bottom:1px solid var(--color-border);
    font-size:14px; color:var(--color-text-muted);
  }
  .gd2-summary-row:last-child { border-bottom:none; }
  .gd2-summary-row.total {
    background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark));
    color:#fff; font-weight:800; font-size:16px; padding:16px 20px;
  }
  .gd2-summary-val { font-weight:700; color:var(--color-text); font-family:monospace; }
  .gd2-summary-row.total .gd2-summary-val { color:#fff; font-size:18px; }

  /* ── Diesel entries sub-table ── */
  .gd2-diesel-block {
    margin-top:10px; border:1px solid #fde68a; border-radius:8px; overflow:hidden;
  }
  .gd2-diesel-hdr {
    background:#fef3c7; padding:7px 12px; font-size:11px; font-weight:700;
    color:#78350f; text-transform:uppercase; letter-spacing:.4px;
    display:flex; align-items:center; gap:6px;
  }
  .gd2-diesel-row {
    display:grid; grid-template-columns:1fr 1fr 1fr 1fr 1fr; gap:0;
    border-bottom:1px solid #fde68a; font-size:12px; color:#78350f;
  }
  .gd2-diesel-row:last-child { border-bottom:none; }
  .gd2-diesel-row > div { padding:7px 10px; border-right:1px solid #fde68a; }
  .gd2-diesel-row > div:last-child { border-right:none; font-weight:700; font-family:monospace; }
  .gd2-diesel-hdr-row {
    display:grid; grid-template-columns:1fr 1fr 1fr 1fr 1fr; gap:0;
    background:#fef9c3; font-size:10.5px; font-weight:700; color:#92400e;
    text-transform:uppercase; letter-spacing:.4px; border-bottom:1px solid #fde68a;
  }
  .gd2-diesel-hdr-row > div { padding:5px 10px; border-right:1px solid #fde68a; }
  .gd2-diesel-hdr-row > div:last-child { border-right:none; }

  /* ── Mobile generator cards ── */
  .gd2-gen-cards { display:none; }
  .gd2-gen-mc {
    border:1.5px solid var(--color-border); border-radius:var(--radius-lg);
    padding:14px 16px; margin-bottom:10px;
  }
  .gd2-gen-mc:last-child { margin-bottom:0; }
  .gd2-gen-mc-hdr { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
  .gd2-gen-num { width:22px; height:22px; border-radius:50%; background:var(--color-primary); color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .gd2-gen-mc-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 16px; }
  .gd2-gen-mc-f label { font-size:10px; font-weight:700; color:var(--color-text-subtle); text-transform:uppercase; letter-spacing:.4px; }
  .gd2-gen-mc-f span { display:block; font-size:13px; font-weight:500; color:var(--color-text); margin-top:3px; }

  /* ── Remarks ── */
  .gd2-remarks {
    background:var(--color-bg); border-radius:var(--radius-md);
    border:1px solid var(--color-border); padding:14px 16px;
    font-size:14px; color:var(--color-text-muted); line-height:1.7;
    min-height:70px;
  }

  /* ── Amount in words ── */
  .gd2-words {
    background:linear-gradient(135deg,#f0fdf4,#dcfce7);
    border:1.5px solid #86efac; border-radius:10px;
    padding:12px 18px; font-size:13px; font-style:italic;
    color:#166534; font-weight:600; margin-top:12px;
  }

  /* ── Date badge ── */
  .gd2-date-range {
    display:inline-flex; align-items:center; gap:7px;
    background:var(--color-primary-50); border:1.5px solid var(--color-primary-100);
    border-radius:8px; padding:6px 14px; font-size:13px; font-weight:700; color:var(--color-primary-dark);
  }
  .gd2-days-badge {
    display:inline-flex; align-items:center; gap:4px;
    background:#dbeafe; border-radius:6px; padding:3px 10px;
    font-size:13px; font-weight:800; color:#1e40af;
  }

  /* ── Skeleton ── */
  .gd2-skel { height:14px; border-radius:6px; background:var(--color-border); animation:gd2-pulse 1.5s ease-in-out infinite; }

  /* ── Not-found ── */
  .gd2-notfound { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:50vh; gap:16px; color:var(--color-text-subtle); text-align:center; }

  /* ── Divider ── */
  .gd2-divider { border:none; border-top:1px dashed var(--color-border); margin:18px 0; }

  /* ── Responsive ── */
  @media (max-width:1023px) {
    .gd2-page { padding:20px 24px; }
    .gd2-grid { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:767px) {
    .gd2-gen-table-wrap { display:none; }
    .gd2-gen-cards { display:block; }
    .gd2-calc-table-wrap { display:none; }
  }
  @media (max-width:639px) {
    .gd2-page { padding:16px; }
    .gd2-grid, .gd2-grid-2 { grid-template-columns:1fr; }
    .gd2-card-body { padding:16px; }
    .gd2-diesel-row, .gd2-diesel-hdr-row { grid-template-columns:1fr 1fr 1fr; }
    .gd2-diesel-row > div:nth-child(4),
    .gd2-diesel-row > div:nth-child(5),
    .gd2-diesel-hdr-row > div:nth-child(4),
    .gd2-diesel-hdr-row > div:nth-child(5) { display:none; }
  }
`;

/* ─── Status configs ──────────────────────────────────────────────────────── */
const ORDER_STATUS_CFG = {
  PENDING:    { label: 'Pending',    bg: '#FEF3C7', color: '#92400E' },
  CONFIRMED:  { label: 'Confirmed',  bg: '#E0F2FE', color: '#0369A1' },
  PROCESSING: { label: 'Processing', bg: '#E0F2FE', color: '#0369A1' },
  COMPLETED:  { label: 'Completed',  bg: '#D1FAE5', color: '#065F46' },
  CANCELLED:  { label: 'Cancelled',  bg: '#FEE2E2', color: '#991B1B' },
};
const BILLING_STATUS_CFG = {
  COMPLETED: { label: 'Billed',   bg: '#D1FAE5', color: '#065F46' },
  PENDING:   { label: 'Pending',  bg: '#FEF3C7', color: '#92400E' },
};

/* ─── Micro components ────────────────────────────────────────────────────── */
function StatusPill({ status, map }) {
  const cfg = map[status] || { label: status, bg: '#F1F5F9', color: '#64748B' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700,
      background:cfg.bg, color:cfg.color,
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

function Field({ label, children, muted }) {
  return (
    <div className="gd2-field">
      <label>{label}</label>
      <div className={`gd2-field-val${muted ? ' muted' : ''}`}>{children}</div>
    </div>
  );
}

function CardSection({ icon: Ic, title, badge, children }) {
  return (
    <div className="gd2-card">
      <div className="gd2-card-header" style={{ justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="gd2-card-icon"><Ic /></span>
          <h3 className="gd2-card-title">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="gd2-card-body">{children}</div>
    </div>
  );
}

/* ─── Skeleton Loader ─────────────────────────────────────────────────────── */
function SkeletonDetail() {
  return (
    <div className="gd2-page">
      <div className="gd2-header">
        <div className="gd2-header-left">
          <div className="gd2-back-btn" style={{ pointerEvents:'none' }}><Icon.ArrowLeft /></div>
          <div>
            <div className="gd2-skel" style={{ width:240, height:26, marginBottom:8 }} />
            <div className="gd2-skel" style={{ width:180, height:13 }} />
          </div>
        </div>
      </div>
      <div className="gd2-skel" style={{ height:76, borderRadius:16, marginBottom:20 }} />
      {[1,2,3,4].map(i => (
        <div key={i} className="gd2-card" style={{ marginBottom:20 }}>
          <div style={{ height:52, background:'var(--color-surface-2)' }} />
          <div style={{ padding:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
              {Array.from({length:6}).map((_,j) => (
                <div key={j}>
                  <div className="gd2-skel" style={{ width:'40%', height:10, marginBottom:8 }} />
                  <div className="gd2-skel" style={{ width:'70%', height:15 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
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

  /* ── Derived calculations (mirrors billing form logic exactly) ── */
  const rentalDays   = useMemo(() => parseRentalDays(order?.functionDate), [order]);
  const withDiesel   = order?.dieselType !== 'PARTY';
  const cableRequired = order?.cableRequired ?? true;

  const calculations = useMemo(() => {
    if (!order) return { items: [], totalAmount: 0 };
    let totalAmount = 0;

    const items = (order.generators || []).map(g => {
      const gKey = g.id ?? g._id;

      // ── Generator Rent ──────────────────────────────────────────
      const rentDay   = parseFloat(g.rate) || 0;
      const genAmount = parseFloat((rentDay * rentalDays).toFixed(2));

      // ── Diesel Charge ───────────────────────────────────────────
      const dPrice = parseFloat(g.dieselRate) || 0;
      let dieselAmount = 0;
      let totalDieselHours = 0;
      const entries = (g.dieselEntries || []).map(e => {
        const dur = e.duration || (e.startTime && e.endTime ? (() => {
          const [h1,m1] = e.startTime.split(':').map(Number);
          const [h2,m2] = e.endTime.split(':').map(Number);
          let diffMins = (h2*60+m2)-(h1*60+m1);
          if(diffMins<0) diffMins+=24*60;
          return diffMins/60;
        })() : 0);
        return { ...e, durHours: dur };
      });
      if (withDiesel) {
        entries.forEach(e => { totalDieselHours += e.durHours; });
        dieselAmount = parseFloat((dPrice * totalDieselHours).toFixed(2));
      }

      // ── Cable Charge ────────────────────────────────────────────
      const cableSize   = g.cableSize || '';
      const cableRate   = (cableRequired && cableSize)
        ? (g.cableRate != null ? parseFloat(g.cableRate) : getCableRate(cableSize))
        : 0;
      const cableAmount = parseFloat((cableRate * rentalDays).toFixed(2));

      // ── Row Total ───────────────────────────────────────────────
      const rowTotal = genAmount + dieselAmount + cableAmount;
      totalAmount += rowTotal;

      return { ...g, _key: gKey, rentDay, genAmount, entries, totalDieselHours, dPrice, dieselAmount, cableSize, cableRate, cableAmount, rowTotal };
    });

    return { items, totalAmount: parseFloat(totalAmount.toFixed(2)) };
  }, [order, rentalDays, withDiesel, cableRequired]);

  const discountVal = order ? (parseFloat(order.discountAmount) || 0) : 0;
  const taxAmount   = order ? (parseFloat(order.taxAmount) || 0) : 0;
  const netTotal    = order ? Math.max(0, parseFloat((calculations.totalAmount - discountVal).toFixed(2))) : 0;
  const amountWords = numberToWords(netTotal);

  /* ── Render guards ── */
  if (loading) return (<><style>{STYLES}</style><SkeletonDetail /></>);

  if (notFound) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="gd2-page">
          <div className="gd2-notfound">
            <span style={{ color:'var(--color-border-strong)' }}><Icon.NotFound /></span>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--color-text)', marginBottom:6 }}>Order Not Found</div>
              <div style={{ fontSize:14, color:'var(--color-text-subtle)' }}>
                Order <strong>{id}</strong> does not exist or has been deleted.
              </div>
            </div>
            <button
              style={{ marginTop:8, padding:'10px 22px', borderRadius:10, border:'none', background:'var(--color-primary)', color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}
              onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
            >
              Back to Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  const gens = calculations.items;

  return (
    <>
      <style>{STYLES}</style>

      <div className="gd2-page">

        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="gd2-header">
          <div className="gd2-header-left">
            <button className="gd2-back-btn" id="btn-back" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>
              <Icon.ArrowLeft />
            </button>
            <div>
              <h1 className="gd2-page-title">Order Details</h1>
              <p className="gd2-breadcrumb">
                <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS); }}>Generator</a>
                {' › '}
                <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATOR_ORDERS); }}>Orders</a>
                {' › '}{order.orderNumber || order.id}
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <button
              id="btn-invoice"
              className="gd2-invoice-btn"
              onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', order.id))}
            >
              <Icon.Invoice /> Invoice
            </button>
            <button
              id="btn-edit-order"
              className="gd2-edit-btn"
              onClick={() => navigate(ROUTES.GENERATOR_ORDER_EDIT.replace(':id', order.id))}
            >
              <Icon.Edit /> Edit Order
            </button>
          </div>
        </div>

        {/* ── Order Banner ─────────────────────────────────────────── */}
        <div className="gd2-banner">
          <div>
            <div className="gd2-banner-sub">Generator Order</div>
            <div className="gd2-banner-id">{order.orderNumber || order.id}</div>
            <div className="gd2-banner-statuses">
              <StatusPill status={order.orderStatus} map={ORDER_STATUS_CFG} />
              <StatusPill status={order.billingStatus || 'PENDING'} map={BILLING_STATUS_CFG} />
              {withDiesel && (
                <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:'rgba(255,255,255,.2)', color:'#fff' }}>
                  With Diesel
                </span>
              )}
              {cableRequired && (
                <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:'rgba(255,255,255,.15)', color:'#fff' }}>
                  Cable Required
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="gd2-banner-meta"><Icon.Calendar /> Created: {fmtDate(order.createdAt)}</div>
            <div className="gd2-banner-meta" style={{ marginTop:4 }}><Icon.Clock /> Updated: {fmtDate(order.updatedAt)}</div>
            {order.functionDate && (
              <div className="gd2-banner-meta" style={{ marginTop:8 }}>
                <Icon.Calendar />
                <span style={{ color:'#fff', fontWeight:700 }}>
                  {order.functionDate.includes(' to ')
                    ? order.functionDate.split(' to ').map(fmtDate).join(' → ')
                    : fmtDate(order.functionDate)}
                  {' '}
                  <span style={{ background:'rgba(255,255,255,.2)', borderRadius:6, padding:'1px 8px', fontSize:11 }}>
                    {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 1 — Order Details ────────────────────────────── */}
        <CardSection icon={Icon.User} title="Order Details">
          {/* Client info */}
          <div className="gd2-grid" style={{ marginBottom: 20 }}>
            <Field label="Client Name">
              <Icon.User />{order.clientName || '—'}
            </Field>
            <Field label="Order Number" muted>
              <Icon.Receipt />{order.orderNumber || order.id}
            </Field>
            <Field label="Contact Number" muted>
              <Icon.Phone />{order.contactNumber || '—'}
            </Field>
          </div>
          <hr className="gd2-divider" />
          {/* Operator info */}
          <div className="gd2-grid" style={{ marginBottom: 20 }}>
            <Field label="Alternate Mobile" muted>
              <Icon.Phone />{order.alternateMobile || '—'}
            </Field>
            <Field label="Operator Name" muted>
              {order.operatorName || '—'}
            </Field>
            <Field label="Operator Mobile" muted>
              <Icon.Phone />{order.operatorMobile || '—'}
            </Field>
          </div>
          <hr className="gd2-divider" />
          {/* Function dates & diesel */}
          <div className="gd2-grid">
            <Field label="Function Date">
              <span className="gd2-date-range">
                <Icon.Calendar />
                {order.functionDate
                  ? (order.functionDate.includes(' to ')
                      ? order.functionDate.split(' to ').map(fmtDate).join(' → ')
                      : fmtDate(order.functionDate))
                  : '—'}
              </span>
            </Field>
            <Field label="Rental Days">
              <span className="gd2-days-badge">
                <Icon.Calendar /> {rentalDays} day{rentalDays !== 1 ? 's' : ''}
              </span>
            </Field>
            <Field label="Diesel Type" muted>
              <span style={{
                padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:700,
                background: withDiesel ? '#DBEAFE' : '#F0FDF4',
                color:      withDiesel ? '#1E40AF' : '#166534',
              }}>
                {withDiesel ? '⛽ With Diesel' : '🟢 Party Diesel'}
              </span>
            </Field>
            <Field label="Cable Required" muted>
              <span style={{
                padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:700,
                background: cableRequired ? '#D1FAE5' : '#FEE2E2',
                color:      cableRequired ? '#065F46' : '#991B1B',
              }}>
                {cableRequired ? '✓ Yes' : '✗ No'}
              </span>
            </Field>
          </div>
        </CardSection>

   
        {/* ── Section 3 — Rent Calculation ─────────────────────────── */}
        <CardSection icon={Icon.Calculator} title="Rent Calculation">
          {/* Summary info row */}
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:18 }}>
            <div style={{ background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:8, padding:'10px 16px', minWidth:160 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-subtle)', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>Rental Period</div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--color-text)' }}>
                {order.functionDate
                  ? (order.functionDate.includes(' to ')
                      ? order.functionDate.split(' to ').map(fmtDate).join(' → ')
                      : fmtDate(order.functionDate))
                  : '—'}
              </div>
            </div>
            <div style={{ background:'#dbeafe', border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 16px', minWidth:120 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1e3a8a', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>Total Days</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#1e40af', fontFamily:'monospace' }}>{rentalDays}</div>
            </div>
            <div style={{ background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:8, padding:'10px 16px', minWidth:120 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-subtle)', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>Generators</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--color-text)', fontFamily:'monospace' }}>{gens.length}</div>
            </div>
            <div style={{ background: withDiesel ? '#fef3c7' : '#f0fdf4', border:`1px solid ${withDiesel ? '#fde68a' : '#86efac'}`, borderRadius:8, padding:'10px 16px', minWidth:140 }}>
              <div style={{ fontSize:11, fontWeight:700, color: withDiesel ? '#78350f' : '#166534', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>Diesel</div>
              <div style={{ fontSize:13, fontWeight:700, color: withDiesel ? '#92400e' : '#15803d' }}>
                {withDiesel ? '⛽ With Diesel' : '🟢 Party Diesel'}
              </div>
            </div>
          </div>

          {/* Per-generator calculation breakdown */}
          {gens.map((g, gi) => (
            <div key={g._key || gi} style={{ marginBottom: gi < gens.length - 1 ? 24 : 0 }}>
              {/* Generator header */}
              <div style={{
                display:'flex', alignItems:'center', gap:10, marginBottom:10,
                padding:'10px 14px', background:'linear-gradient(135deg,var(--color-primary-50),var(--color-primary-100))',
                borderRadius:10, border:'1.5px solid var(--color-primary-100)',
              }}>
                <span style={{ width:24, height:24, borderRadius:'50%', background:'var(--color-primary)', color:'#fff', fontSize:12, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{gi+1}</span>
                <span style={{ fontWeight:800, color:'var(--color-primary-dark)', fontSize:14 }}>{g.generatorName}</span>
                {g.generatorCode && <span style={{ fontSize:11, color:'var(--color-primary)', fontFamily:'monospace' }}>({g.generatorCode})</span>}
                <span style={{ marginLeft:'auto', fontWeight:800, color:'var(--color-primary-dark)', fontSize:15, fontFamily:'monospace' }}>
                  {fmtCur(g.rowTotal)}
                </span>
              </div>

              {/* Calculation table */}
              <div style={{ overflowX:'auto' }}>
                <table className="gd2-calc-table">
                  <thead>
                    <tr>
                      <th className="gd2-calc-th">Description</th>
                      <th className="gd2-calc-th" style={{ textAlign:'right' }}>Rate</th>
                      <th className="gd2-calc-th" style={{ textAlign:'center' }}>Qty / Days / Hrs</th>
                      <th className="gd2-calc-th" style={{ textAlign:'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Generator Rent row */}
                    <tr className="gd2-calc-tr-gen">
                      <td className="gd2-calc-td">
                        <span style={{ color:'var(--color-primary-dark)' }}>⚡ Generator Rent</span>
                      </td>
                      <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace' }}>{fmtCur(g.rentDay)} / day</td>
                      <td className="gd2-calc-td" style={{ textAlign:'center' }}>{rentalDays} day{rentalDays !== 1 ? 's' : ''}</td>
                      <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace', color:'var(--color-primary-dark)' }}>{fmtCur(g.genAmount)}</td>
                    </tr>

                    {/* Diesel entries */}
                    {withDiesel && g.entries && g.entries.length > 0 && g.entries.map((de, di) => (
                      <tr key={di} className="gd2-calc-tr-diesel">
                        <td className="gd2-calc-td" style={{ paddingLeft:24 }}>
                          {di === 0 && <span style={{ fontWeight:700 }}>⛽ Diesel Charge</span>}
                          {di > 0 && '↳'}
                          <span style={{ marginLeft:di > 0 ? 0 : 8, fontSize:12 }}>
                            {de.entryDate ? fmtDate(de.entryDate) : (de.date ? fmtDate(de.date) : '—')}
                            {de.startTime && de.endTime && (
                              <span style={{ marginLeft:6, fontFamily:'monospace' }}>
                                {de.startTime}–{de.endTime}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace' }}>
                          {di === 0 ? `${fmtCur(g.dPrice)} / hr` : ''}
                        </td>
                        <td className="gd2-calc-td" style={{ textAlign:'center', fontFamily:'monospace' }}>
                          {de.durHours != null ? formatDurationDisplay(de.durHours) : (de.duration ? formatDurationDisplay(de.duration) : '—')}
                        </td>
                        <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace', fontWeight:700 }}>
                          {di === g.entries.length - 1 ? fmtCur(g.dieselAmount) : ''}
                        </td>
                      </tr>
                    ))}
                    {withDiesel && g.entries && g.entries.length === 0 && (
                      <tr className="gd2-calc-tr-diesel">
                        <td className="gd2-calc-td" style={{ paddingLeft:24 }}>⛽ Diesel Charge</td>
                        <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace' }}>{fmtCur(g.dPrice)} / hr</td>
                        <td className="gd2-calc-td" style={{ textAlign:'center' }}>0 hrs</td>
                        <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace', fontWeight:700 }}>₹0.00</td>
                      </tr>
                    )}

                    {/* Cable row */}
                    {g.cableSize && cableRequired && (
                      <tr className="gd2-calc-tr-cable">
                        <td className="gd2-calc-td" style={{ paddingLeft:24 }}>
                          🔌 Cable {g.cableSize}{g.cableSize !== 'Earth Rod' ? ' mm²' : ''}
                        </td>
                        <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace' }}>{fmtCur(g.cableRate)} / day</td>
                        <td className="gd2-calc-td" style={{ textAlign:'center' }}>{rentalDays} day{rentalDays !== 1 ? 's' : ''}</td>
                        <td className="gd2-calc-td" style={{ textAlign:'right', fontFamily:'monospace', fontWeight:700 }}>{fmtCur(g.cableAmount)}</td>
                      </tr>
                    )}

                    {/* Sub-total for this generator */}
                    <tr>
                      <td colSpan={3} className="gd2-calc-td" style={{ textAlign:'right', fontWeight:700, color:'var(--color-text-muted)', fontSize:12, textTransform:'uppercase', letterSpacing:'.4px' }}>
                        Generator Sub-Total
                      </td>
                      <td className="gd2-calc-td" style={{ textAlign:'right', fontWeight:800, color:'var(--color-primary-dark)', fontFamily:'monospace', fontSize:15, background:'var(--color-primary-50)' }}>
                        {fmtCur(g.rowTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* ── Overall Summary ── */}
          <div style={{ marginTop:24 }}>
            <div className="gd2-summary-panel">
              <div className="gd2-summary-row">
                <span>Gross Total (all generators)</span>
                <span className="gd2-summary-val">{fmtCur(calculations.totalAmount)}</span>
              </div>
              {discountVal > 0 && (
                <div className="gd2-summary-row" style={{ color:'#dc2626' }}>
                  <span>Discount</span>
                  <span style={{ fontWeight:700, color:'#dc2626', fontFamily:'monospace' }}>- {fmtCur(discountVal)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="gd2-summary-row">
                  <span>Tax / GST</span>
                  <span className="gd2-summary-val">{fmtCur(taxAmount)}</span>
                </div>
              )}
              <div className="gd2-summary-row total">
                <span>Net Payable Amount</span>
                <span className="gd2-summary-val">{fmtCur(netTotal)}</span>
              </div>
            </div>
            {amountWords && (
              <div className="gd2-words">
                Amount in Words: <em>{amountWords}</em>
              </div>
            )}
          </div>
        </CardSection>

        {/* ── Section 4 — Billing Status ───────────────────────────── */}
        <CardSection icon={Icon.Receipt} title="Billing Details">
          <div className="gd2-grid" style={{ marginBottom:20 }}>
            <Field label="Order Status">
              <StatusPill status={order.orderStatus} map={ORDER_STATUS_CFG} />
            </Field>
            <Field label="Billing Status">
              <StatusPill status={order.billingStatus || 'PENDING'} map={BILLING_STATUS_CFG} />
            </Field>
            <Field label="Bill Number" muted>
              <Icon.Receipt />{order.billNumber || '—'}
            </Field>
          </div>
          <hr className="gd2-divider" />
          <div className="gd2-grid">
            <Field label="Subtotal / Gross Total">
              <span style={{ fontFamily:'monospace', fontWeight:700 }}>{fmtCur(calculations.totalAmount)}</span>
            </Field>
            <Field label="Discount">
              <span style={{ fontFamily:'monospace', fontWeight:700, color: discountVal > 0 ? '#dc2626' : undefined }}>
                {fmtCur(discountVal)}
              </span>
            </Field>
            <Field label="Tax / GST">
              <span style={{ fontFamily:'monospace', fontWeight:700 }}>{fmtCur(taxAmount)}</span>
            </Field>
            <Field label="Final / Net Amount">
              <span style={{ color:'var(--color-primary-dark)', fontWeight:800, fontSize:17, fontFamily:'monospace' }}>
                {fmtCur(netTotal)}
              </span>
            </Field>
          </div>
        </CardSection>

        {/* ── Section 5 — Additional Info ──────────────────────────── */}
        <CardSection icon={Icon.MapPin} title="Additional Information">
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="gd2-field">
              <label>Site Address</label>
              <div className="gd2-field-val muted" style={{ alignItems:'flex-start', marginTop:6 }}>
                <Icon.MapPin />
                <span>{order.siteAddress || '—'}</span>
              </div>
            </div>
            {order.siteAddressLink && (
              <div className="gd2-field">
                <label>Site Address Link</label>
                <div className="gd2-field-val" style={{ marginTop:6 }}>
                  <a
                    href={order.siteAddressLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color:'var(--color-primary)', fontWeight:600, fontSize:14, wordBreak:'break-all' }}
                  >
                    🗺 {order.siteAddressLink}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardSection>

        {/* ── Section 6 — Remarks ──────────────────────────────────── */}
        <CardSection icon={Icon.FileText} title="Remarks">
          <div className="gd2-remarks">
            {order.remarks || order.notes || <span style={{ fontStyle:'italic', opacity:.5 }}>No remarks added.</span>}
          </div>
        </CardSection>

        {/* ── Bottom Actions ───────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, flexWrap:'wrap' }}>
          <button
            style={{
              padding:'10px 20px', borderRadius:8, border:'1.5px solid var(--color-border)',
              background:'var(--color-surface)', color:'var(--color-text-muted)',
              fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit',
            }}
            onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
          >
            Back to Orders
          </button>
          <button
            id="btn-invoice-bottom"
            className="gd2-invoice-btn"
            onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', order.id))}
          >
            <Icon.Invoice /> View Invoice
          </button>
          <button
            id="btn-edit-bottom"
            className="gd2-edit-btn"
            onClick={() => navigate(ROUTES.GENERATOR_ORDER_EDIT.replace(':id', order.id))}
          >
            <Icon.Edit /> Edit Order
          </button>
        </div>
      </div>
    </>
  );
}
