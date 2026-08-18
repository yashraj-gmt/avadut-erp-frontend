// src/pages/generators/billing/GeneratorBillingHistory.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { generatorOrderService } from '@/services/generatorOrderService';
import { generatorService } from '@/services/generatorService';
import { formatRangeToDMY, formatToDMY, numberToWords } from '../orders/mockData';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  `₹${(parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return '—';
  try { return formatToDMY(d); } catch (e) { return d; }
};

const fmtRange = (str) => {
  if (!str) return '—';
  try { return formatRangeToDMY(str); } catch (e) { return str; }
};

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Printer: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Filter: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Reset: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const STYLES = `
  .bh-page { padding: 24px; max-width: 1400px; margin: 0 auto; animation: bh-fadein .3s ease; }
  @keyframes bh-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .bh-header { display:flex; align-items:flex-start; gap:14px; margin-bottom:24px; }
  .bh-back-btn {
    display:flex; align-items:center; justify-content:center;
    width:38px; height:38px; border-radius:10px;
    border:1.5px solid var(--color-border); background:var(--color-surface);
    cursor:pointer; color:var(--color-text-muted); transition:all .2s; flex-shrink:0; margin-top:2px;
  }
  .bh-back-btn:hover { border-color:var(--color-primary); color:var(--color-primary); background:var(--color-primary-50); }
  .bh-page-title { font-size:clamp(18px,3vw,22px); font-weight:700; color:var(--color-text); letter-spacing:-.4px; margin:0 0 3px; }
  .bh-breadcrumb { font-size:13px; color:var(--color-text-subtle); }
  .bh-breadcrumb a { color:var(--color-primary); text-decoration:none; }

  .bh-filter-panel {
    background:var(--color-surface); border:1px solid var(--color-border);
    border-radius:12px; padding:18px 20px; margin-bottom:22px;
    box-shadow:var(--shadow-sm);
  }
  .bh-filter-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .bh-filter-title { font-size:13.5px; font-weight:700; color:var(--color-text); display:flex; align-items:center; gap:7px; }
  .bh-filter-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:14px 16px; }
  .bh-search-field { grid-column: span 2; }
  .bh-filter-field { display:flex; flex-direction:column; gap:5px; }
  .bh-filter-label { font-size:11.5px; font-weight:600; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.4px; }
  .bh-filter-input, .bh-filter-select {
    padding:8px 11px; border:1.5px solid var(--color-border);
    border-radius:8px; font-size:13px; color:var(--color-text);
    background:var(--color-surface); outline:none; font-family:inherit;
    transition:border-color .2s; width:100%;
  }
  .bh-filter-input:focus, .bh-filter-select:focus { border-color:var(--color-primary); }
  .bh-filter-actions { display:flex; align-items:center; gap:10px; margin-top:14px; flex-wrap:wrap; }
  .bh-btn-reset {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 16px; border-radius:8px; border:1.5px solid var(--color-border);
    background:var(--color-surface); color:var(--color-text-muted);
    font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .2s;
  }
  .bh-btn-reset:hover { border-color:#ef4444; color:#ef4444; background:#fff5f5; }
  .bh-results-count { font-size:13px; color:var(--color-text-subtle); margin-left:auto; }

  .bh-stats-bar { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; margin-bottom:22px; }
  .bh-stat-card {
    background:var(--color-surface); border:1px solid var(--color-border);
    border-radius:12px; padding:16px 18px; box-shadow:var(--shadow-sm);
  }
  .bh-stat-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--color-text-muted); margin-bottom:6px; }
  .bh-stat-value { font-size:20px; font-weight:800; font-family:monospace; color:var(--color-primary-dark); }
  .bh-stat-sub { font-size:11px; color:var(--color-text-subtle); margin-top:3px; }

  .bh-table-wrap {
    background:var(--color-surface); border:1px solid var(--color-border);
    border-radius:12px; overflow-x:auto; box-shadow:var(--shadow-sm);
    -webkit-overflow-scrolling: touch; position:relative;
  }
  .bh-table { width:100%; min-width:960px; border-collapse:separate; border-spacing:0; font-size:13px; }
  .bh-th {
    padding:11px 14px; font-size:10.5px; font-weight:700;
    color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.5px;
    background:var(--color-surface-2); border-bottom:1.5px solid var(--color-border);
    text-align:left; white-space:nowrap;
  }
  .bh-tr { background:var(--color-surface); transition:background .15s; }
  .bh-tr:nth-child(even) { background:var(--color-bg); }
  .bh-tr:hover td { background:rgba(37,99,235,.04) !important; }
  .bh-td { padding:13px 14px; border-bottom:1px solid var(--color-border); color:var(--color-text); vertical-align:middle; background:inherit; }
  .bh-tr:last-child .bh-td { border-bottom:none; }

  /* ── Sticky Columns ── */
  .bh-th-sticky-left, .bh-td-sticky-left {
    position: sticky; left: 0; z-index: 2;
    box-shadow: 2px 0 6px -1px rgba(0,0,0,.08);
    border-right: 1.5px solid var(--color-border) !important;
  }
  .bh-th-sticky-left { background: var(--color-surface-2) !important; z-index: 4; }
  .bh-th-sticky-right, .bh-td-sticky-right {
    position: sticky; right: 0; z-index: 2;
    box-shadow: -2px 0 6px -1px rgba(0,0,0,.08);
    border-left: 1.5px solid var(--color-border) !important;
  }
  .bh-th-sticky-right { background: var(--color-surface-2) !important; z-index: 4; }
  .bh-tr:hover .bh-td-sticky-left,
  .bh-tr:hover .bh-td-sticky-right { background: #f0f7ff !important; }

  .bh-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 9px; border-radius:12px; font-size:11px; font-weight:700; white-space:nowrap; }
  .bh-badge-diesel-on  { background:#fef3c7; color:#92400e; border:1px solid #fde68a; }
  .bh-badge-diesel-off { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
  .bh-badge-cable-on   { background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; }

  /* ── Action Buttons ── */
  .bh-action-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid var(--color-border);
    background: var(--color-surface); cursor: pointer; transition: all .15s; flex-shrink: 0;
  }
  .bh-action-btn:hover { transform: scale(1.1); }
  .bh-btn-view { color: #0284c7; border-color: #bae6fd; background: #f0f9ff; }
  .bh-btn-view:hover { background: #e0f2fe; color: #0369a1; border-color: #7dd3fc; }
  .bh-btn-print { color: #1e293b; border-color: #cbd5e1; background: #f8fafc; }
  .bh-btn-print:hover { background: #1e293b; color: #fff; border-color: #1e293b; }

  .bh-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-top:1px solid var(--color-border); flex-wrap:wrap; gap:12px; }
  .bh-page-info { font-size:13px; color:var(--color-text-subtle); }
  .bh-page-btns { display:flex; gap:6px; }
  .bh-page-btn {
    display:inline-flex; align-items:center; justify-content:center;
    width:34px; height:34px; border-radius:8px; border:1.5px solid var(--color-border);
    background:var(--color-surface); cursor:pointer; color:var(--color-text);
    transition:all .2s; font-family:inherit; font-size:13px;
  }
  .bh-page-btn:hover:not(:disabled) { border-color:var(--color-primary); color:var(--color-primary); }
  .bh-page-btn:disabled { opacity:.35; cursor:not-allowed; }

  .bh-empty { text-align:center; padding:60px 20px; color:var(--color-text-subtle); }
  .bh-empty-icon { font-size:48px; margin-bottom:12px; }
  .bh-empty-title { font-size:16px; font-weight:700; color:var(--color-text); margin-bottom:6px; }

  .bh-skeleton { height:52px; background:var(--color-surface-2); border-radius:4px; margin-bottom:10px; animation:bh-pulse 1.5s ease infinite; }
  @keyframes bh-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }

  @media (max-width:1024px) {
    .bh-page { padding:18px 16px; }
    .bh-filter-grid { grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); }
  }
  @media (max-width:768px) {
    .bh-page { padding:14px 12px; }
    .bh-filter-panel { padding:14px; margin-bottom:16px; }
    .bh-filter-grid { grid-template-columns:1fr 1fr; gap:12px; }
    .bh-search-field { grid-column:span 2; }
    .bh-stats-bar { grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
    .bh-stat-card { padding:12px 14px; }
  }
  @media (max-width:580px) {
    .bh-page { padding:10px 8px; }
    .bh-header { margin-bottom:14px; gap:10px; }
    .bh-page-title { font-size:18px; }
    .bh-filter-panel { padding:12px 10px; border-radius:10px; }
    .bh-filter-header { flex-direction:row; gap:8px; margin-bottom:12px; }
    .bh-filter-grid { grid-template-columns:1fr; gap:10px; }
    .bh-search-field { grid-column:span 1; }
    .bh-filter-input, .bh-filter-select { font-size:14px; padding:8px 10px; }
    .bh-filter-actions { flex-direction:column; align-items:stretch; gap:8px; margin-top:10px; }
    .bh-results-count { margin-left:0; text-align:center; }
    .bh-btn-reset { justify-content:center; width:100%; }
    .bh-stats-bar { grid-template-columns:1fr 1fr; gap:8px; }
    .bh-stat-card { padding:10px; border-radius:10px; }
    .bh-stat-value { font-size:16px; }
    .bh-stat-label { font-size:10px; }
    .bh-table-wrap { border-radius:10px; }
    .bh-pagination { flex-direction:column; gap:10px; text-align:center; }
    .bh-page-btns { justify-content:center; flex-wrap:wrap; }

    /* On mobile screens <= 580px, unstick table columns so scrolling is wide and easy */
    .bh-th-sticky-left, .bh-td-sticky-left,
    .bh-th-sticky-right, .bh-td-sticky-right {
      position: static !important;
      box-shadow: none !important;
      border-left: none !important;
      border-right: none !important;
    }
  }
`;

/* ─── Print Invoice ─────────────────────────────────────────────────────── */
function printBillingInvoice(order) {
  const printWin = window.open('', '_blank', 'width=920,height=1060');
  if (!printWin) { alert('Please allow popups to print invoices.'); return; }

  const fmtCur = (n) => `₹${(parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const billingDate = formatToDMY(new Date());
  const withDiesel = order.dieselType !== 'PARTY';
  const cableRequired = order.cableRequired ?? true;

  const rentalDays = (() => {
    if (order.functionDateFrom && order.functionDateTo) {
      const d1 = new Date(order.functionDateFrom);
      const d2 = new Date(order.functionDateTo);
      return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
    }
    return 1;
  })();

  const genRows = (order.generators || []).map((g, idx) => {
    const rate     = parseFloat(g.rate) || 0;
    const genAmt   = rate * rentalDays;
    const dRate    = parseFloat(g.dieselRate) || 0;
    const entries  = g.dieselEntries || [];
    const totalHrs = entries.reduce((s, e) => s + (parseFloat(e.duration) || 0), 0);
    const dieselAmt = withDiesel ? dRate * totalHrs : 0;
    const cableRate = parseFloat(g.cableRate) || 0;
    const cableAmt  = (cableRequired && g.cableSize) ? cableRate * rentalDays : 0;

    const dieselRows = withDiesel && entries.length > 0
      ? entries.map((de, dIdx) => {
          const isFirst = dIdx === 0 || entries[dIdx - 1].entryDate !== de.entryDate;
          return `<tr style="background:#fffbeb;">
            ${dIdx === 0 ? `<td rowspan="${entries.length}" style="border:1px solid #cbd5e1;padding:8px 10px;font-size:12px;color:#92400e;padding-left:16px;">Diesel Charge</td>` : ''}
            ${dIdx === 0 ? `<td rowspan="${entries.length}" style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:12px;font-family:monospace;color:#92400e;">${fmtCur(dRate)}/hr</td>` : ''}
            <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">—</td>
            <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:${isFirst ? '#92400e' : '#b45309'};font-weight:${isFirst ? '600' : '400'};">${isFirst ? fmtDate(de.entryDate) : '&#8627;'}</td>
            <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">${de.startTime || '—'}</td>
            <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">${de.endTime || '—'}</td>
            <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">${(parseFloat(de.duration) || 0).toFixed(2)} hrs</td>
            ${dIdx === 0 ? `<td rowspan="${entries.length}" style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:13px;font-weight:700;color:#92400e;font-family:monospace;">${fmtCur(dieselAmt)}</td>` : ''}
          </tr>`;
        }).join('')
      : '';

    const cableRow = (g.cableSize && cableRequired)
      ? `<tr style="background:#eff6ff;">
          <td style="border:1px solid #cbd5e1;padding:8px 10px;font-size:12px;color:#1e40af;padding-left:16px;">Cable ${g.cableSize}${g.cableSize !== 'Earth Rod' ? ' mm²' : ''}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:12px;font-family:monospace;color:#1e40af;">${fmtCur(cableRate)}/day</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#1e40af;">${rentalDays} day${rentalDays !== 1 ? 's' : ''}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#1e40af;">—</td>
          ${withDiesel ? '<td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td>' : ''}
          <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:13px;font-weight:700;color:#1e40af;font-family:monospace;">${fmtCur(cableAmt)}</td>
        </tr>`
      : '';

    const rowspan = 1 + (withDiesel ? entries.length : 0) + (g.cableSize && cableRequired ? 1 : 0);

    return `
      <tr>
        <td rowspan="${rowspan}" style="border:1px solid #cbd5e1;padding:9px 10px;text-align:center;font-size:13px;vertical-align:top;">${idx + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;font-size:13px;font-weight:700;">${g.generatorName || '—'}</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:right;font-size:12px;font-family:monospace;">${fmtCur(rate)}/day</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:center;font-size:12px;">${rentalDays} day${rentalDays !== 1 ? 's' : ''}</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:center;font-size:12px;">—</td>
        ${withDiesel ? '<td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td>' : ''}
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:right;font-size:13px;font-weight:800;color:#1e40af;font-family:monospace;">${fmtCur(genAmt)}</td>
      </tr>
      ${dieselRows}
      ${cableRow}
    `;
  });

  const totalAmt   = parseFloat(order.subtotal) || 0;
  const discountAmt = parseFloat(order.discountAmount) || 0;
  const netTotal   = Math.max(0, totalAmt - discountAmt);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice #${order.billNumber}</title>
<style>
  @page{margin:0;size:A4} @media print{body{padding:10mm !important} html{-webkit-print-color-adjust:exact}}
  *{box-sizing:border-box} body{font-family:Arial,sans-serif;color:#1e293b;margin:0;padding:24px;background:#fff;font-size:13px}
  .box{max-width:860px;margin:auto}
  .hdr{border-bottom:2px solid #1e40af;padding-bottom:14px;margin-bottom:18px}
  .hdr-title{text-align:center;font-size:24px;font-weight:900;color:#0f172a;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
  .hdr-row{display:flex;justify-content:space-between;align-items:center;gap:15px}
  .hdr-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
  .meta{flex-shrink:0} .meta table{border-collapse:collapse} .meta table td{padding:3px 6px;font-size:12.5px;white-space:nowrap} .meta table td:first-child{color:#64748b;min-width:95px;font-weight:600} .meta table td:last-child{font-weight:700}
  .sec{display:flex;border:1px solid #e2e8f0;margin-bottom:12px}
  .half{flex:1;padding:12px 14px} .half:first-child{border-right:1px solid #e2e8f0}
  .slabel{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:1px solid #f1f5f9;padding-bottom:3px;margin-bottom:6px}
  .dr{display:flex;margin:4px 0;font-size:13px} .dk{min-width:130px;color:#64748b} .dv{font-weight:600;color:#0f172a}
  .site{padding:10px 14px;border:1px solid #e2e8f0;border-top:none;margin-bottom:14px}
  .inv-table{width:100%;border-collapse:collapse}
  .inv-table th{background:#f8fafc;border:1px solid #cbd5e1;padding:8px 10px;font-size:10.5px;font-weight:700;text-transform:uppercase;color:#475569}
  .summary{display:flex;justify-content:flex-end;margin:16px 0 6px}
  .stbl{width:300px} .stbl td{padding:6px 0;font-size:14px} .stbl td:last-child{text-align:right;font-family:monospace;font-weight:600}
  .net-row td{font-size:18px;font-weight:800;color:#1e40af;border-top:2px solid #cbd5e1;padding-top:10px}
  .words{font-style:italic;font-size:11.5px;color:#1e40af;font-weight:700;text-align:right;margin-bottom:24px}
  .footer{border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;font-size:11px;color:#94a3b8}
  @media print{body{padding:0}}
</style></head><body>
<div class="box">
  <div class="hdr">
    <div class="hdr-title">TAX INVOICE</div>
    <div class="hdr-row">
      <div class="hdr-left">
        <img src="/images/avadhut-logo.png" alt="Avadhut" style="height:100px;object-fit:contain;display:block;flex-shrink:0;" onerror="this.style.display='none'"/>
        <div style="font-size:22px;font-weight:800;color:#cc0000;line-height:1.3;white-space:nowrap;">Avadhut Light Decoration &amp; Sound</div>
      </div>
      <div class="meta">
        <table>
          <tr><td>Bill Number</td><td>: #${order.billNumber || '—'}</td></tr>
          <tr><td>Order Number</td><td>: ${order.orderNumber || order.id}</td></tr>
          <tr><td>Billing Date</td><td>: ${billingDate}</td></tr>
          <tr><td>Rental Days</td><td>: ${rentalDays} day${rentalDays !== 1 ? 's' : ''}</td></tr>
        </table>
      </div>
    </div>
  </div>
  <div class="sec">
    <div class="half"><div class="slabel">Client Details</div>
      <div class="dr"><span class="dk">Name</span><span class="dv">: ${order.clientName || '—'}</span></div>
      <div class="dr"><span class="dk">Contact</span><span class="dv">: ${order.contactNumber || '—'}</span></div>
      ${order.alternateMobile ? `<div class="dr"><span class="dk">Alt. Mobile</span><span class="dv">: ${order.alternateMobile}</span></div>` : ''}
    </div>
    <div class="half"><div class="slabel">Service Details</div>
      <div class="dr"><span class="dk">Function Date</span><span class="dv">: ${fmtRange(order.functionDate || '')}</span></div>
      <div class="dr"><span class="dk">Operator</span><span class="dv">: ${order.operatorName || '—'}</span></div>
      <div class="dr"><span class="dk">Diesel</span><span class="dv">: ${withDiesel ? 'With Diesel' : 'Party Diesel'}</span></div>
    </div>
  </div>
  <div class="site">
    <div class="slabel">Site Address</div>
    <div style="font-size:13px;font-weight:600;margin-top:4px;">${order.siteAddress || '—'}</div>
  </div>
  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#475569;margin-bottom:6px;">Generator Rent Calculation</div>
  <table class="inv-table">
    <thead><tr>
      <th style="width:36px;text-align:center;">#</th>
      <th style="text-align:left;">Description</th>
      <th style="text-align:right;">Rate</th>
      <th style="text-align:center;">Days</th>
      <th style="text-align:center;">Date</th>
      ${withDiesel ? '<th style="text-align:center;">Start</th><th style="text-align:center;">End</th><th style="text-align:center;">Diesel Hrs</th>' : ''}
      <th style="text-align:right;color:#1e40af;">Amount</th>
    </tr></thead>
    <tbody>${genRows.join('')}</tbody>
  </table>
  <div class="summary">
    <table class="stbl">
      <tr><td style="color:#64748b;font-weight:500;">Total Amount :</td><td>${fmtCur(totalAmt)}</td></tr>
      <tr><td style="color:#dc2626;font-weight:500;">Discount :</td><td style="color:#dc2626;">- ${fmtCur(discountAmt)}</td></tr>
      <tr class="net-row"><td>Net Total:</td><td>${fmtCur(netTotal)}</td></tr>
    </table>
  </div>
  <div class="words">(${numberToWords(netTotal)})</div>
  <div class="footer">
    <p>Thank you for your business. Please make payments before due date.</p>
    <p>&copy; ${new Date().getFullYear()} Avadhut ERP Systems. All rights reserved.</p>
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

  printWin.document.write(html);
  printWin.document.close();
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
const PAGE_SIZE = 50;

export default function GeneratorBillingHistory() {
  const navigate = useNavigate();

  const [allOrders, setAllOrders]       = useState([]);
  const [generatorsList, setGenerators] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Filters
  const [search, setSearch]                   = useState('');
  const [filterGenerator, setFilterGenerator] = useState('');
  const [filterDateFrom, setFilterDateFrom]   = useState('');
  const [filterDateTo, setFilterDateTo]       = useState('');
  const [filterDiesel, setFilterDiesel]       = useState('');
  const [filterCable, setFilterCable]         = useState('');
  const [filterOperator, setFilterOperator]   = useState('');
  const [filterAmtMin, setFilterAmtMin]       = useState('');
  const [filterAmtMax, setFilterAmtMax]       = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [page, setPage]                       = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      generatorOrderService.getAll('', 'COMPLETED', 0, 500, 'createdAt', 'desc'),
      generatorService.getForDropdown(),
    ])
      .then(([ordersRes, gens]) => {
        const raw = ordersRes?.content
          || ordersRes?.data?.content
          || (Array.isArray(ordersRes) ? ordersRes : []);
        const completed = raw.filter(o => o.billingStatus === 'COMPLETED');
        setAllOrders(completed);
        setGenerators(gens || []);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load billing history. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const operators = useMemo(() => {
    const set = new Set();
    allOrders.forEach(o => { if (o.operatorName) set.add(o.operatorName); });
    return Array.from(set).sort();
  }, [allOrders]);

  const filtered = useMemo(() => {
    let list = allOrders;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(o =>
        (o.billNumber     || '').toLowerCase().includes(q) ||
        (o.orderNumber    || '').toLowerCase().includes(q) ||
        (o.clientName     || '').toLowerCase().includes(q) ||
        (o.contactNumber  || '').toLowerCase().includes(q)
      );
    }

    if (filterGenerator) {
      list = list.filter(o =>
        (o.generators || []).some(g =>
          String(g.generatorId) === String(filterGenerator) ||
          (g.generatorName || '').toLowerCase().includes(filterGenerator.toLowerCase())
        )
      );
    }

    if (filterDateFrom) {
      list = list.filter(o => {
        const d = o.functionDateFrom || (o.functionDate || '').split(' to ')[0];
        return d && d >= filterDateFrom;
      });
    }
    if (filterDateTo) {
      list = list.filter(o => {
        const d = o.functionDateTo || (o.functionDate || '').split(' to ').pop();
        return d && d <= filterDateTo;
      });
    }

    if (filterDiesel) list = list.filter(o => (o.dieselType || '') === filterDiesel);
    if (filterCable === 'yes') list = list.filter(o => o.cableRequired === true);
    if (filterCable === 'no')  list = list.filter(o => o.cableRequired === false);

    if (filterOperator) {
      list = list.filter(o =>
        (o.operatorName || '').toLowerCase().includes(filterOperator.toLowerCase())
      );
    }

    if (filterAmtMin !== '') {
      const min = parseFloat(filterAmtMin);
      list = list.filter(o => (parseFloat(o.finalAmount) || 0) >= min);
    }
    if (filterAmtMax !== '') {
      const max = parseFloat(filterAmtMax);
      list = list.filter(o => (parseFloat(o.finalAmount) || 0) <= max);
    }

    if (filterPaymentStatus) {
      list = list.filter(o => {
        const ps = o.paymentStatus || 'PENDING';
        return ps === filterPaymentStatus;
      });
    }

    return list;
  }, [allOrders, search, filterGenerator, filterDateFrom, filterDateTo,
      filterDiesel, filterCable, filterOperator, filterAmtMin, filterAmtMax, filterPaymentStatus]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, o) => s + (parseFloat(o.finalAmount) || 0), 0);
    return {
      count: filtered.length,
      total,
      withDiesel: filtered.filter(o => o.dieselType !== 'PARTY').length,
      withCable:  filtered.filter(o => o.cableRequired).length,
    };
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filterKeys = [search, filterGenerator, filterDateFrom, filterDateTo,
    filterDiesel, filterCable, filterOperator, filterAmtMin, filterAmtMax, filterPaymentStatus];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(0); }, filterKeys);

  const hasFilters = filterKeys.some(Boolean);

  const resetFilters = () => {
    setSearch(''); setFilterGenerator(''); setFilterDateFrom('');
    setFilterDateTo(''); setFilterDiesel(''); setFilterCable('');
    setFilterOperator(''); setFilterAmtMin(''); setFilterAmtMax('');
    setFilterPaymentStatus('');
  };

  const handlePrint = useCallback((order) => printBillingInvoice(order), []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="bh-page">

        {/* Header */}
        <div className="bh-header">
          <button className="bh-back-btn" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="bh-page-title">Billing History</h1>
            <p className="bh-breadcrumb">
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS); }}>Generator</a>
              {' › '}
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATOR_ORDERS); }}>Orders</a>
              {' › Billing History'}
            </p>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bh-filter-panel">
          <div className="bh-filter-header">
            <span className="bh-filter-title"><Icon.Filter /> Filters</span>
            {hasFilters && (
              <button className="bh-btn-reset" onClick={resetFilters}>
                <Icon.Reset /> Reset All
              </button>
            )}
          </div>
          <div className="bh-filter-grid">
            <div className="bh-filter-field bh-search-field">
              <label className="bh-filter-label">Search</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)', pointerEvents:'none' }}>
                  <Icon.Search />
                </span>
                <input
                  id="bh-search"
                  className="bh-filter-input"
                  style={{ paddingLeft: 34 }}
                  placeholder="Bill no., order no., client name, contact…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Generator</label>
              <select id="bh-filter-gen" className="bh-filter-select" value={filterGenerator} onChange={e => setFilterGenerator(e.target.value)}>
                <option value="">All Generators</option>
                {generatorsList.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Function Date From</label>
              <input id="bh-filter-date-from" type="date" className="bh-filter-input" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Function Date To</label>
              <input id="bh-filter-date-to" type="date" className="bh-filter-input" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Diesel Type</label>
              <select id="bh-filter-diesel" className="bh-filter-select" value={filterDiesel} onChange={e => setFilterDiesel(e.target.value)}>
                <option value="">All</option>
                <option value="WITH_OWNER">With Diesel</option>
                <option value="PARTY">Party Diesel</option>
              </select>
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Cable</label>
              <select id="bh-filter-cable" className="bh-filter-select" value={filterCable} onChange={e => setFilterCable(e.target.value)}>
                <option value="">All</option>
                <option value="yes">Cable Required</option>
                <option value="no">— No Cable</option>
              </select>
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Operator</label>
              <select id="bh-filter-operator" className="bh-filter-select" value={filterOperator} onChange={e => setFilterOperator(e.target.value)}>
                <option value="">All Operators</option>
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Payment Status</label>
              <select id="bh-filter-payment" className="bh-filter-select" value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)}>
                <option value="">All Payment Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Amount ≥ (₹)</label>
              <input id="bh-filter-amt-min" type="number" className="bh-filter-input" placeholder="Min amount" value={filterAmtMin} onChange={e => setFilterAmtMin(e.target.value)} min="0" />
            </div>

            <div className="bh-filter-field">
              <label className="bh-filter-label">Amount ≤ (₹)</label>
              <input id="bh-filter-amt-max" type="number" className="bh-filter-input" placeholder="Max amount" value={filterAmtMax} onChange={e => setFilterAmtMax(e.target.value)} min="0" />
            </div>
          </div>
          <div className="bh-filter-actions">
            <span className="bh-results-count">
              Showing <strong>{filtered.length}</strong> of <strong>{allOrders.length}</strong> completed bill{allOrders.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bh-stats-bar">
          <div className="bh-stat-card">
            <div className="bh-stat-label">Bills Shown</div>
            <div className="bh-stat-value">{stats.count}</div>
            <div className="bh-stat-sub">Completed invoices</div>
          </div>
          <div className="bh-stat-card">
            <div className="bh-stat-label">Total Revenue</div>
            <div className="bh-stat-value" style={{ fontSize: 17 }}>{fmt(stats.total)}</div>
            <div className="bh-stat-sub">Net after discount</div>
          </div>
          <div className="bh-stat-card">
            <div className="bh-stat-label">With Diesel</div>
            <div className="bh-stat-value">{stats.withDiesel}</div>
            <div className="bh-stat-sub">Owner diesel orders</div>
          </div>
          <div className="bh-stat-card">
            <div className="bh-stat-label">With Cable</div>
            <div className="bh-stat-value">{stats.withCable}</div>
            <div className="bh-stat-sub">Cable charges applied</div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bh-table-wrap" style={{ padding: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bh-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="bh-empty">
            <div className="bh-empty-title">{error}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bh-table-wrap">
            <div className="bh-empty">
              <div className="bh-empty-title">No billing records found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {hasFilters ? 'Try adjusting or resetting your filters.' : 'Completed bills will appear here.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="bh-table-wrap">
            <table className="bh-table">
              <thead>
                <tr>
                  <th className="bh-th bh-th-sticky-left" style={{ width: 50, textAlign: 'center' }}>#</th>
                  <th className="bh-th">Bill No.</th>
                  <th className="bh-th">Order No.</th>
                  <th className="bh-th">Client</th>
                  <th className="bh-th">Contact</th>
                  <th className="bh-th">Function Date</th>
                  <th className="bh-th">Generator(s)</th>
                  <th className="bh-th" style={{ textAlign: 'center' }}>Diesel</th>
                  <th className="bh-th" style={{ textAlign: 'center' }}>Cable</th>
                  <th className="bh-th">Operator</th>
                  <th className="bh-th" style={{ textAlign: 'right' }}>Subtotal</th>
                  <th className="bh-th" style={{ textAlign: 'right' }}>Discount</th>
                  <th className="bh-th" style={{ textAlign: 'right' }}>Net Amount</th>
                  <th className="bh-th" style={{ textAlign: 'center' }}>Payment Status</th>
                  <th className="bh-th bh-th-sticky-right" style={{ textAlign: 'center', width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((order, idx) => {
                  const withDiesel = order.dieselType !== 'PARTY';
                  const genNames   = (order.generators || []).map(g => g.generatorName).filter(Boolean);
                  const netAmt     = parseFloat(order.finalAmount)    || 0;
                  const subtotal   = parseFloat(order.subtotal)       || 0;
                  const discount   = parseFloat(order.discountAmount) || 0;
                  const funcDate   = order.functionDate ||
                    (order.functionDateFrom && order.functionDateTo
                      ? `${order.functionDateFrom} to ${order.functionDateTo}` : '');

                  return (
                    <tr key={order.id} className="bh-tr">
                      <td className="bh-td bh-td-sticky-left" style={{ textAlign: 'center', color: 'var(--color-text-subtle)', fontWeight: 700 }}>
                        {page * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="bh-td">
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)', fontFamily: 'monospace' }}>
                          #{order.billNumber || '—'}
                        </span>
                      </td>
                      <td className="bh-td">
                        <span style={{ fontWeight: 600 }}>{order.orderNumber || order.id}</span>
                      </td>
                      <td className="bh-td">
                        <div style={{ fontWeight: 600 }}>{order.clientName || '—'}</div>
                      </td>
                      <td className="bh-td" style={{ color: 'var(--color-text-subtle)', fontFamily: 'monospace', fontSize: 12 }}>
                        {order.contactNumber || '—'}
                      </td>
                      <td className="bh-td" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                        {fmtRange(funcDate)}
                      </td>
                      <td className="bh-td">
                        {genNames.length === 0
                          ? <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                          : genNames.map((name, i) => (
                              <div key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-dark)', whiteSpace: 'nowrap' }}>
                                {name}
                              </div>
                            ))}
                      </td>
                      <td className="bh-td" style={{ textAlign: 'center' }}>
                        <span
                          className={`bh-badge ${withDiesel ? 'bh-badge-diesel-on' : 'bh-badge-diesel-off'}`}
                          title={withDiesel ? 'WD (With Diesel)' : 'PD (Party Diesel)'}
                          style={{ fontWeight: 800 }}
                        >
                          {withDiesel ? 'WD' : 'PD'}
                        </span>
                      </td>
                      <td className="bh-td" style={{ textAlign: 'center' }}>
                        {order.cableRequired
                          ? <span className="bh-badge bh-badge-cable-on">Yes</span>
                          : <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>—</span>}
                      </td>
                      <td className="bh-td" style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                        {order.operatorName || '—'}
                      </td>
                      <td className="bh-td" style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {fmt(subtotal)}
                      </td>
                      <td className="bh-td" style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: discount > 0 ? '#dc2626' : 'var(--color-text-muted)' }}>
                        {discount > 0 ? `−${fmt(discount)}` : '—'}
                      </td>
                      <td className="bh-td" style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                        {fmt(netAmt)}
                      </td>
                      <td className="bh-td" style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: order.paymentStatus === 'PAID' ? '#dcfce7' : order.paymentStatus === 'OVERDUE' ? '#fee2e2' : '#fef9c3',
                          color: order.paymentStatus === 'PAID' ? '#166534' : order.paymentStatus === 'OVERDUE' ? '#991b1b' : '#854d0e',
                          whiteSpace: 'nowrap'
                        }}>
                          {order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'OVERDUE' ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td className="bh-td bh-td-sticky-right" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            id={`bh-view-${order.id}`}
                            className="bh-action-btn bh-btn-view"
                            onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', order.id))}
                            title="View Billing Details"
                          >
                            <Icon.Eye />
                          </button>
                          <button
                            id={`bh-print-${order.id}`}
                            className="bh-action-btn bh-btn-print"
                            onClick={() => handlePrint(order)}
                            title="Print Invoice"
                          >
                            <Icon.Printer />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bh-pagination">
                <span className="bh-page-info">
                  Page {page + 1} of {totalPages} &nbsp;·&nbsp; {filtered.length} records
                </span>
                <div className="bh-page-btns">
                  <button className="bh-page-btn" disabled={page === 0} onClick={() => setPage(0)} title="First page">«</button>
                  <button className="bh-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)} title="Previous page">
                    <Icon.ChevronLeft />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                    const pg = start + i;
                    return (
                      <button
                        key={pg}
                        className="bh-page-btn"
                        style={pg === page ? { background:'var(--color-primary)', color:'#fff', borderColor:'var(--color-primary)' } : {}}
                        onClick={() => setPage(pg)}
                      >
                        {pg + 1}
                      </button>
                    );
                  })}
                  <button className="bh-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} title="Next page">
                    <Icon.ChevronRight />
                  </button>
                  <button className="bh-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} title="Last page">»</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

