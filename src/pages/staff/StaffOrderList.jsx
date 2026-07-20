// src/pages/staff/StaffOrderList.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { mockOrders, STATUS_CONFIG, MOCK_BILLS } from '@/pages/generators/orders/mockData';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
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
  ClipboardList: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  Empty: () => (
    <svg width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
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
  Shield: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Home: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes sol-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sol-pulse  { 0%,100%{opacity:1} 50%{opacity:.45} }

  .sol-page { min-height:100vh; background:var(--color-bg); font-family:'Inter','Segoe UI',sans-serif; padding:28px 32px; }

  .sol-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
  .sol-page-title { font-size:clamp(18px,3vw,22px); font-weight:800; color:var(--color-text); letter-spacing:-.4px; margin:0; }
  .sol-breadcrumb { font-size:12.5px; color:var(--color-text-subtle); margin:4px 0 0; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
  .sol-breadcrumb a { color:var(--color-primary); text-decoration:none; display:inline-flex; align-items:center; gap:4px; }
  .sol-badge-ro {
    display:inline-flex; align-items:center; gap:5px;
    background:#D1FAE5; color:#065F46; border-radius:20px;
    padding:5px 12px; font-size:11px; font-weight:700;
    text-transform:uppercase; letter-spacing:.5px;
  }

  /* Stats */
  .sol-stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
  .sol-stat-card {
    background:var(--color-surface); border-radius:14px; padding:16px 20px;
    box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:14px;
    border:1px solid var(--color-border);
    animation:sol-fadein .4s ease both;
  }
  .sol-stat-icon { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sol-stat-value { font-size:24px; font-weight:800; color:var(--color-text); line-height:1.1; }
  .sol-stat-label { font-size:11px; color:var(--color-text-muted); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }

  /* Toolbar */
  .sol-toolbar { display:flex; gap:12px; margin-bottom:18px; align-items:center; flex-wrap:wrap; }
  .sol-search-wrap { position:relative; flex:1; min-width:200px; max-width:380px; }
  .sol-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--color-text-subtle); pointer-events:none; display:flex; }
  .sol-search-input {
    width:100%; padding:10px 14px 10px 36px;
    border:1.5px solid var(--color-border); border-radius:10px;
    font-size:13.5px; color:var(--color-text); background:var(--color-surface);
    outline:none; transition:border-color .2s,box-shadow .2s; font-family:inherit;
  }
  .sol-search-input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(37,99,235,.14); }
  .sol-filter-select {
    padding:10px 14px; border:1.5px solid var(--color-border); border-radius:10px;
    font-size:13.5px; color:var(--color-text-muted); background:var(--color-surface);
    cursor:pointer; outline:none; font-family:inherit; transition:border-color .2s;
    min-width:150px;
  }
  .sol-filter-select:focus { border-color:var(--color-primary); }
  .sol-result-count { font-size:13px; color:var(--color-text-muted); margin-left:auto; white-space:nowrap; }

  /* Table card */
  .sol-card { background:var(--color-surface); border-radius:16px; box-shadow:var(--shadow-md); overflow:hidden; border:1px solid var(--color-border); }
  .sol-table { width:100%; border-collapse:collapse; }
  .sol-thead { background:var(--color-surface-2); }
  .sol-th { padding:12px 16px; text-align:left; font-size:11px; font-weight:700; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.6px; border-bottom:1.5px solid var(--color-border); white-space:nowrap; }
  .sol-td { padding:14px 16px; font-size:13.5px; color:var(--color-text); vertical-align:middle; }
  .sol-row { border-bottom:1px solid var(--color-surface-2); transition:background .15s; }
  .sol-row:hover td { background:rgba(37,99,235,.04) !important; }
  .sol-row:last-child { border-bottom:none; }
  .sol-action-btn {
    display:inline-flex; align-items:center; justify-content:center;
    width:32px; height:32px; border-radius:8px;
    border:none; cursor:pointer;
    background:var(--color-primary-100); color:var(--color-primary);
    transition:all .15s;
  }
  .sol-action-btn:hover { transform:scale(1.1); box-shadow:0 2px 8px rgba(37,99,235,.25); }

  /* Skeleton */
  .sol-skel { height:14px; border-radius:6px; background:var(--color-border); animation:sol-pulse 1.4s ease infinite; }

  /* Pagination */
  .sol-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--color-border); background:var(--color-surface-2); flex-wrap:wrap; gap:10px; }

  /* Mobile */
  .sol-mobile-list { display:none; padding:12px; }
  .sol-mobile-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:14px 16px; margin-bottom:10px; animation:sol-fadein .25s ease; }
  .sol-mobile-card:last-child { margin-bottom:0; }
  .sol-mc-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .sol-mc-title { font-weight:700; color:var(--color-text); font-size:14px; }
  .sol-mc-sub { font-size:11.5px; color:var(--color-text-subtle); margin-top:1px; }
  .sol-mc-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; margin-bottom:10px; }
  .sol-mc-field label { font-size:10px; color:var(--color-text-subtle); font-weight:600; text-transform:uppercase; letter-spacing:.4px; }
  .sol-mc-field span { display:block; font-size:13px; color:var(--color-text); font-weight:500; margin-top:2px; }

  @media (max-width:1100px) { .sol-stats-row { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:640px) {
    .sol-page { padding:16px; }
    .sol-stats-row { grid-template-columns:1fr 1fr; gap:10px; }
    .sol-toolbar { flex-direction:column; align-items:stretch; }
    .sol-search-wrap { max-width:none; }
    .sol-filter-select { min-width:0; }
    .sol-result-count { margin-left:0; }
    .sol-table { display:none; }
    .sol-mobile-list { display:block; }
  }
  @media (max-width:480px) { .sol-stats-row { grid-template-columns:1fr; } }
`;

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '13px 16px', fontSize: 13.5, color: 'var(--color-text)', verticalAlign: 'middle' };

const pageBtn = (active) => ({
  width: 34, height: 34, borderRadius: 8,
  border: active ? 'none' : '1.5px solid var(--color-border)',
  background: active ? 'var(--color-primary)' : 'var(--color-surface)',
  color: active ? '#fff' : 'var(--color-text)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
});

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG?.[status] ?? { label: status ?? '—', bg: '#F3F4F6', color: '#374151' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color,
      textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, bg, color, loading }) {
  return (
    <div className="sol-stat-card">
      <div className="sol-stat-icon" style={{ background: bg, color }}>
        <Icon.ClipboardList />
      </div>
      <div>
        <div className="sol-stat-value">{loading ? '—' : value}</div>
        <div className="sol-stat-label">{label}</div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-surface-2)' }}>
      {[40, 120, 120, 100, 90, 80, 60].map((w, i) => (
        <td key={i} style={{ padding: '16px' }}>
          <div className="sol-skel" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

const PAGE_SIZE = 8;

export default function StaffOrderList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);

  // Simulate load
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Filter orders assigned to this staff user
  const myOrders = useMemo(() => {
    if (!user) return [];
    return mockOrders.filter(o =>
      o.assignedToName?.toLowerCase() === user.name?.toLowerCase() ||
      o.assignedToId === user.id
    );
  }, [user]);

  // Apply search + status filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return myOrders.filter(o => {
      const genNames = (o.generators || []).map(g => (g.generatorName || '').toLowerCase()).join(' ');
      const matchSearch =
        o.clientName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        genNames.includes(q);
      if (!matchSearch) return false;
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      return true;
    });
  }, [myOrders, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNums = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', page - 1, page, page + 1, '…', totalPages];
  })();

  const stats = useMemo(() => ({
    total:      myOrders.length,
    pending:    myOrders.filter(o => o.status === 'PENDING').length,
    inProgress: myOrders.filter(o => o.status === 'IN_PROGRESS').length,
    completed:  myOrders.filter(o => o.status === 'COMPLETED').length,
  }), [myOrders]);

  return (
    <>
      <style>{STYLES}</style>
      <div className="sol-page">

        {/* ── Header ── */}
        <div className="sol-header">
          <div>
            <h1 className="sol-page-title">My Assigned Orders</h1>
            <div className="sol-breadcrumb">
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.DASHBOARD); }}>
                <Icon.Home /> Home
              </a>
              <span style={{ color: 'var(--color-text-subtle)' }}>›</span>
              <span>My Orders</span>
            </div>
          </div>
          <span className="sol-badge-ro">
            <Icon.Shield />
            View Only Access
          </span>
        </div>

        {/* ── Stats ── */}
        <div className="sol-stats-row">
          {[
            { label: 'Total Assigned', value: stats.total, bg: '#EFF6FF', color: '#2563EB' },
            { label: 'In Progress',    value: stats.inProgress, bg: '#EDE9FE', color: '#7C3AED' },
            { label: 'Pending',        value: stats.pending, bg: '#FEF3C7', color: '#92400E' },
            { label: 'Completed',      value: stats.completed, bg: '#D1FAE5', color: '#065F46' },
          ].map((s, i) => (
            <StatCard key={i} {...s} loading={loading} />
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="sol-toolbar">
          <div className="sol-search-wrap">
            <span className="sol-search-icon"><Icon.Search /></span>
            <input
              className="sol-search-input"
              placeholder="Search by client, order #, generator…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              disabled={loading}
            />
          </div>
          <select
            className="sol-filter-select"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            disabled={loading}
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span className="sol-result-count">
            {loading ? 'Loading…' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* ── Table Card ── */}
        <div className="sol-card">
          {/* Desktop Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="sol-table">
              <thead className="sol-thead">
                <tr>
                  <th style={{ ...thStyle, width: 44 }}>#</th>
                  <th style={thStyle}>Order #</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Generators</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Function Date</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  : paged.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '64px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--color-text-subtle)' }}>
                          <Icon.Empty />
                          <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 15 }}>
                            {search || filterStatus !== 'all' ? 'No orders match your search' : 'No orders assigned yet'}
                          </div>
                          <div style={{ fontSize: 13 }}>
                            {search || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Your admin will assign orders to you soon'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : paged.map((o, i) => {
                    const gens = o.generators || [];
                    const firstName = gens[0]?.generatorName || '—';
                    const extra    = gens.length > 1 ? ` +${gens.length - 1} more` : '';
                    return (
                      <tr
                        key={o.id}
                        className="sol-row"
                        style={{ background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)' }}
                      >
                        <td style={{ ...tdStyle, color: 'var(--color-text-subtle)', fontSize: 13, width: 44 }}>
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5,
                            background: '#EFF6FF', color: '#1D4ED8',
                            padding: '2px 8px', borderRadius: 6,
                          }}>{o.id}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600 }}>{o.clientName}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--color-text-subtle)', marginTop: 1 }}>
                            {o.contactNumber}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{firstName}</div>
                          {extra && <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>{extra}</div>}
                          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>
                            {gens.length} generator{gens.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                          {o.functionDate || '—'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <StatusChip status={o.status} />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            className="sol-action-btn"
                            title="View Order"
                            onClick={() => navigate(ROUTES.STAFF_ORDER_DETAIL.replace(':id', o.id))}
                          >
                            <Icon.Eye />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sol-mobile-list">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="sol-mobile-card">
                  <div className="sol-skel" style={{ width: '60%', marginBottom: 8 }} />
                  <div className="sol-skel" style={{ width: '40%', marginBottom: 12 }} />
                  <div className="sol-skel" style={{ width: '80%' }} />
                </div>
              ))
            ) : paged.map(o => (
              <div key={o.id} className="sol-mobile-card">
                <div className="sol-mc-header">
                  <div>
                    <div className="sol-mc-title">{o.clientName}</div>
                    <div className="sol-mc-sub">{o.id}</div>
                  </div>
                  <StatusChip status={o.status} />
                </div>
                <div className="sol-mc-grid">
                  <div className="sol-mc-field">
                    <label>Generators</label>
                    <span style={{ fontWeight: 600 }}>{(o.generators || [])[0]?.generatorName || '—'}</span>
                    {(o.generators || []).length > 1 && (
                      <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>
                        +{(o.generators || []).length - 1} more
                      </span>
                    )}
                  </div>
                  <div className="sol-mc-field">
                    <label>Function Date</label>
                    <span style={{ fontSize: 12 }}>{o.functionDate || '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--color-surface-2)' }}>
                  <button
                    className="sol-action-btn"
                    title="View"
                    onClick={() => navigate(ROUTES.STAFF_ORDER_DETAIL.replace(':id', o.id))}
                  >
                    <Icon.Eye />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="sol-pagination">
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={pageBtn(false)} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <Icon.ChevronLeft />
                </button>
                {pageNums.map((n, i) =>
                  n === '…' ? (
                    <span key={`e${i}`} style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: 'var(--color-text-subtle)', fontSize: 13 }}>…</span>
                  ) : (
                    <button key={n} style={pageBtn(n === page)} onClick={() => setPage(n)}>{n}</button>
                  )
                )}
                <button style={pageBtn(false)} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <Icon.ChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
