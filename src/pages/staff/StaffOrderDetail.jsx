// src/pages/staff/StaffOrderDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { mockOrders, STATUS_CONFIG, DIESEL_TYPES } from '@/pages/generators/orders/mockData';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
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
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
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
  MessageSquare: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12"/>
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes sod-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sod-pulse  { 0%,100%{opacity:1} 50%{opacity:.45} }

  .sod-page { min-height:100vh; background:var(--color-bg); font-family:'Inter','Segoe UI',sans-serif; padding:0 0 60px; }

  /* Hero */
  .sod-hero {
    background: linear-gradient(135deg, #1e3a5f 0%, #1a5276 50%, #0e6655 100%);
    padding: 28px 36px 36px;
    position: relative; overflow: hidden;
  }
  .sod-hero::before {
    content:''; position:absolute; top:-60px; right:-60px;
    width:300px; height:300px; border-radius:50%;
    background:rgba(255,255,255,.04); pointer-events:none;
  }
  .sod-hero-inner { position:relative; z-index:1; }
  .sod-back-btn {
    display:inline-flex; align-items:center; gap:7px;
    background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2);
    color:#fff; border-radius:10px; padding:8px 16px;
    font-size:13px; font-weight:600; cursor:pointer; font-family:inherit;
    transition:all .2s; margin-bottom:20px;
    backdrop-filter:blur(4px);
  }
  .sod-back-btn:hover { background:rgba(255,255,255,.2); }
  .sod-hero-row { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
  .sod-order-num {
    font-family:monospace; font-size:13px; font-weight:700;
    background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
    color:#fff; padding:4px 12px; border-radius:8px;
    display:inline-block; margin-bottom:10px;
  }
  .sod-hero-title { font-size:clamp(18px,3vw,24px); font-weight:800; color:#fff; margin:0 0 6px; letter-spacing:-.4px; }
  .sod-hero-sub { font-size:13px; color:rgba(255,255,255,.7); margin:0; }
  .sod-status-chip {
    display:inline-block; padding:5px 14px; border-radius:20px;
    font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
    border:1.5px solid rgba(255,255,255,.3);
    backdrop-filter:blur(4px);
  }
  .sod-ro-badge {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(209,250,229,.15); color:#D1FAE5;
    border-radius:20px; padding:4px 12px;
    font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
    margin-top:10px;
  }

  /* Content */
  .sod-content { padding:28px 36px; display:flex; flex-direction:column; gap:20px; }

  /* Cards */
  .sod-card {
    background:var(--color-surface); border-radius:16px;
    border:1px solid var(--color-border);
    box-shadow:0 2px 12px rgba(0,0,0,.06);
    animation:sod-fadein .4s ease both;
    overflow:hidden;
  }
  .sod-card-header {
    display:flex; align-items:center; gap:10px;
    padding:16px 20px;
    border-bottom:1px solid var(--color-border);
    background:var(--color-surface-2);
  }
  .sod-card-icon {
    width:34px; height:34px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .sod-card-title { font-size:14px; font-weight:700; color:var(--color-text); margin:0; }
  .sod-card-body { padding:20px; }

  /* Field Grid */
  .sod-field-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:16px; }
  .sod-field label { font-size:11px; font-weight:700; color:var(--color-text-subtle); text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:5px; }
  .sod-field span { font-size:14px; font-weight:600; color:var(--color-text); }
  .sod-field p { font-size:13.5px; color:var(--color-text-muted); margin:0; line-height:1.6; }

  /* Generator Table */
  .sod-gen-table { width:100%; border-collapse:collapse; }
  .sod-gen-th { padding:10px 14px; text-align:left; font-size:10.5px; font-weight:700; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.6px; background:var(--color-surface-2); border-bottom:1.5px solid var(--color-border); white-space:nowrap; }
  .sod-gen-td { padding:12px 14px; font-size:13px; color:var(--color-text); vertical-align:middle; }
  .sod-gen-row { border-bottom:1px solid var(--color-surface-2); }
  .sod-gen-row:last-child { border-bottom:none; }

  /* Skeleton */
  .sod-skel { height:14px; border-radius:6px; background:var(--color-border); animation:sod-pulse 1.4s ease infinite; }

  /* Responsive */
  @media(max-width:768px) {
    .sod-hero { padding:20px; }
    .sod-content { padding:20px; gap:16px; }
    .sod-field-grid { grid-template-columns:1fr 1fr; }
    .sod-gen-table { font-size:12px; }
  }
  @media(max-width:480px) {
    .sod-field-grid { grid-template-columns:1fr; }
  }
`;

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function SectionCard({ title, icon: IconComp, iconBg, iconColor, children, delay = 0 }) {
  return (
    <div className="sod-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="sod-card-header">
        <div className="sod-card-icon" style={{ background: iconBg, color: iconColor }}>
          <IconComp />
        </div>
        <h2 className="sod-card-title">{title}</h2>
      </div>
      <div className="sod-card-body">{children}</div>
    </div>
  );
}

export default function StaffOrderDetail() {
  const navigate     = useNavigate();
  const { id }       = useParams();
  const { user }     = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Find the order — must be assigned to this staff user
  const order = useMemo(() => {
    if (!user) return null;
    const found = mockOrders.find(o => o.id === id);
    if (!found) return null;
    // Verify ownership
    const isAssigned =
      found.assignedToName?.toLowerCase() === user.name?.toLowerCase() ||
      found.assignedToId === user.id;
    return isAssigned ? found : null;
  }, [id, user]);

  const statusCfg = STATUS_CONFIG?.[order?.status] ?? { label: order?.status ?? '—', bg: '#F3F4F6', color: '#374151' };

  if (!loading && !order) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="sod-page">
          <div style={{ padding: 36 }}>
            <button className="sod-back-btn" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)' }}
              onClick={() => navigate(ROUTES.STAFF_ORDERS)}>
              <Icon.ArrowLeft /> Back to Orders
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-subtle)' }}>
            <Icon.NotFound />
            <p style={{ marginTop: 16, fontWeight: 700, fontSize: 16, color: 'var(--color-text-muted)' }}>Order Not Found</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>This order doesn't exist or wasn't assigned to you.</p>
          </div>
        </div>
      </>
    );
  }

  const gens = order?.generators || [];

  return (
    <>
      <style>{STYLES}</style>
      <div className="sod-page">

        {/* ── Hero ── */}
        <div className="sod-hero">
          <div className="sod-hero-inner">
            <button className="sod-back-btn" onClick={() => navigate(ROUTES.STAFF_ORDERS)}>
              <Icon.ArrowLeft /> Back to My Orders
            </button>
            <div className="sod-hero-row">
              <div>
                {loading
                  ? <div className="sod-skel" style={{ width: 120, marginBottom: 10 }} />
                  : <div className="sod-order-num">{order?.id}</div>
                }
                {loading
                  ? <div className="sod-skel" style={{ width: 240, marginBottom: 8 }} />
                  : <h1 className="sod-hero-title">{order?.clientName}</h1>
                }
                {loading
                  ? <div className="sod-skel" style={{ width: 180 }} />
                  : <p className="sod-hero-sub">{order?.siteAddress}</p>
                }
                <div className="sod-ro-badge" style={{ marginTop: 12 }}>
                  <Icon.Shield /> Staff View — Read Only
                </div>
              </div>
              {!loading && order && (
                <span
                  className="sod-status-chip"
                  style={{
                    background: statusCfg.bg + '33',
                    color: '#fff',
                    borderColor: statusCfg.bg + '80',
                  }}
                >
                  {statusCfg.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="sod-content">

          {/* Client Information */}
          <SectionCard title="Client Information" icon={Icon.User} iconBg="#EFF6FF" iconColor="#2563EB" delay={0}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="sod-skel" />)}
              </div>
            ) : (
              <div className="sod-field-grid">
                <div className="sod-field">
                  <label>Client Name</label>
                  <span>{order?.clientName || '—'}</span>
                </div>
                <div className="sod-field">
                  <label>Contact Number</label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon.Phone />{order?.contactNumber || '—'}
                  </span>
                </div>
                <div className="sod-field">
                  <label>Function Date</label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon.Calendar />{order?.functionDate || '—'}
                  </span>
                </div>
                <div className="sod-field">
                  <label>Booking Status</label>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, background: '#DBEAFE', color: '#1E40AF',
                    textTransform: 'uppercase', letterSpacing: '.4px',
                  }}>
                    {order?.bookingStatus || 'Booked'}
                  </span>
                </div>
                {order?.siteAddress && (
                  <div className="sod-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Site Address</label>
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: 0 }}>
                      <Icon.MapPin style={{ flexShrink: 0, marginTop: 2 }} />
                      {order.siteAddress}
                    </p>
                  </div>
                )}
                {order?.remarks && (
                  <div className="sod-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Remarks</label>
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: 0 }}>
                      <Icon.MessageSquare style={{ flexShrink: 0, marginTop: 2 }} />
                      {order.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Generators */}
          <SectionCard title={`Generators (${gens.length})`} icon={Icon.Zap} iconBg="#EDE9FE" iconColor="#7C3AED" delay={80}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(2)].map((_, i) => <div key={i} className="sod-skel" style={{ height: 40 }} />)}
              </div>
            ) : gens.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--color-text-subtle)', fontSize: 13 }}>No generators recorded.</p>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <table className="sod-gen-table">
                  <thead>
                    <tr>
                      <th className="sod-gen-th">#</th>
                      <th className="sod-gen-th">Generator</th>
                      <th className="sod-gen-th">Operator</th>
                      <th className="sod-gen-th" style={{ textAlign: 'center' }}>Time</th>
                      <th className="sod-gen-th" style={{ textAlign: 'center' }}>Duration</th>
                      <th className="sod-gen-th" style={{ textAlign: 'center' }}>Cable</th>
                      <th className="sod-gen-th" style={{ textAlign: 'center' }}>Diesel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gens.map((g, i) => (
                      <tr key={g._id || i} className="sod-gen-row" style={{ background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)' }}>
                        <td className="sod-gen-td" style={{ color: 'var(--color-text-subtle)', fontSize: 12 }}>{i + 1}</td>
                        <td className="sod-gen-td">
                          <span style={{ fontWeight: 700 }}>{g.generatorName || '—'}</span>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--color-text-subtle)' }}>{g.generatorId}</span>
                        </td>
                        <td className="sod-gen-td">
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Icon.User />{g.operatorName || '—'}
                          </span>
                        </td>
                        <td className="sod-gen-td" style={{ textAlign: 'center', fontSize: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Icon.Clock />{g.startTime} – {g.endTime}
                          </span>
                        </td>
                        <td className="sod-gen-td" style={{ textAlign: 'center', fontWeight: 600, fontSize: 13 }}>
                          {g.duration || '—'}
                        </td>
                        <td className="sod-gen-td" style={{ textAlign: 'center' }}>
                          {g.cableRequired
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}><Icon.Check /> Yes</span>
                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#FEE2E2', color: '#991B1B', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}><Icon.X /> No</span>
                          }
                        </td>
                        <td className="sod-gen-td" style={{ textAlign: 'center', fontSize: 12 }}>
                          <span style={{
                            background: g.dieselType === DIESEL_TYPES.WITH_OWNER ? '#DBEAFE' : '#FEF3C7',
                            color: g.dieselType === DIESEL_TYPES.WITH_OWNER ? '#1E40AF' : '#92400E',
                            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          }}>
                            {g.dieselType === DIESEL_TYPES.WITH_OWNER ? 'With Owner' : 'Party'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Assignment Info */}
          <SectionCard title="Assignment Info" icon={Icon.Shield} iconBg="#D1FAE5" iconColor="#065F46" delay={160}>
            {loading ? (
              <div className="sod-field-grid">
                {[...Array(3)].map((_, i) => <div key={i} className="sod-skel" />)}
              </div>
            ) : (
              <div className="sod-field-grid">
                <div className="sod-field">
                  <label>Assigned To</label>
                  <span>{order?.assignedToName || user?.name || '—'}</span>
                </div>
                <div className="sod-field">
                  <label>Assigned By</label>
                  <span>{order?.assignedByName || '—'}</span>
                </div>
                <div className="sod-field">
                  <label>Order Created</label>
                  <span>{order?.createdAt ? fmtDateTime(order.createdAt) : '—'}</span>
                </div>
                <div className="sod-field">
                  <label>Last Updated</label>
                  <span>{order?.updatedAt ? fmtDateTime(order.updatedAt) : '—'}</span>
                </div>
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </>
  );
}
