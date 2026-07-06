// src/pages/generators/orders/GeneratorOrderList.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DateRangePicker from './DateRangePicker';
import {
  mockOrders as initialOrders,
  fmtDate,
  MOCK_BILLS,
} from './mockData';

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
  DollarSign: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
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
  .go-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
  .go-page-title { font-size:clamp(18px,3vw,22px); font-weight:700; color:var(--color-text); letter-spacing:-.4px; margin:0; }
  .go-breadcrumb { font-size:13px; color:var(--color-text-subtle); margin:3px 0 0; }
  .go-breadcrumb a { color:var(--color-primary); text-decoration:none; }
  .go-add-btn {
    display:flex; align-items:center; gap:7px;
    background:linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color:#fff; border:none; border-radius:var(--radius-md);
    padding:10px 18px; font-size:14px; font-weight:600;
    cursor:pointer; box-shadow:var(--shadow-md); transition:all .2s;
    white-space:nowrap; font-family:inherit;
  }
  .go-add-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,.35); }

  /* ── Stats ── */
  .go-stats-row { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:24px; }
  .go-stat-card { background:var(--color-surface); border-radius:var(--radius-lg); padding:16px 20px; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:14px; }
  .go-stat-value { font-size:24px; font-weight:800; color:var(--color-text); line-height:1.1; }
  .go-stat-label { font-size:11px; color:var(--color-text-muted); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }

  /* ── Toolbar ── */
  .go-toolbar { display:grid; grid-template-columns:1.2fr 1fr 0.8fr 0.8fr auto; gap:12px; margin-bottom:18px; align-items:center; }
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
  .go-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .go-table { width:100%; border-collapse:collapse; }
  .go-thead { background:var(--color-surface-2); border-bottom:1.5px solid var(--color-border); }
  .go-row { border-bottom:1px solid var(--color-surface-2); transition:background .15s; }
  .go-row:hover td { background:rgba(37,99,235,.04) !important; }
  .go-row:last-child { border-bottom:none; }
  .go-action-btn { transition:transform .15s; }
  .go-action-btn:hover:not(:disabled) { transform:scale(1.1); }

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
  @media (max-width:1200px) {
    .go-stats-row { grid-template-columns:repeat(3,1fr) !important; }
    .go-toolbar { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; }
  }
  @media (max-width:768px) {
    .go-stats-row { grid-template-columns:repeat(2,1fr) !important; }
  }
  @media (max-width:639px) {
    .go-page { padding:16px; }
    .go-header { margin-bottom:16px; }
    .go-stats-row { gap:8px; margin-bottom:16px; }
    .go-stat-card { padding:12px 10px; gap:8px; }
    .go-stat-value { font-size:20px; }
    .go-stat-label { font-size:9px; }
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
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding:'16px' }}>
          <div className="go-skeleton" style={{ width:`${50+(i%4)*12}%` }} />
        </td>
      ))}
    </tr>
  );
}

function StatCard({ label, value, icon: IconComponent, iconBg, iconColor }) {
  return (
    <div className="go-stat-card">
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <IconComponent />
      </div>
      <div>
        <div className="go-stat-value">{value}</div>
        <div className="go-stat-label">{label}</div>
      </div>
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

/* ─── Main Component ─────────────────────────────────────────────────────── */
const PAGE_SIZE = 8;

export default function GeneratorOrderList() {
  const navigate = useNavigate();

  // Data state (local mock — no API)
  const [orders, setOrders] = useState([...initialOrders]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filters state
  const [filterDate, setFilterDate]                   = useState('');
  const [filterBillingStatus, setFilterBillingStatus] = useState('all');
  const [filterBookingStatus, setFilterBookingStatus] = useState('all');

  // Simulate initial load
  React.useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  /* ── Filtered data ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o => {
      // 1. Search query match
      const genNames = (o.generators || []).map(g => (g.generatorName || '').toLowerCase()).join(' ');
      const opNames  = o.operatorName ? o.operatorName.toLowerCase() : '';
      const matchSearch =
        o.clientName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        genNames.includes(q) ||
        opNames.includes(q);

      if (!matchSearch) return false;

      // 2. Billing Status Match
      const isBilled = MOCK_BILLS.some(b => b.orderId === o.id);
      if (filterBillingStatus === 'pending' && isBilled) return false;
      if (filterBillingStatus === 'completed' && !isBilled) return false;

      // 3. Booking Status Match
      if (filterBookingStatus !== 'all') {
        const orderBookingStatus = (o.bookingStatus || 'Booked').toLowerCase();
        if (orderBookingStatus !== filterBookingStatus.toLowerCase()) return false;
      }

      // 4. Function Date Range Match
      if (filterDate && filterDate.includes(' to ')) {
        const [selFromStr, selToStr] = filterDate.split(' to ');
        const selFrom = new Date(selFromStr);
        const selTo = new Date(selToStr);

        if (o.functionDate && o.functionDate.includes(' to ')) {
          const [orderFromStr, orderToStr] = o.functionDate.split(' to ');
          const orderFrom = new Date(orderFromStr);
          const orderTo = new Date(orderToStr);

          const intersects = orderFrom <= selTo && orderTo >= selFrom;
          if (!intersects) return false;
        } else {
          return false;
        }
      }

      return true;
    });
  }, [orders, search, filterBillingStatus, filterBookingStatus, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Delete ── */
  const handleDelete = () => {
    if (!deleteTarget) return;
    setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
    const newFiltered = filtered.filter(o => o.id !== deleteTarget.id);
    const newTotal = Math.max(1, Math.ceil(newFiltered.length / PAGE_SIZE));
    if (page > newTotal) setPage(newTotal);
    setDeleteTarget(null);
  };

  /* ── Pagination pages ── */
  const pageNums = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1,2,3,4,5,'…',totalPages];
    if (page >= totalPages - 3) return [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,'…',page-1,page,page+1,'…',totalPages];
  })();

  /* ── Calculations for summary statistics ── */
  const stats = useMemo(() => {
    const totalOrders = orders.length;

    // Today's orders (local timezone day string check)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayCount = orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr)).length;

    const completedBilling = orders.filter(o => MOCK_BILLS.some(b => b.orderId === o.id)).length;
    const pendingBilling = totalOrders - completedBilling;
    const totalGenerators = orders.reduce((sum, o) => sum + (o.generators?.length || 0), 0);

    return {
      totalOrders,
      todayCount,
      pendingBilling,
      completedBilling,
      totalGenerators
    };
  }, [orders]);

  return (
    <>
      <style>{STYLES}</style>

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
          <button
            className="go-add-btn"
            id="btn-add-order"
            onClick={() => navigate(ROUTES.GENERATOR_ORDER_ADD)}
          >
            <Icon.Plus /> Add New Order
          </button>
        </div>

        {/* ── Statistics Section ────────────────────────────── */}
        <div className="go-stats-row">
          <StatCard
            label="Total Orders"
            value={stats.totalOrders}
            icon={Icon.ClipboardList}
            iconBg="var(--color-primary-50)"
            iconColor="var(--color-primary)"
          />
          <StatCard
            label="Today's Orders"
            value={stats.todayCount}
            icon={Icon.Calendar}
            iconBg="var(--color-info-light)"
            iconColor="var(--color-info)"
          />
          <StatCard
            label="Pending Billing"
            value={stats.pendingBilling}
            icon={Icon.AlertCircle}
            iconBg="#FEF3C7"
            iconColor="#92400E"
          />
          <StatCard
            label="Completed Billing"
            value={stats.completedBilling}
            icon={Icon.CheckCircle}
            iconBg="#D1FAE5"
            iconColor="#065F46"
          />
          <StatCard
            label="Generators Booked"
            value={stats.totalGenerators}
            icon={Icon.Zap}
            iconBg="var(--color-primary-100)"
            iconColor="var(--color-primary-dark)"
          />
        </div>



        {/* ── Toolbar / Filters ───────────────────────────────── */}
        <div className="go-toolbar">
          <div className="go-search-wrap">
            <span className="go-search-icon"><Icon.Search /></span>
            <input
              id="input-order-search"
              className="go-search-input"
              placeholder="Search client, ORD-X, operator..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              disabled={loading}
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

          <div>
            <select
              className="go-filter-select"
              style={{ width: '100%', minWidth: 'auto' }}
              value={filterBookingStatus}
              onChange={e => { setFilterBookingStatus(e.target.value); setPage(1); }}
            >
              <option value="all">Booking: All</option>
              <option value="booked">Booking: Booked</option>
              <option value="confirmed">Booking: Confirmed</option>
            </select>
          </div>
        </div>

        {/* ── Main Card ──────────────────────────────────────── */}
        <div className="go-card">
          {/* Desktop Table */}
          <div className="go-table-wrap">
            <table className="go-table">
              <thead className="go-thead">
                <tr>
                  <th style={{ ...thStyle, width:44 }}>#</th>
                  <th style={thStyle}>Order Number</th>
                  <th style={thStyle}>Client Name</th>
                  <th style={thStyle}>Generators</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Function Date</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Booking Status</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Billing Status</th>
                  <th style={{ ...thStyle, textAlign:'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding:'64px 20px', textAlign:'center' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'var(--color-text-subtle)' }}>
                        <Icon.ClipboardEmpty />
                        <div style={{ fontWeight:600, color:'var(--color-text-muted)', fontSize:15 }}>
                          {search || filterDate || filterBillingStatus !== 'all' || filterBookingStatus !== 'all'
                            ? 'No orders match your search or filters'
                            : 'No orders yet'}
                        </div>
                        <div style={{ fontSize:13, color:'var(--color-text-subtle)' }}>
                          {search || filterDate || filterBillingStatus !== 'all' || filterBookingStatus !== 'all'
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
                  const isBilled = MOCK_BILLS.some(b => b.orderId === o.id);
                  const orderBookingStatus = o.bookingStatus || 'Booked';

                  return (
                  <tr
                    key={o.id}
                    className="go-row"
                    style={{ background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)' }}
                  >
                    <td style={{ ...tdStyle, color:'var(--color-text-subtle)', fontSize:13, width:44 }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily:'monospace', fontWeight:700, fontSize:13,
                        background:'var(--color-primary-100)', color:'var(--color-primary-dark)',
                        padding:'2px 8px', borderRadius:6,
                      }}>
                        {o.id}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight:600 }}>{o.clientName}</div>
                      <div style={{ fontSize:12, color:'var(--color-text-subtle)', marginTop:1 }}>
                        {o.contactNumber}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{firstName}</div>
                      {extra && (
                        <div style={{ fontSize:11, color:'var(--color-primary)', fontWeight:600, marginTop:2 }}>{extra}</div>
                      )}
                      <div style={{ fontSize:11, color:'var(--color-text-subtle)', marginTop:1 }}>
                        {gens.length} generator{gens.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign:'center', fontSize:13, fontWeight: 500, color:'var(--color-text-muted)' }}>
                      {o.functionDate || '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign:'center' }}>
                      <StatusChip
                        bg={orderBookingStatus === 'Confirmed' ? '#D1FAE5' : '#DBEAFE'}
                        color={orderBookingStatus === 'Confirmed' ? '#065F46' : '#1E40AF'}
                        label={orderBookingStatus}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign:'center' }}>
                      <StatusChip
                        bg={isBilled ? '#E0F2FE' : '#FEF3C7'}
                        color={isBilled ? '#0369A1' : '#92400E'}
                        label={isBilled ? 'Completed' : 'Pending'}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign:'center' }}>
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
                          <Icon.DollarSign />
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
              const isBilled = MOCK_BILLS.some(b => b.orderId === o.id);
              const orderBookingStatus = o.bookingStatus || 'Booked';

              return (
              <div key={o.id} className="go-mobile-card">
                <div className="go-mc-header">
                  <div>
                    <div className="go-mc-title">{o.clientName}</div>
                    <div className="go-mc-sub">{o.id}</div>
                  </div>
                </div>
                <div className="go-mc-grid">
                  <div className="go-mc-field">
                    <label>Generators</label>
                    <span style={{ fontWeight:600 }}>
                      {(o.generators || [])[0]?.generatorName || '—'}
                    </span>
                    {(o.generators || []).length > 1 && (
                      <span style={{ fontSize:11, color:'var(--color-primary)', fontWeight:600, display:'block' }}>
                        +{(o.generators || []).length - 1} more
                      </span>
                    )}
                  </div>
                  <div className="go-mc-field">
                    <label>Total Booked</label>
                    <span style={{ color:'var(--color-primary)', fontWeight:700 }}>
                      {(o.generators || []).length}
                    </span>
                  </div>
                  <div className="go-mc-field">
                    <label>Function Date</label>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{o.functionDate || '—'}</span>
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
                    <Icon.DollarSign />
                  </button>
                  <button className="go-action-btn" style={actionBtn('red')} title="Delete"
                    onClick={() => setDeleteTarget(o)}>
                    <Icon.Trash />
                  </button>
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

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="go-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="go-modal" onClick={e => e.stopPropagation()}>
            <div className="go-modal-icon">
              <Icon.AlertTriangle />
            </div>
            <h2 className="go-modal-title">Delete Order</h2>
            <p className="go-modal-body">
              Are you sure you want to delete order <strong>{deleteTarget.id}</strong> for{' '}
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
