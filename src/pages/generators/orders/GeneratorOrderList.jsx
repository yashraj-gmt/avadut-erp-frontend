// src/pages/generators/orders/GeneratorOrderList.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DateRangePicker from './DateRangePicker';
import {
  fmtDate,
  formatToDMY,
  formatRangeToDMY,
  parseDateStr,
  MOCK_BILLS,
} from './mockData';
import { generatorOrderService } from '@/services/generatorOrderService';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  Search: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Receipt: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M16 8H8"/>
      <path d="M16 12H8"/>
      <path d="M15 16H9"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Zap: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  Filter: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Cable: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 12h16M4 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
      <path d="M8 6v-2M16 6v-2M8 18v2M16 18v2M8 6h8M8 18h8"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  ClipboardEmpty: () => (
    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes go-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes go-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes go-modal-in { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }

  .go-page {
    min-height: 100vh;
    background: var(--color-bg);
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    padding: 28px 32px;
  }

  /* ── Header ── */
  .go-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .go-page-title { font-size:clamp(18px,3vw,22px); font-weight:700; color:var(--color-text); letter-spacing:-.4px; margin:0; }
  .go-breadcrumb { font-size:13px; color:var(--color-text-subtle); margin:3px 0 0; }
  .go-breadcrumb a { color:var(--color-primary); text-decoration:none; }

  .go-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  .go-availability-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
    color: #ffffff !important;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.28);
    transition: all .2s ease;
    white-space: nowrap;
    font-family: inherit;
    text-decoration: none;
  }
  .go-availability-btn:hover {
    background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(220, 38, 38, 0.38);
  }

  .go-add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: #fff !important;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: all .2s ease;
    white-space: nowrap;
    font-family: inherit;
    text-decoration: none;
  }
  .go-add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(37,99,235,.35);
  }

  /* ── Stats / Tabs ── */
  .go-stats-row { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; margin-bottom:24px; }
  .go-stat-card {
    background:var(--color-surface);
    border:1.5px solid var(--color-border);
    border-radius:var(--radius-xl);
    padding:14px 14px;
    box-shadow:var(--shadow-sm);
    display:flex;
    align-items:center;
    gap:10px;
    cursor:pointer;
    transition:all .2s ease;
    user-select:none;
    position:relative;
    overflow:hidden;
    min-width:0;
  }
  .go-stat-card:hover {
    transform:translateY(-2px);
    box-shadow:var(--shadow-md);
    border-color:var(--color-border);
  }
  .go-stat-card.active {
    border-color:var(--color-primary);
    background:linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.02) 100%);
    box-shadow:0 4px 14px rgba(37,99,235,0.18);
  }
  .go-stat-card.active .go-stat-value {
    color:var(--color-primary);
  }
  .go-stat-value { font-size:22px; font-weight:800; color:var(--color-text); line-height:1.1; transition:color .2s; }
  .go-stat-label { font-size:11px; color:var(--color-text-muted); margin-top:3px; font-weight:600; text-transform:uppercase; letter-spacing:.4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .go-stat-sublabel { font-size:10px; color:var(--color-text-subtle); margin-top:2px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  /* ── Toolbar ── */
  .go-toolbar { display:grid; grid-template-columns:1.5fr 1fr 1fr auto; gap:12px; margin-bottom:18px; align-items:center; }
  .go-search-wrap { position:relative; flex:1; min-width:180px; max-width:360px; }
  .go-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--color-text-subtle); pointer-events:none; display:flex; }
  .go-search-input {
    width:100%; padding:10px 14px 10px 36px;
    border:1.5px solid var(--color-border); border-radius:var(--radius-md);
    font-size:14px; color:var(--color-text); background:var(--color-surface);
    outline:none; transition:border-color .2s,box-shadow .2s; font-family:inherit;
  }
  .go-search-input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(37,99,235,.15); }
  .go-filter-select {
    padding:10px 14px; border:1.5px solid var(--color-border); border-radius:var(--radius-md);
    font-size:14px; color:var(--color-text-muted); background:var(--color-surface);
    cursor:pointer; outline:none; min-width:140px; font-family:inherit; transition:border-color .2s;
  }
  .go-filter-select:focus { border-color:var(--color-primary); }
  .go-result-count { font-size:13px; color:var(--color-text-muted); margin-left:auto; white-space:nowrap; }

  /* ── Card / Table ── */
  .go-card { background:var(--color-surface); border-radius:var(--radius-xl); box-shadow:var(--shadow-md); overflow:hidden; }
  .go-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; position:relative; }
  .go-table { width:100%; border-collapse:separate; border-spacing:0; }
  .go-thead { background:var(--color-surface-2); border-bottom:1.5px solid var(--color-border); }
  .go-row { border-bottom:1px solid var(--color-surface-2); transition:background .15s; }
  .go-row:hover td { background:rgba(37,99,235,.04) !important; }
  .go-row:hover .go-td-sticky-left,
  .go-row:hover .go-td-sticky-right { background:#f0f7ff !important; }
  .go-row:last-child { border-bottom:none; }
  .go-action-btn { transition:transform .15s; }
  .go-action-btn:hover:not(:disabled) { transform:scale(1.1); }

  /* ── Sticky Columns ── */
  .go-th-sticky-left, .go-td-sticky-left {
    position: sticky;
    left: 0;
    z-index: 2;
    box-shadow: 2px 0 6px -1px rgba(0,0,0,.08);
    border-right: 1.5px solid var(--color-border) !important;
  }
  .go-th-sticky-left {
    background: var(--color-surface-2) !important;
    z-index: 4;
  }
  .go-th-sticky-right, .go-td-sticky-right {
    position: sticky;
    right: 0;
    z-index: 2;
    box-shadow: -2px 0 6px -1px rgba(0,0,0,.08);
    border-left: 1.5px solid var(--color-border) !important;
  }
  .go-th-sticky-right {
    background: var(--color-surface-2) !important;
    z-index: 4;
  }

  /* ── Pagination ── */
  .go-pagination {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 20px; border-top:1px solid var(--color-border);
    background:var(--color-surface-2); flex-wrap:wrap; gap:10px;
  }

  /* ── Mobile cards ── */
  .go-mobile-list { display:none; padding:12px; }
  .go-mobile-card {
    background:var(--color-surface); border:1px solid var(--color-border);
    border-radius:var(--radius-lg); padding:14px 16px; margin-bottom:10px;
    animation:go-fadein .25s ease;
  }
  .go-mobile-card:last-child { margin-bottom:0; }
  .go-mc-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .go-mc-title { font-weight:700; color:var(--color-text); font-size:14px; }
  .go-mc-sub { font-size:12px; color:var(--color-text-subtle); margin-top:1px; }
  .go-mc-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; margin-bottom:10px; }
  .go-mc-field label { font-size:10px; color:var(--color-text-subtle); font-weight:600; text-transform:uppercase; letter-spacing:.4px; }
  .go-mc-field span { display:block; font-size:13px; color:var(--color-text); font-weight:500; margin-top:2px; }
  .go-mc-actions { display:flex; gap:6px; justify-content:flex-end; padding-top:8px; border-top:1px solid var(--color-surface-2); }

  /* ── Skeleton ── */
  .go-skeleton { height:14px; border-radius:6px; background:var(--color-border); animation:go-pulse 1.5s ease-in-out infinite; }

  /* ── Delete Modal ── */
  .go-overlay {
    position:fixed; inset:0; background:rgba(15,23,42,.5);
    backdrop-filter:blur(2px); z-index:9000;
    display:flex; align-items:center; justify-content:center; padding:16px;
  }
  .go-modal {
    background:var(--color-surface); border-radius:var(--radius-xl);
    padding:32px; max-width:420px; width:100%;
    box-shadow:0 20px 60px rgba(0,0,0,.25);
    animation:go-modal-in .2s ease;
  }
  .go-modal-icon { width:52px; height:52px; border-radius:50%; background:#FEE2E2; display:flex; align-items:center; justify-content:center; margin-bottom:16px; color:#DC2626; }
  .go-modal-title { font-size:18px; font-weight:700; color:var(--color-text); margin:0 0 8px; }
  .go-modal-body { font-size:14px; color:var(--color-text-muted); margin:0 0 24px; line-height:1.6; }
  .go-modal-actions { display:flex; gap:10px; justify-content:flex-end; }

  /* ── Responsive ── */
  @media (max-width:1400px) {
    .go-toolbar { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; }
  }
  @media (max-width:850px) {
    .go-stats-row { grid-template-columns:repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width:639px) {
    .go-page { padding:16px; }
    .go-header { flex-direction:column; align-items:stretch; gap:12px; margin-bottom:16px; }
    .go-header-actions { display:flex; flex-direction:row; align-items:center; gap:8px; width:100%; }
    .go-availability-btn, .go-add-btn {
      flex: 1;
      padding: 9px 8px;
      font-size: 12px;
      gap: 5px;
      justify-content: center;
    }
    .go-stats-row { grid-template-columns:1fr !important; gap:10px; margin-bottom:16px; }
    .go-stat-card { padding:10px 10px; gap:8px; }
    .go-stat-value { font-size:18px; }
    .go-stat-label { font-size:9.5px; }
    .go-stat-sublabel { font-size:9px; }
    .go-toolbar { grid-template-columns: 1fr !important; gap:8px; margin-bottom:14px; }
    .go-search-wrap { max-width:none; min-width:0; }
    .go-filter-select { flex:1; min-width:0 !important; }
    .go-result-count { margin-left:0; }
    .go-table-wrap { display:none; }
    .go-mobile-list { display:block; }
    .go-pagination { padding:12px 16px; }
  }
  @media (max-width:480px) {
    .go-stats-row { grid-template-columns:1fr !important; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const thStyle = { padding:'12px 16px', textAlign:'left', fontSize:11.5, fontWeight:700, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' };
const tdStyle = { padding:'13px 16px', fontSize:14, color:'var(--color-text)', verticalAlign:'middle' };

const actionBtn = (variant) => ({
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:32, height:32, borderRadius:8, border:'none', cursor:'pointer',
  background: variant==='blue' ? 'var(--color-primary-100)' : variant==='amber' ? '#FEF3C7' : variant==='emerald' ? '#D1FAE5' : '#FEE2E2',
  color:       variant==='blue' ? 'var(--color-primary)'     : variant==='amber' ? '#92400E'  : variant==='emerald' ? '#065F46' : '#DC2626',
  transition:'all .15s',
});

const pageBtn = (active) => ({
  width:34, height:34, borderRadius:8,
  border: active ? 'none' : '1.5px solid var(--color-border)',
  background: active ? 'var(--color-primary)' : 'var(--color-surface)',
  color: active ? '#fff' : 'var(--color-text)',
  fontSize:13, fontWeight:600, cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
});



function SkeletonRow({ cols }) {
  return (
    <tr style={{ borderBottom:'1px solid var(--color-surface-2)' }}>
      {Array.from({ length: cols }).map((_, i) => {
        const isFirst = i === 0;
        const isLast = i === cols - 1;
        return (
          <td
            key={i}
            className={isFirst ? 'go-td-sticky-left' : isLast ? 'go-td-sticky-right' : ''}
            style={{ padding:'16px', background:'var(--color-surface)' }}
          >
            <div className="go-skeleton" style={{ width:`${50+(i%4)*12}%` }} />
          </td>
        );
      })}
    </tr>
  );
}

function StatCard({ label, subtitle, value, icon: IconComponent, iconBg, iconColor, active, onClick }) {
  return (
    <div
      className={`go-stat-card ${active ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`Filter by ${label}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{
        padding: '16px 20px',
        gap: '14px',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <IconComponent />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="go-stat-value" style={{ fontSize: 24 }}>{value}</div>
        <div className="go-stat-label" style={{ fontSize: 12 }}>{label}</div>
        {subtitle && <div className="go-stat-sublabel" style={{ fontSize: 11 }}>{subtitle}</div>}
      </div>
      {active && (
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)',
          position: 'absolute', top: 14, right: 14
        }} />
      )}
    </div>
  );
}

function StatusChip({ bg, color, label }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11.5px',
      fontWeight: '700',
      background: bg,
      color: color,
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  );
}

const isTodayOrder = (o) => {
  if (!o) return false;
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayDMY = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

  // Created today (only count newly created orders)
  if (o.createdAt) {
    const createdStr = typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt).toISOString();
    if (createdStr.startsWith(todayYMD)) return true;
    const cDate = parseDateStr(createdStr);
    if (cDate) {
      const cYMD = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
      if (cYMD === todayYMD) return true;
    }
  }
  if (o.createdDate && (o.createdDate.startsWith(todayYMD) || o.createdDate.startsWith(todayDMY))) return true;
  if (o.bookingDate && (o.bookingDate.startsWith(todayYMD) || o.bookingDate.startsWith(todayDMY))) return true;

  return false;
};

/** Checks if the order's function date specifically matches / overlaps today's date */
const isTodayFunctionDate = (o) => {
  if (!o) return false;
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayDMY = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

  // Exact function date match
  if (o.functionDateFrom && (o.functionDateFrom.startsWith(todayYMD) || o.functionDateFrom.startsWith(todayDMY))) return true;
  if (o.functionDate && (o.functionDate.includes(todayYMD) || o.functionDate.includes(todayDMY))) return true;

  // Range contains today
  const fFrom = o.functionDateFrom ? parseDateStr(o.functionDateFrom) : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[0]) : null);
  const fTo   = o.functionDateTo   ? parseDateStr(o.functionDateTo)   : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[1] || o.functionDate) : null);

  if (fFrom && fTo) {
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const fromZero  = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate()).getTime();
    const toZero    = new Date(fTo.getFullYear(), fTo.getMonth(), fTo.getDate()).getTime();
    if (todayZero >= fromZero && todayZero <= toZero) return true;
  }
  return false;
};

/** Checks if the generators were marked as physically returned today */
const isReturnedToday = (o) => {
  if (!o || o.orderStatus !== 'COMPLETED' || !o.returnedAt) return false;
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const returnedStr = typeof o.returnedAt === 'string' ? o.returnedAt : new Date(o.returnedAt).toISOString();
  if (returnedStr.startsWith(todayYMD)) return true;

  const rDate = parseDateStr(returnedStr);
  if (rDate) {
    const rYMD = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(rDate.getDate()).padStart(2, '0')}`;
    return rYMD === todayYMD;
  }
  return false;
};

/** Helper to check if an order belongs to Last 7 Days (ongoing, function date within last 7 days, or recently completed) */
const isLast7DaysOrder = (o) => {
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

  // 1. Function Date check (ongoing or falls within last 7 days)
  const fFrom = o.functionDateFrom
    ? parseDateStr(o.functionDateFrom)
    : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[0]) : null);
  const fTo = o.functionDateTo
    ? parseDateStr(o.functionDateTo)
    : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[1] || o.functionDate) : null);

  if (fFrom && fTo) {
    const fromTime = new Date(fFrom.getFullYear(), fFrom.getMonth(), fFrom.getDate()).getTime();
    const toTime = new Date(fTo.getFullYear(), fTo.getMonth(), fTo.getDate()).getTime();

    // Ongoing today
    if (fromTime <= todayEnd && toTime >= todayStart) {
      return true;
    }
    // Function date intersects last 7 days
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

/* ─── Main Component ─────────────────────────────────────────────────────── */
const PAGE_SIZE = 50;

export default function GeneratorOrderList() {
  const navigate = useNavigate();

  // Data state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  // UI state
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [paymentModalTarget, setPaymentModalTarget] = useState(null);
  const [markingPaid, setMarkingPaid]   = useState(false);
  const [activeTab, setActiveTab]       = useState('last_7_days'); // 'last_7_days' | 'all'

  // Filters state
  const [filterDate, setFilterDate]                   = useState('');
  const [filterBillingStatus, setFilterBillingStatus] = useState('all');
  const [markReturnedTarget, setMarkReturnedTarget] = useState(null);
  const [markingReturned, setMarkingReturned]       = useState(false);
  const hasFilters = search !== '' || filterDate !== '' || filterBillingStatus !== 'all' || activeTab !== 'last_7_days';

  // Fetch data
  React.useEffect(() => {
    setLoading(true);
    generatorOrderService.getAll(search, '', page - 1, PAGE_SIZE)
      .then(res => {
        const fetched = res?.content || [];
        if (fetched.length === 0 && (!search && filterBillingStatus === 'all' && filterBookingStatus === 'all' && !filterDate) && mockOrders && mockOrders.length > 0) {
          setOrders(mockOrders);
          setTotalElements(mockOrders.length);
        } else {
          setOrders(fetched);
          setTotalElements(res?.totalElements || fetched.length);
        }
      })
      .catch(err => {
        console.error('Failed to fetch orders:', err);
        if (mockOrders && mockOrders.length > 0) {
          setOrders(mockOrders);
          setTotalElements(mockOrders.length);
        }
      })
      .finally(() => setLoading(false));
  }, [page, search, filterBillingStatus, filterDate]);

  // Filtered locally for tab selection, billing status and date (safeguard)
  const filtered = useMemo(() => {
    let result = orders.filter(o => {
      // Tab Filter
      if (activeTab === 'last_7_days' && !isLast7DaysOrder(o)) return false;

      // 1. Billing Status Match
      const isBilled = o.billingStatus === 'COMPLETED';
      if (filterBillingStatus === 'pending' && isBilled) return false;
      if (filterBillingStatus === 'completed' && !isBilled) return false;

      // 2. Function Date Range Match
      if (filterDate && filterDate.includes(' to ')) {
        const [selFromStr, selToStr] = filterDate.split(' to ');
        const selFrom = parseDateStr(selFromStr);
        const selTo = parseDateStr(selToStr);
        if (selFrom) selFrom.setHours(0, 0, 0, 0);
        if (selTo) selTo.setHours(23, 59, 59, 999);

        const orderFrom = o.functionDateFrom ? parseDateStr(o.functionDateFrom) : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[0]) : null);
        const orderTo = o.functionDateTo ? parseDateStr(o.functionDateTo) : (o.functionDate ? parseDateStr(o.functionDate.split(' to ')[1] || o.functionDate) : null);
        if (orderFrom) orderFrom.setHours(0, 0, 0, 0);
        if (orderTo) orderTo.setHours(23, 59, 59, 999);

        if (orderFrom && orderTo && selFrom && selTo) {
          const intersects = orderFrom <= selTo && orderTo >= selFrom;
          if (!intersects) return false;
        } else {
          return false;
        }
      }

      // 2. Search Filter (Client Name, Order No, Operator Name, Generator Name)
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();

        // Client Name
        const matchClient = (o.clientName && String(o.clientName).toLowerCase().includes(q)) ||
                            (o.customer?.name && String(o.customer.name).toLowerCase().includes(q));

        // Order Number / Bill Number
        const matchOrderNo = (o.id != null && String(o.id).toLowerCase().includes(q)) ||
                             (o.orderNumber != null && String(o.orderNumber).toLowerCase().includes(q)) ||
                             (o.billNumber != null && String(o.billNumber).toLowerCase().includes(q));

        // Operator Name
        const matchOperator = (o.operatorName && String(o.operatorName).toLowerCase().includes(q)) ||
                              (o.assignedToName && String(o.assignedToName).toLowerCase().includes(q)) ||
                              (o.generators && o.generators.some(g => g.operatorName && String(g.operatorName).toLowerCase().includes(q)));

        // Generator Name / Model / Code
        const matchGenerator = (o.generatorName && String(o.generatorName).toLowerCase().includes(q)) ||
                               (o.generators && o.generators.some(g =>
                                 (g.generatorName && String(g.generatorName).toLowerCase().includes(q)) ||
                                 (g.generatorId && String(g.generatorId).toLowerCase().includes(q)) ||
                                 (g.name && String(g.name).toLowerCase().includes(q))
                               )) ||
                               (o.orderItems && o.orderItems.some(i =>
                                 (i.productName && String(i.productName).toLowerCase().includes(q)) ||
                                 (i.generator?.name && String(i.generator.name).toLowerCase().includes(q))
                               ));

        if (!matchClient && !matchOrderNo && !matchOperator && !matchGenerator) {
          return false;
        }
      }

      return true;
    });

    // If on Last 7 Days tab, prioritize ongoing orders at top, then recent function dates
    if (activeTab === 'last_7_days') {
      result.sort((a, b) => {
        const aOngoing = (a.orderStatus === 'IN_PROGRESS' || a.status === 'IN_PROGRESS' || isTodayFunctionDate(a)) && a.orderStatus !== 'COMPLETED';
        const bOngoing = (b.orderStatus === 'IN_PROGRESS' || b.status === 'IN_PROGRESS' || isTodayFunctionDate(b)) && b.orderStatus !== 'COMPLETED';
        if (aOngoing && !bOngoing) return -1;
        if (bOngoing && !aOngoing) return 1;

        const aFrom = a.functionDateFrom ? parseDateStr(a.functionDateFrom) : (a.functionDate ? parseDateStr(a.functionDate.split(' to ')[0]) : null);
        const bFrom = b.functionDateFrom ? parseDateStr(b.functionDateFrom) : (b.functionDate ? parseDateStr(b.functionDate.split(' to ')[0]) : null);
        const aTime = aFrom ? aFrom.getTime() : 0;
        const bTime = bFrom ? bFrom.getTime() : 0;
        return bTime - aTime;
      });
    }

    return result;
  }, [orders, search, activeTab, filterBillingStatus, filterDate]);

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const paged = filtered; // Since we already paginate from backend, paged is just filtered orders

  /* ── Delete ── */
  const handleDelete = () => {
    if (!deleteTarget) return;
    generatorOrderService.delete(deleteTarget.id).then(() => {
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      setTotalElements(prev => prev - 1);
      setDeleteTarget(null);
    });
  };

  /* ── Mark Payment as Done ── */
  const handleMarkPaymentDone = () => {
    if (!paymentModalTarget) return;
    setMarkingPaid(true);
    generatorOrderService.markPaymentDone(paymentModalTarget.id)
      .then(updated => {
        setOrders(prev => prev.map(o => o.id === paymentModalTarget.id ? { ...o, paymentStatus: 'PAID' } : o));
        setPaymentModalTarget(null);
      })
      .catch(err => {
        console.error('Failed to mark payment as done:', err);
        alert('Failed to update payment status. Please try again.');
      })
      .finally(() => setMarkingPaid(false));
  };

  /* ── Mark as Returned (Generators Released) ── */
  const handleMarkAsReturned = () => {
    if (!markReturnedTarget) return;
    setMarkingReturned(true);
    generatorOrderService.markAsReturned(markReturnedTarget.id)
      .then(() => {
        setOrders(prev => prev.map(o =>
          o.id === markReturnedTarget.id
            ? { ...o, orderStatus: 'COMPLETED', returnedAt: new Date().toISOString() }
            : o
        ));
        setMarkReturnedTarget(null);
      })
      .catch(err => {
        console.error('Failed to mark as returned:', err);
        alert('Failed to mark generators as returned. Please try again.');
      })
      .finally(() => setMarkingReturned(false));
  };

  /* ── Pagination pages ── */
  const pageNums = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1,2,3,4,5,'…',totalPages];
    if (page >= totalPages - 3) return [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,'…',page-1,page,page+1,'…',totalPages];
  })();

  /* ── Calculations for summary statistics / counts ── */
  const last7DaysCount = useMemo(() => {
    return orders.filter(isLast7DaysOrder).length;
  }, [orders]);

  // Inject styles on mount to avoid re-rendering <style> tag which causes focus loss in some React versions
  React.useEffect(() => {
    const styleId = 'go-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = STYLES;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <>
      <div className="go-page">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="go-header">
          <div>
            <h1 className="go-page-title">Generator Order Management</h1>
            <p className="go-breadcrumb">
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.DASHBOARD); }}>Home</a>
              {' › '}
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS); }}>Generators</a>
              {' › Orders'}
            </p>
          </div>
          <div className="go-header-actions">
            <button
              className="go-availability-btn"
              id="btn-stock-availability"
              onClick={() => navigate(ROUTES.GENERATOR_AVAILABILITY)}
            >
              <Icon.Calendar />
              <span>Check Stock Availability</span>
            </button>
            <button
              className="go-add-btn"
              id="btn-add-order"
              onClick={() => navigate(ROUTES.GENERATOR_ORDER_ADD)}
            >
              <Icon.Plus />
              <span>Add New Order</span>
            </button>
          </div>
        </div>

        {/* ── Tabs Section (Last 7 Days Orders & All Orders) ── */}
        <div className="go-stats-row">
          <StatCard
            label="Last 7 Days Orders"
            subtitle="Ongoing & recent bookings"
            value={last7DaysCount}
            icon={Icon.Calendar}
            iconBg="#EFF6FF"
            iconColor="var(--color-primary)"
            active={activeTab === 'last_7_days'}
            onClick={() => { setActiveTab('last_7_days'); setPage(1); }}
          />
          <StatCard
            label="All Orders"
            subtitle="Total orders across all pages"
            value={totalElements}
            icon={Icon.ClipboardList}
            iconBg="#F8FAFC"
            iconColor="#334155"
            active={activeTab === 'all'}
            onClick={() => { setActiveTab('all'); setPage(1); }}
          />
        </div>



        {/* ── Toolbar / Filters ───────────────────────────────── */}
        <div className="go-toolbar">
          <div className="go-search-wrap">
            <span className="go-search-icon"><Icon.Search /></span>
            <input
              id="input-order-search"
              className="go-search-input"
              placeholder="Search client, order no, operator, generator name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div>
            <DateRangePicker
              value={filterDate}
              onChange={val => { setFilterDate(val); setPage(1); }}
              placeholder="Filter by Function Date"
              minDate={null}
              align="right"
            />
          </div>

          <div>
            <select
              className="go-filter-select"
              style={{ width: '100%', minWidth: 'auto' }}
              value={filterBillingStatus}
              onChange={e => { setFilterBillingStatus(e.target.value); setPage(1); }}
            >
              <option value="all">Billing: All</option>
              <option value="pending">Billing: Pending</option>
              <option value="completed">Billing: Completed</option>
            </select>
          </div>

          {hasFilters && (
            <button
              id="btn-clear-filters"
              onClick={() => {
                setSearch('');
                setFilterDate('');
                setFilterBillingStatus('all');
                setActiveTab('last_7_days');
                setPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                borderRadius: 'var(--radius-md)',
                color: '#DC2626',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
                height: '42px',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap'
              }}
              className="go-action-btn"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* ── Main Card ──────────────────────────────────────── */}
        <div className="go-card">
          {/* Desktop Table */}
          <div className="go-table-wrap">
            <table className="go-table">
              <thead className="go-thead">
                <tr>
                  <th className="go-th-sticky-left" style={{ ...thStyle, width:54, textAlign:'center' }}>Sr. No.</th>
                  <th style={thStyle}>Generator Name</th>
                  <th style={thStyle}>Order No.</th>
                  <th style={thStyle}>Client Name</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Site Address</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Diesel Type</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Cable</th>
                  <th style={thStyle}>Operator Name</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Function Date</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Booking Status</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Billing Status</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Payment Status</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Billing Number</th>
                  <th className="go-th-sticky-right" style={{ ...thStyle, textAlign:'center', width:230 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={15} />)
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ padding:'64px 20px', textAlign:'center' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'var(--color-text-subtle)' }}>
                        <Icon.ClipboardEmpty />
                        <div style={{ fontWeight:600, color:'var(--color-text-muted)', fontSize:15 }}>
                          {search || filterDate || filterBillingStatus !== 'all' || activeTab !== 'all'
                            ? 'No orders match your search or filters'
                            : 'No orders yet'}
                        </div>
                        <div style={{ fontSize:13, color:'var(--color-text-subtle)' }}>
                          {search || filterDate || filterBillingStatus !== 'all' || activeTab !== 'all'
                            ? 'Try adjusting your search query or clear filters'
                            : 'Click "Add New Order" to create your first generator order'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : paged.map((o, i) => {
                  const gens = o.generators || [];
                  const firstName = gens[0]?.generatorName || '—';
                  const extra    = gens.length > 1 ? ` +${gens.length - 1} more` : '';
                  const isBilled = o.billingStatus === 'COMPLETED';
                  const orderBookingStatus = o.orderStatus === 'CONFIRMED' ? 'Confirmed' : (o.bookingStatus || 'Booked');
                  const isWithDiesel = o.withDiesel !== false && o.dieselType !== 'PARTY';
                  const hasCable = o.cableRequired !== false;
                  const billNum = o.billNumber || o.billingNumber;
                  const rowBg = i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)';

                  return (
                  <tr
                    key={o.id}
                    className="go-row"
                    style={{ background: rowBg }}
                  >
                    {/* 1. Sr. No. (Sticky Left) */}
                    <td className="go-td-sticky-left" style={{ ...tdStyle, color:'var(--color-text-subtle)', fontSize:13, width:54, textAlign:'center', background: rowBg }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>

                    {/* 2. Generator Name */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight:600, fontSize:13, whiteSpace:'nowrap' }}>{firstName}</div>
                      {extra && (
                        <div style={{ fontSize:11, color:'var(--color-primary)', fontWeight:600, marginTop:1, whiteSpace:'nowrap' }}>
                          {extra}
                        </div>
                      )}
                    </td>

                    {/* 3. Order No. */}
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily:'monospace', fontWeight:700, fontSize:12.5,
                        background:'var(--color-primary-100)', color:'var(--color-primary-dark)',
                        padding:'2px 8px', borderRadius:6, whiteSpace:'nowrap'
                      }}>
                        {o.orderNumber || `#${o.id}`}
                      </span>
                    </td>

                    {/* 4. Client Name */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight:600, whiteSpace:'nowrap' }}>{o.clientName || '—'}</div>
                    </td>

                    {/* 5. Contact */}
                    <td style={{ ...tdStyle, whiteSpace:'nowrap' }}>
                      {o.contactNumber || '—'}
                    </td>

                    {/* 6. Site Address */}
                    <td style={tdStyle}>
                      <div
                        style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        title={o.siteAddress || '—'}
                      >
                        {o.siteAddress || '—'}
                      </div>
                    </td>

                    {/* 7. Diesel Type [PD / WD] */}
                    <td style={{ ...tdStyle, textAlign:'center', whiteSpace:'nowrap' }}>
                      <span
                        title={isWithDiesel ? 'WD (With Diesel)' : 'PD (Party Diesel)'}
                        style={{
                          display:'inline-block',
                          padding:'3px 10px',
                          borderRadius:'6px',
                          fontSize:'11.5px',
                          fontWeight:'800',
                          background: isWithDiesel ? '#DBEAFE' : '#FEF3C7',
                          color: isWithDiesel ? '#1E40AF' : '#92400E',
                          letterSpacing:'.5px',
                          whiteSpace:'nowrap'
                        }}
                      >
                        {isWithDiesel ? 'WD' : 'PD'}
                      </span>
                    </td>

                    {/* 8. Cable (Yes/No) */}
                    <td style={{ ...tdStyle, textAlign:'center', whiteSpace:'nowrap' }}>
                      <span style={{
                        display:'inline-block',
                        padding:'2px 8px',
                        borderRadius:'6px',
                        fontSize:'11.5px',
                        fontWeight:'700',
                        background: hasCable ? '#D1FAE5' : '#FEE2E2',
                        color: hasCable ? '#065F46' : '#991B1B',
                      }}>
                        {hasCable ? 'Yes' : 'No'}
                      </span>
                    </td>

                    {/* 9. Operator Name */}
                    <td style={{ ...tdStyle, whiteSpace:'nowrap' }}>
                      {o.operatorName || '—'}
                    </td>

                    {/* 10. Function Date */}
                    <td style={{ ...tdStyle, textAlign:'center', fontSize:13, fontWeight:500, color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>
                      {formatRangeToDMY(o.functionDate || (o.functionDateFrom && o.functionDateTo ? `${o.functionDateFrom} to ${o.functionDateTo}` : o.functionDateFrom))}
                    </td>

                    {/* 11. Booking Status */}
                    <td style={{ ...tdStyle, textAlign:'center' }}>
                      {o.orderStatus === 'COMPLETED' ? (
                        <StatusChip bg="#ECFDF5" color="#059669" label="Returned" />
                      ) : (
                        <StatusChip
                          bg={orderBookingStatus === 'Confirmed' ? '#D1FAE5' : '#DBEAFE'}
                          color={orderBookingStatus === 'Confirmed' ? '#065F46' : '#1E40AF'}
                          label={orderBookingStatus}
                        />
                      )}
                    </td>

                    {/* 12. Billing Status */}
                    <td style={{ ...tdStyle, textAlign:'center' }}>
                      <StatusChip
                        bg={isBilled ? '#E0F2FE' : '#FEF3C7'}
                        color={isBilled ? '#0369A1' : '#92400E'}
                        label={isBilled ? 'Completed' : 'Pending'}
                      />
                    </td>

                    {/* 13. Payment Status */}
                    <td style={{ ...tdStyle, textAlign:'center' }}>
                      <StatusChip
                        bg={o.paymentStatus === 'PAID' ? '#D1FAE5' : o.paymentStatus === 'OVERDUE' ? '#FEE2E2' : '#FEF3C7'}
                        color={o.paymentStatus === 'PAID' ? '#065F46' : o.paymentStatus === 'OVERDUE' ? '#991B1B' : '#92400E'}
                        label={o.paymentStatus === 'PAID' ? 'Paid' : o.paymentStatus === 'OVERDUE' ? 'Overdue' : 'Pending'}
                      />
                    </td>

                    {/* 13. Billing Number (empty/dash until Billing Status is Completed) */}
                    <td style={{ ...tdStyle, textAlign:'center', whiteSpace:'nowrap' }}>
                      {isBilled && billNum ? (
                        <span style={{
                          fontFamily:'monospace', fontWeight:700, fontSize:12.5,
                          background:'#E0F2FE', color:'#0369A1',
                          padding:'2px 8px', borderRadius:6,
                        }}>
                          {billNum}
                        </span>
                      ) : (
                        <span style={{ color:'var(--color-text-subtle)' }}>—</span>
                      )}
                    </td>

                    {/* 15. Actions (Sticky Right) */}
                    <td className="go-td-sticky-right" style={{ ...tdStyle, textAlign:'center', width:230, background: rowBg }}>
                      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                        <button
                          className="go-action-btn"
                          style={actionBtn('blue')}
                          title="View Order"
                          id={`btn-view-${o.id}`}
                          onClick={() => navigate(ROUTES.GENERATOR_ORDER_DETAIL.replace(':id', o.id))}
                        >
                          <Icon.Eye />
                        </button>
                        <button
                          className="go-action-btn"
                          style={actionBtn('amber')}
                          title="Edit Order"
                          id={`btn-edit-${o.id}`}
                          onClick={() => navigate(ROUTES.GENERATOR_ORDER_EDIT.replace(':id', o.id))}
                        >
                          <Icon.Edit />
                        </button>
                        <button
                          className="go-action-btn"
                          style={actionBtn('emerald')}
                          title="Billing"
                          id={`btn-billing-${o.id}`}
                          onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', o.id))}
                        >
                          <Icon.Receipt />
                        </button>
                        <button
                          className="go-action-btn"
                          style={{
                            ...actionBtn(o.paymentStatus === 'PAID' ? 'emerald' : 'amber'),
                            position: 'relative',
                            border: o.paymentStatus === 'PAID' ? '1.5px solid #6EE7B7' : '1.5px solid #FCD34D',
                          }}
                          title={o.paymentStatus === 'PAID' ? 'Payment Completed (PAID)' : 'Mark Payment as Done'}
                          id={`btn-pay-${o.id}`}
                          onClick={() => setPaymentModalTarget(o)}
                        >
                          <Icon.Wallet />
                          {o.paymentStatus === 'PAID' ? (
                            <span
                              style={{
                                position: 'absolute', top: -3, right: -3,
                                width: 13, height: 13, borderRadius: '50%',
                                background: '#10B981', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 0 1.5px #fff'
                              }}
                              title="Payment Done"
                            >
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </span>
                          ) : (
                            <span
                              style={{
                                position: 'absolute', top: -3, right: -3,
                                width: 8, height: 8, borderRadius: '50%',
                                background: o.paymentStatus === 'OVERDUE' ? '#EF4444' : '#F59E0B',
                              }}
                              title={o.paymentStatus === 'OVERDUE' ? 'Overdue' : 'Pending'}
                            />
                          )}
                        </button>
                        <button
                          className="go-action-btn"
                          style={actionBtn('red')}
                          title="Delete Order"
                          id={`btn-delete-${o.id}`}
                          onClick={() => setDeleteTarget(o)}
                        >
                          <Icon.Trash />
                        </button>
                        {/* Mark as Returned button */}
                        {o.orderStatus !== 'CANCELLED' && (
                          <button
                            className="go-action-btn"
                            id={`btn-return-${o.id}`}
                            title={o.orderStatus === 'COMPLETED' ? 'Generators Returned (Stock Released)' : 'Mark Generators as Returned'}
                            style={{
                              display:'inline-flex', alignItems:'center', justifyContent:'center',
                              width:32, height:32, borderRadius:8,
                              border: o.orderStatus === 'COMPLETED' ? '1.5px solid #6EE7B7' : '1.5px solid #FCD34D',
                              cursor: o.orderStatus === 'COMPLETED' ? 'default' : 'pointer',
                              background: o.orderStatus === 'COMPLETED' ? '#ECFDF5' : '#FFFBEB',
                              color: o.orderStatus === 'COMPLETED' ? '#059669' : '#D97706',
                              position: 'relative',
                              transition:'all .15s',
                            }}
                            onClick={() => {
                              if (o.orderStatus !== 'COMPLETED') {
                                setMarkReturnedTarget(o);
                              }
                            }}
                          >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                            </svg>
                            {o.orderStatus === 'COMPLETED' ? (
                              <span
                                style={{
                                  position: 'absolute', top: -3, right: -3,
                                  width: 13, height: 13, borderRadius: '50%',
                                  background: '#10B981', color: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 0 0 1.5px #fff'
                                }}
                                title="Returned"
                              >
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                            ) : (
                              <span
                                style={{
                                  position: 'absolute', top: -3, right: -3,
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: '#F59E0B',
                                }}
                                title="Pending Return"
                              />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="go-mobile-list">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="go-mobile-card">
                  <div className="go-skeleton" style={{ width:'60%', marginBottom:8 }} />
                  <div className="go-skeleton" style={{ width:'40%', marginBottom:12 }} />
                  <div className="go-skeleton" style={{ width:'80%' }} />
                </div>
              ))
            ) : paged.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--color-text-subtle)' }}>
                <Icon.ClipboardEmpty />
                <div style={{ marginTop:10, fontWeight:600 }}>No orders found</div>
              </div>
            ) : paged.map(o => {
              const gens = o.generators || [];
              const firstName = gens[0]?.generatorName || '—';
              const isBilled = o.billingStatus === 'COMPLETED';
              const orderBookingStatus = o.orderStatus === 'CONFIRMED' ? 'Confirmed' : (o.bookingStatus || 'Booked');
              const isWithDiesel = o.withDiesel !== false && o.dieselType !== 'PARTY';
              const hasCable = o.cableRequired !== false;
              const billNum = o.billNumber || o.billingNumber;

              return (
              <div key={o.id} className="go-mobile-card">
                <div className="go-mc-header">
                  <div>
                    <div className="go-mc-title">{o.clientName || '—'}</div>
                    <div className="go-mc-sub">{o.orderNumber || `#${o.id}`}</div>
                  </div>
                </div>
                <div className="go-mc-grid">
                  <div className="go-mc-field">
                    <label>Generator Name</label>
                    <span style={{ fontWeight:600 }}>{firstName}</span>
                    {gens.length > 1 && (
                      <span style={{ fontSize:11, color:'var(--color-primary)', fontWeight:600, display:'block' }}>
                        +{gens.length - 1} more
                      </span>
                    )}
                  </div>
                  <div className="go-mc-field">
                    <label>Contact</label>
                    <span>{o.contactNumber || '—'}</span>
                  </div>
                  <div className="go-mc-field" style={{ gridColumn:'span 2' }}>
                    <label>Site Address</label>
                    <span>{o.siteAddress || '—'}</span>
                  </div>
                  <div className="go-mc-field">
                    <label>Diesel Type</label>
                    <span
                      title={isWithDiesel ? 'WD (With Diesel)' : 'PD (Party Diesel)'}
                      style={{
                        display:'inline-block',
                        padding:'2px 8px',
                        borderRadius:'4px',
                        fontSize:'11.5px',
                        fontWeight:'800',
                        background: isWithDiesel ? '#DBEAFE' : '#FEF3C7',
                        color: isWithDiesel ? '#1E40AF' : '#92400E',
                        marginTop:2
                      }}
                    >
                      {isWithDiesel ? 'WD' : 'PD'}
                    </span>
                  </div>
                  <div className="go-mc-field">
                    <label>Cable</label>
                    <span style={{
                      display:'inline-block',
                      padding:'2px 6px',
                      borderRadius:'4px',
                      fontSize:'11px',
                      fontWeight:'700',
                      background: hasCable ? '#D1FAE5' : '#FEE2E2',
                      color: hasCable ? '#065F46' : '#991B1B',
                      marginTop:2
                    }}>
                      {hasCable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="go-mc-field">
                    <label>Operator Name</label>
                    <span>{o.operatorName || '—'}</span>
                  </div>
                  <div className="go-mc-field">
                    <label>Function Date</label>
                    <span style={{ fontSize:12, fontWeight:500 }}>
                      {formatRangeToDMY(o.functionDate || (o.functionDateFrom && o.functionDateTo ? `${o.functionDateFrom} to ${o.functionDateTo}` : o.functionDateFrom))}
                    </span>
                  </div>
                  <div className="go-mc-field">
                    <label>Booking Status</label>
                    <StatusChip
                      bg={orderBookingStatus === 'Confirmed' ? '#D1FAE5' : '#DBEAFE'}
                      color={orderBookingStatus === 'Confirmed' ? '#065F46' : '#1E40AF'}
                      label={orderBookingStatus}
                    />
                  </div>
                  <div className="go-mc-field">
                    <label>Billing Status</label>
                    <StatusChip
                      bg={isBilled ? '#E0F2FE' : '#FEF3C7'}
                      color={isBilled ? '#0369A1' : '#92400E'}
                      label={isBilled ? 'Completed' : 'Pending'}
                    />
                  </div>
                  <div className="go-mc-field">
                    <label>Payment Status</label>
                    <StatusChip
                      bg={o.paymentStatus === 'PAID' ? '#D1FAE5' : o.paymentStatus === 'OVERDUE' ? '#FEE2E2' : '#FEF3C7'}
                      color={o.paymentStatus === 'PAID' ? '#065F46' : o.paymentStatus === 'OVERDUE' ? '#991B1B' : '#92400E'}
                      label={o.paymentStatus === 'PAID' ? 'Paid' : o.paymentStatus === 'OVERDUE' ? 'Overdue' : 'Pending'}
                    />
                  </div>
                  <div className="go-mc-field" style={{ gridColumn:'span 2' }}>
                    <label>Billing Number</label>
                    {isBilled && billNum ? (
                      <span style={{
                        fontFamily:'monospace', fontWeight:700, fontSize:12.5,
                        background:'#E0F2FE', color:'#0369A1',
                        padding:'2px 8px', borderRadius:6, display:'inline-block', marginTop:2
                      }}>
                        {billNum}
                      </span>
                    ) : (
                      <span style={{ color:'var(--color-text-subtle)' }}>—</span>
                    )}
                  </div>
                </div>
                <div className="go-mc-actions">
                  <button className="go-action-btn" style={actionBtn('blue')} title="View"
                    onClick={() => navigate(ROUTES.GENERATOR_ORDER_DETAIL.replace(':id', o.id))}>
                    <Icon.Eye />
                  </button>
                  <button className="go-action-btn" style={actionBtn('amber')} title="Edit"
                    onClick={() => navigate(ROUTES.GENERATOR_ORDER_EDIT.replace(':id', o.id))}>
                    <Icon.Edit />
                  </button>
                  <button className="go-action-btn" style={actionBtn('emerald')} title="Billing"
                    onClick={() => navigate(ROUTES.GENERATOR_ORDER_BILLING.replace(':id', o.id))}>
                    <Icon.Receipt />
                  </button>
                  <button
                    className="go-action-btn"
                    style={{
                      ...actionBtn(o.paymentStatus === 'PAID' ? 'emerald' : 'amber'),
                      position: 'relative',
                      border: o.paymentStatus === 'PAID' ? '1.5px solid #6EE7B7' : '1.5px solid #FCD34D',
                    }}
                    title={o.paymentStatus === 'PAID' ? 'Payment Completed (PAID)' : 'Mark Payment as Done'}
                    id={`btn-mob-pay-${o.id}`}
                    onClick={() => setPaymentModalTarget(o)}
                  >
                    <Icon.Wallet />
                    {o.paymentStatus === 'PAID' ? (
                      <span
                        style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 13, height: 13, borderRadius: '50%',
                          background: '#10B981', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 0 0 1.5px #fff'
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    ) : (
                      <span
                        style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 8, height: 8, borderRadius: '50%',
                          background: o.paymentStatus === 'OVERDUE' ? '#EF4444' : '#F59E0B',
                        }}
                      />
                    )}
                  </button>
                  <button className="go-action-btn" style={actionBtn('red')} title="Delete"
                    onClick={() => setDeleteTarget(o)}>
                    <Icon.Trash />
                  </button>
                  {/* Mobile Return button */}
                  {o.orderStatus !== 'CANCELLED' && (
                    <button
                      className="go-action-btn"
                      id={`btn-mob-return-${o.id}`}
                      title={o.orderStatus === 'COMPLETED' ? 'Generators Returned' : 'Mark Generators as Returned'}
                      style={{
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                        width:32, height:32, borderRadius:8,
                        border: o.orderStatus === 'COMPLETED' ? '1.5px solid #6EE7B7' : '1.5px solid #FCD34D',
                        cursor: o.orderStatus === 'COMPLETED' ? 'default' : 'pointer',
                        background: o.orderStatus === 'COMPLETED' ? '#ECFDF5' : '#FFFBEB',
                        color: o.orderStatus === 'COMPLETED' ? '#059669' : '#D97706',
                        position: 'relative',
                        transition:'all .15s',
                      }}
                      onClick={() => {
                        if (o.orderStatus !== 'COMPLETED') {
                          setMarkReturnedTarget(o);
                        }
                      }}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      {o.orderStatus === 'COMPLETED' ? (
                        <span
                          style={{
                            position: 'absolute', top: -3, right: -3,
                            width: 13, height: 13, borderRadius: '50%',
                            background: '#10B981', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 0 1.5px #fff'
                          }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      ) : (
                        <span
                          style={{
                            position: 'absolute', top: -3, right: -3,
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#F59E0B',
                          }}
                        />
                      )}
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {!loading && filtered.length > 0 && (
            <div className="go-pagination">
              <span style={{ fontSize:13, color:'var(--color-text-muted)' }}>
                Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <button
                  style={pageBtn(false)}
                  onClick={() => setPage(p => Math.max(1, p-1))}
                  disabled={page === 1}
                  id="btn-prev-page"
                >
                  <Icon.ChevronLeft />
                </button>
                {pageNums.map((n, i) =>
                  n === '…' ? (
                    <span key={`dots-${i}`} style={{ fontSize:14, color:'var(--color-text-subtle)', padding:'0 4px' }}>…</span>
                  ) : (
                    <button
                      key={n}
                      style={pageBtn(n === page)}
                      onClick={() => setPage(n)}
                      id={`btn-page-${n}`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  style={pageBtn(false)}
                  onClick={() => setPage(p => Math.min(totalPages, p+1))}
                  disabled={page === totalPages}
                  id="btn-next-page"
                >
                  <Icon.ChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Done Modal ───────────────────────── */}
      {paymentModalTarget && (
        <div className="go-overlay" onClick={() => setPaymentModalTarget(null)}>
          <div className="go-modal" onClick={e => e.stopPropagation()}>
            <div className="go-modal-icon" style={{ background: '#D1FAE5', color: '#065F46' }}>
              <Icon.Wallet />
            </div>
            <h3 className="go-modal-title">Mark Payment as Done</h3>
            <p className="go-modal-body">
              Are you sure you want to mark payment for order <strong>{paymentModalTarget.orderNumber || `#${paymentModalTarget.id}`}</strong> ({paymentModalTarget.clientName}) as <strong>PAID</strong>?
            </p>
            <div className="go-modal-actions">
              <button
                id="btn-cancel-pay"
                style={{
                  padding: '9px 18px', borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                  fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer'
                }}
                onClick={() => setPaymentModalTarget(null)}
                disabled={markingPaid}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-pay"
                style={{
                  padding: '9px 18px', borderRadius: 'var(--radius-md)',
                  border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
                  opacity: markingPaid ? 0.7 : 1
                }}
                onClick={handleMarkPaymentDone}
                disabled={markingPaid}
              >
                {markingPaid ? 'Updating...' : 'Yes, Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark as Returned Confirmation Modal ─────────────── */}
      {markReturnedTarget && (
        <div className="go-overlay" onClick={() => setMarkReturnedTarget(null)}>
          <div className="go-modal" onClick={e => e.stopPropagation()}>
            <div className="go-modal-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <h3 className="go-modal-title">Mark Generators as Returned?</h3>
            <p className="go-modal-body">
              This will mark all generators for order <strong>{markReturnedTarget.orderNumber || `#${markReturnedTarget.id}`}</strong>{' '}
              ({markReturnedTarget.clientName}) as <strong>physically returned</strong>.
              <br /><br />
              The generator units will be immediately released and available for new bookings.
              <br />
              <span style={{ color: '#059669', fontWeight: 600 }}>Billing is NOT affected</span> — it can still remain pending.
            </p>
            <div className="go-modal-actions">
              <button
                id="btn-cancel-return"
                style={{
                  padding: '9px 18px', borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                  fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer'
                }}
                onClick={() => setMarkReturnedTarget(null)}
                disabled={markingReturned}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-return"
                style={{
                  padding: '9px 18px', borderRadius: 'var(--radius-md)',
                  border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
                  opacity: markingReturned ? 0.7 : 1
                }}
                onClick={handleMarkAsReturned}
                disabled={markingReturned}
              >
                {markingReturned ? 'Releasing Stock...' : '✓ Yes, Mark as Returned'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="go-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="go-modal" onClick={e => e.stopPropagation()}>
            <div className="go-modal-icon">
              <Icon.AlertTriangle />
            </div>
            <h2 className="go-modal-title">Delete Order</h2>
            <p className="go-modal-body">
              Are you sure you want to delete order for{' '}
              <strong>{deleteTarget.clientName}</strong>? This action cannot be undone.
            </p>
            <div className="go-modal-actions">
              <button
                id="btn-cancel-delete"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding:'9px 20px', borderRadius:8, border:'1.5px solid var(--color-border)',
                  background:'var(--color-surface)', color:'var(--color-text)',
                  fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                }}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                onClick={handleDelete}
                style={{
                  padding:'9px 20px', borderRadius:8, border:'none',
                  background:'#DC2626', color:'#fff',
                  fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                  transition:'all .2s',
                }}
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
