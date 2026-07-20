// src/pages/staff/StaffDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { mockOrders, STATUS_CONFIG, fmtDate, MOCK_BILLS } from '@/pages/generators/orders/mockData';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ClipboardList: () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Zap: () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

/* ─── CSS ───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes sd-fadein  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sd-scalein { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes sd-pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes sd-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes sd-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }

  .sd-page {
    min-height: 100vh;
    background: var(--color-bg);
    font-family: 'Inter', 'Segoe UI', sans-serif;
    padding: 0 0 48px;
  }

  /* ── Hero Banner ── */
  .sd-hero {
    background: linear-gradient(135deg, #1e3a5f 0%, #1a5276 40%, #0e6655 100%);
    padding: 36px 36px 80px;
    position: relative;
    overflow: hidden;
  }
  .sd-hero::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: rgba(255,255,255,.04);
    pointer-events: none;
  }
  .sd-hero::after {
    content: '';
    position: absolute;
    bottom: -120px; left: -60px;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: rgba(255,255,255,.03);
    pointer-events: none;
  }
  .sd-hero-grid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }
  .sd-welcome-tag {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,.85);
    margin-bottom: 14px;
    backdrop-filter: blur(4px);
  }
  .sd-hero-title {
    font-size: clamp(22px, 3.5vw, 30px);
    font-weight: 800;
    color: #fff;
    margin: 0 0 8px;
    letter-spacing: -.5px;
    line-height: 1.2;
  }
  .sd-hero-sub {
    font-size: 14px;
    color: rgba(255,255,255,.7);
    margin: 0;
    line-height: 1.5;
  }
  .sd-avatar-hero {
    width: 68px; height: 68px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255,255,255,.25), rgba(255,255,255,.1));
    border: 2px solid rgba(255,255,255,.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800; color: #fff;
    flex-shrink: 0;
    backdrop-filter: blur(4px);
  }

  /* ── Stats Cards ── */
  .sd-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    padding: 0 36px;
    margin-top: -44px;
    position: relative;
    z-index: 10;
  }
  .sd-stat-card {
    background: var(--color-surface);
    border-radius: 16px;
    padding: 20px 22px;
    box-shadow: 0 4px 24px rgba(0,0,0,.1);
    display: flex;
    align-items: center;
    gap: 16px;
    animation: sd-scalein .4s ease both;
    border: 1px solid var(--color-border);
    transition: transform .2s, box-shadow .2s;
  }
  .sd-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.14); }
  .sd-stat-icon {
    width: 48px; height: 48px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sd-stat-value {
    font-size: 28px; font-weight: 800;
    color: var(--color-text); line-height: 1;
  }
  .sd-stat-label {
    font-size: 11.5px; font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase; letter-spacing: .5px;
    margin-top: 5px;
  }

  /* ── Content Section ── */
  .sd-content { padding: 36px 36px 0; }

  /* ── Section Header ── */
  .sd-section-hd {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .sd-section-title {
    font-size: 16px; font-weight: 700;
    color: var(--color-text); margin: 0;
  }
  .sd-view-all {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600;
    color: var(--color-primary); text-decoration: none;
    background: none; border: none; cursor: pointer; padding: 0;
    font-family: inherit;
    transition: gap .2s;
  }
  .sd-view-all:hover { gap: 10px; }

  /* ── Order Table Card ── */
  .sd-card {
    background: var(--color-surface);
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,.07);
    overflow: hidden;
    border: 1px solid var(--color-border);
    animation: sd-fadein .5s ease both;
  }
  .sd-table { width: 100%; border-collapse: collapse; }
  .sd-thead { background: var(--color-surface-2); }
  .sd-th {
    padding: 12px 16px;
    text-align: left; font-size: 11px; font-weight: 700;
    color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .6px;
    border-bottom: 1.5px solid var(--color-border);
    white-space: nowrap;
  }
  .sd-td { padding: 14px 16px; font-size: 13.5px; color: var(--color-text); vertical-align: middle; }
  .sd-row { border-bottom: 1px solid var(--color-surface-2); transition: background .15s; }
  .sd-row:hover td { background: rgba(37,99,235,.04) !important; }
  .sd-row:last-child { border-bottom: none; }

  /* ── Status Chip ── */
  .sd-chip {
    display: inline-block; padding: 3px 10px;
    border-radius: 20px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .4px; white-space: nowrap;
  }

  /* ── Action Btn ── */
  .sd-action-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px;
    border: none; cursor: pointer;
    background: var(--color-primary-100); color: var(--color-primary);
    transition: all .15s;
  }
  .sd-action-btn:hover { transform: scale(1.1); box-shadow: 0 2px 8px rgba(37,99,235,.25); }

  /* ── Skeleton ── */
  .sd-skel { height: 14px; border-radius: 6px; background: var(--color-border); animation: sd-pulse 1.4s ease infinite; }

  /* ── Role badge ── */
  .sd-role-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #D1FAE5; color: #065F46;
    border-radius: 20px; padding: 4px 12px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .5px;
  }

  /* ── Responsive ── */
  @media (max-width:1100px) {
    .sd-stats-row { grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width:640px) {
    .sd-hero { padding: 24px 20px 72px; }
    .sd-stats-row { grid-template-columns: 1fr 1fr; padding: 0 20px; margin-top: -40px; }
    .sd-content { padding: 28px 20px 0; }
    .sd-stat-card { padding: 14px 14px; gap: 10px; }
    .sd-stat-value { font-size: 22px; }
  }
  @media (max-width:480px) {
    .sd-stats-row { grid-template-columns: 1fr; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const getInitials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG?.[status] ?? { label: status ?? '—', bg: '#F3F4F6', color: '#374151' };
  return (
    <span className="sd-chip" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon: IconComp, bg, color, delay = 0 }) {
  return (
    <div className="sd-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="sd-stat-icon" style={{ background: bg, color }}>
        <IconComp />
      </div>
      <div>
        <div className="sd-stat-value">{value}</div>
        <div className="sd-stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function StaffDashboard() {
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Simulate load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Filter mock orders assigned to current user (by name for demo)
  const myOrders = useMemo(() => {
    if (!user) return [];
    return mockOrders.filter(o =>
      o.assignedToName?.toLowerCase() === user.name?.toLowerCase() ||
      o.assignedToId === user.id
    );
  }, [user]);

  const stats = useMemo(() => {
    const total     = myOrders.length;
    const pending   = myOrders.filter(o => o.status === 'PENDING').length;
    const inProgress= myOrders.filter(o => o.status === 'IN_PROGRESS').length;
    const completed = myOrders.filter(o => o.status === 'COMPLETED').length;
    return { total, pending, inProgress, completed };
  }, [myOrders]);

  const recentOrders = myOrders.slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sd-page">

        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <div className="sd-hero">
          <div className="sd-hero-grid">
            <div style={{ animation: 'sd-fadein .5s ease' }}>
              <div className="sd-welcome-tag">
                <Icon.Shield />
                Staff Portal
              </div>
              <h1 className="sd-hero-title">
                {greeting()}, {user?.name?.split(' ')[0] ?? 'Staff'} 👋
              </h1>
              <p className="sd-hero-sub">
                Here's an overview of your assigned generator orders for today.
              </p>
              <div style={{ marginTop: 14 }}>
                <span className="sd-role-badge">
                  <Icon.Shield />
                  Staff Member
                </span>
              </div>
            </div>
            <div className="sd-avatar-hero" style={{ animation: 'sd-float 3s ease-in-out infinite' }}>
              {getInitials(user?.name ?? 'S')}
            </div>
          </div>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────── */}
        <div className="sd-stats-row">
          <StatCard
            label="Total Assigned"
            value={loading ? '—' : stats.total}
            icon={Icon.ClipboardList}
            bg="#EFF6FF" color="#2563EB"
            delay={0}
          />
          <StatCard
            label="In Progress"
            value={loading ? '—' : stats.inProgress}
            icon={Icon.Clock}
            bg="#EDE9FE" color="#7C3AED"
            delay={80}
          />
          <StatCard
            label="Pending"
            value={loading ? '—' : stats.pending}
            icon={Icon.AlertCircle}
            bg="#FEF3C7" color="#92400E"
            delay={160}
          />
          <StatCard
            label="Completed"
            value={loading ? '—' : stats.completed}
            icon={Icon.CheckCircle}
            bg="#D1FAE5" color="#065F46"
            delay={240}
          />
        </div>

        {/* ── Recent Orders Table ──────────────────────────────────────── */}
        <div className="sd-content" style={{ marginTop: 36 }}>
          <div className="sd-section-hd">
            <h2 className="sd-section-title">My Recent Orders</h2>
            <button
              className="sd-view-all"
              onClick={() => navigate(ROUTES.STAFF_ORDERS)}
            >
              View All <Icon.ArrowRight />
            </button>
          </div>

          <div className="sd-card">
            {loading ? (
              <div style={{ padding: 24 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div className="sd-skel" style={{ width: '15%' }} />
                    <div className="sd-skel" style={{ width: '25%' }} />
                    <div className="sd-skel" style={{ width: '20%' }} />
                    <div className="sd-skel" style={{ width: '15%' }} />
                    <div className="sd-skel" style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-subtle)' }}>
                <Icon.ClipboardList />
                <p style={{ marginTop: 12, fontWeight: 600, fontSize: 15, color: 'var(--color-text-muted)' }}>
                  No orders assigned yet
                </p>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  Your admin will assign orders to you soon.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="sd-table">
                  <thead className="sd-thead">
                    <tr>
                      <th className="sd-th">Order #</th>
                      <th className="sd-th">Client</th>
                      <th className="sd-th">Generators</th>
                      <th className="sd-th" style={{ textAlign: 'center' }}>Function Date</th>
                      <th className="sd-th" style={{ textAlign: 'center' }}>Status</th>
                      <th className="sd-th" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o, i) => {
                      const gens = o.generators || [];
                      const firstName = gens[0]?.generatorName || '—';
                      const extra    = gens.length > 1 ? ` +${gens.length - 1}` : '';
                      return (
                        <tr
                          key={o.id}
                          className="sd-row"
                          style={{ background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)' }}
                        >
                          <td className="sd-td">
                            <span style={{
                              fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5,
                              background: '#EFF6FF', color: '#1D4ED8',
                              padding: '2px 8px', borderRadius: 6,
                            }}>
                              {o.id}
                            </span>
                          </td>
                          <td className="sd-td">
                            <div style={{ fontWeight: 600 }}>{o.clientName}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--color-text-subtle)', marginTop: 1 }}>
                              {o.contactNumber}
                            </div>
                          </td>
                          <td className="sd-td">
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{firstName}{extra && <span style={{ color: 'var(--color-primary)', fontSize: 11, marginLeft: 4 }}>{extra} more</span>}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>
                              {gens.length} generator{gens.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="sd-td" style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                            {o.functionDate || '—'}
                          </td>
                          <td className="sd-td" style={{ textAlign: 'center' }}>
                            <StatusChip status={o.status} />
                          </td>
                          <td className="sd-td" style={{ textAlign: 'center' }}>
                            <button
                              className="sd-action-btn"
                              title="View Order"
                              onClick={() => navigate(ROUTES.STAFF_ORDER_DETAIL.replace(':id', o.id))}
                            >
                              <Icon.Eye />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Info Card ─────────────────────────────────────────── */}
        <div className="sd-content" style={{ marginTop: 28 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#DBEAFE', color: '#1D4ED8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon.Zap />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1E40AF' }}>
                Staff Access — Read Only
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#3B82F6', lineHeight: 1.5 }}>
                You can view all generator orders assigned to you. Contact your Admin or Super Admin to make changes to any order.
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.STAFF_ORDERS)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#2563EB', color: '#fff',
                border: 'none', borderRadius: 10,
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                transition: 'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
            >
              View My Orders <Icon.ArrowRight />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
