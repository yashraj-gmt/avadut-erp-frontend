// src/pages/generators/orders/GeneratorOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  mockOrders,
  STATUS_CONFIG,
  DIESEL_TYPES,
  fmtDate,
  calcDuration,
} from './mockData';

/* ─── Shared in-memory store (same reference as form) ───────────────────── */
let LOCAL_ORDERS = [...mockOrders];

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
  NotFound: () => (
    <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
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

  /* ── Detail field ── */
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

  /* ── Skeleton ── */
  .gd2-skel { height:14px; border-radius:6px; background:var(--color-border); animation:gd2-pulse 1.5s ease-in-out infinite; }

  /* ── Not-found ── */
  .gd2-notfound { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:50vh; gap:16px; color:var(--color-text-subtle); text-align:center; }

  /* ── Responsive ── */
  @media (max-width:1023px) {
    .gd2-page { padding:20px 24px; }
    .gd2-grid { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:767px) {
    .gd2-gen-table-wrap { display:none; }
    .gd2-gen-cards { display:block; }
  }
  @media (max-width:639px) {
    .gd2-page { padding:16px; }
    .gd2-grid, .gd2-grid-2 { grid-template-columns:1fr; }
    .gd2-card-body { padding:16px; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg:'#F1F5F9', color:'#64748B' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700,
      background:cfg.bg, color:cfg.color,
    }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

function DieselBadge({ type }) {
  const isOwner = type === DIESEL_TYPES.WITH_OWNER;
  return (
    <span style={{
      padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:700,
      background: isOwner ? '#DBEAFE' : '#F0FDF4',
      color:      isOwner ? '#1E40AF' : '#166534',
    }}>
      {isOwner ? 'With Owner' : 'Party Diesel'}
    </span>
  );
}

/* ─── Skeleton Loader ────────────────────────────────────────────────────── */
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
      {[1,2,3].map(i => (
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

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const found = LOCAL_ORDERS.find(o => o.id === id) || mockOrders.find(o => o.id === id);
      if (found) setOrder(found);
      else setNotFound(true);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <SkeletonDetail />
      </>
    );
  }

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
              style={{
                marginTop:8, padding:'10px 22px', borderRadius:10, border:'none',
                background:'var(--color-primary)', color:'#fff',
                fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit',
              }}
              onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
            >
              Back to Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  const gens = order.generators || [];

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
                {' › '}{order.id}
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <StatusBadge status={order.status} />
            <button
              id="btn-edit-order"
              className="gd2-edit-btn"
              onClick={() => navigate(ROUTES.GENERATOR_ORDER_EDIT.replace(':id', order.id))}
            >
              <Icon.Edit /> Edit Order
            </button>
          </div>
        </div>

        {/* ── Order ID Banner ─────────────────────────────────────── */}
        <div className="gd2-banner">
          <div>
            <div className="gd2-banner-sub">Generator Order</div>
            <div className="gd2-banner-id">{order.id}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="gd2-banner-meta"><Icon.Calendar /> Created: {fmtDate(order.createdAt)}</div>
            <div className="gd2-banner-meta" style={{ marginTop:4 }}><Icon.Clock /> Updated: {fmtDate(order.updatedAt)}</div>
          </div>
        </div>

        {/* ── Section 1 — Order Details ───────────────────────────── */}
        <CardSection icon={Icon.User} title="Order Details">
          <div className="gd2-grid" style={{ marginBottom: 20 }}>
            <Field label="Client Name">
              <Icon.User />{order.clientName}
            </Field>
            <Field label="Order Number" muted>
              <Icon.Receipt />{order.id}
            </Field>
            <Field label="Contact Number" muted>
              <Icon.Phone />{order.contactNumber}
            </Field>
          </div>
          <div className="gd2-grid" style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 20 }}>
            <Field label="Operator Name" muted>
              {order.operatorName || order.generators?.[0]?.operatorName || '—'}
            </Field>
            <Field label="Cable Required" muted>
              <span style={{
                padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:700,
                background: (order.cableRequired ?? order.generators?.[0]?.cableRequired) ? '#D1FAE5' : '#FEE2E2',
                color:       (order.cableRequired ?? order.generators?.[0]?.cableRequired) ? '#065F46' : '#991B1B',
              }}>
                {(order.cableRequired ?? order.generators?.[0]?.cableRequired) ? '✓ Yes' : '✗ No'}
              </span>
            </Field>
            <Field label="Diesel Type" muted>
              <DieselBadge type={order.dieselType || order.generators?.[0]?.dieselType} />
            </Field>
          </div>
        </CardSection>

        {/* ── Section 2 — Generators ──────────────────────────────── */}
        <CardSection
          icon={Icon.Zap}
          title="Generator Details"
          badge={
            <span style={{
              fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20,
              background:'var(--color-primary-100)', color:'var(--color-primary-dark)',
            }}>
              {gens.length} Generator{gens.length !== 1 ? 's' : ''}
            </span>
          }
        >
          {/* Desktop table */}
          <div className="gd2-gen-table-wrap" style={{ overflowX:'auto' }}>
            <table className="gd2-gen-table">
              <thead>
                <tr>
                  <th className="gd2-gen-th" style={{ width:40 }}>#</th>
                  <th className="gd2-gen-th">Generator</th>
                  <th className="gd2-gen-th" style={{ textAlign:'center' }}>Start</th>
                  <th className="gd2-gen-th" style={{ textAlign:'center' }}>End</th>
                  <th className="gd2-gen-th" style={{ textAlign:'center' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {gens.map((g, i) => (
                  <tr key={g._id || i} className="gd2-gen-tr">
                    <td className="gd2-gen-td" style={{ color:'var(--color-text-subtle)', fontSize:12 }}>{i+1}</td>
                    <td className="gd2-gen-td">
                      <div style={{ fontWeight:700, color:'var(--color-primary-dark)' }}>{g.generatorName}</div>
                    </td>
                    <td className="gd2-gen-td" style={{ textAlign:'center', fontFamily:'monospace', fontSize:13, fontWeight:600 }}>
                      {g.startTime}
                    </td>
                    <td className="gd2-gen-td" style={{ textAlign:'center', fontFamily:'monospace', fontSize:13, fontWeight:600 }}>
                      {g.endTime}
                    </td>
                    <td className="gd2-gen-td" style={{ textAlign:'center' }}>
                      <div className="gd2-dur-chip">
                        <Icon.Clock />
                        {g.duration || calcDuration(g.startTime, g.endTime)}
                        <span style={{ fontSize:11, color:'var(--color-primary)', fontWeight:600 }}>hrs</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile generator cards */}
          <div className="gd2-gen-cards">
            {gens.map((g, i) => (
              <div key={g._id || i} className="gd2-gen-mc">
                <div className="gd2-gen-mc-hdr">
                  <span className="gd2-gen-num">{i+1}</span>
                  <div>
                    <div style={{ fontWeight:700, color:'var(--color-primary-dark)', fontSize:14 }}>{g.generatorName}</div>
                  </div>
                </div>
                <div className="gd2-gen-mc-grid">
                  <div className="gd2-gen-mc-f">
                    <label>Start Time</label>
                    <span style={{ fontFamily:'monospace', fontWeight:700 }}>{g.startTime}</span>
                  </div>
                  <div className="gd2-gen-mc-f">
                    <label>End Time</label>
                    <span style={{ fontFamily:'monospace', fontWeight:700 }}>{g.endTime}</span>
                  </div>
                  <div className="gd2-gen-mc-f" style={{ gridColumn:'1/-1' }}>
                    <label>Duration</label>
                    <span style={{ color:'var(--color-primary)', fontWeight:700 }}>
                      {g.duration || calcDuration(g.startTime, g.endTime)} hrs
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardSection>

        {/* ── Section 3 — Additional Information ─────────────────── */}
        <CardSection icon={Icon.MapPin} title="Additional Information">
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="gd2-field">
              <label>Site Address</label>
              <div className="gd2-field-val muted" style={{ alignItems:'flex-start', marginTop:6 }}>
                <Icon.MapPin />
                <span>{order.siteAddress || '—'}</span>
              </div>
            </div>
          </div>
        </CardSection>

        {/* ── Section 4 — Remarks ────────────────────────────────── */}
        <CardSection icon={Icon.FileText} title="Remarks">
          <div className="gd2-remarks">
            {order.remarks || <span style={{ fontStyle:'italic', opacity:.5 }}>No remarks added.</span>}
          </div>
        </CardSection>

        {/* ── Bottom Actions ──────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
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
