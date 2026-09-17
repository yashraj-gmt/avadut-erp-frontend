// src/pages/staff/StaffDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { getStaffOrdersList } from '@/pages/generators/orders/mockData';
import {
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // Fetch staff orders
  const myOrders = useMemo(() => {
    return getStaffOrdersList(user);
  }, [user]);

  // Compute live stats for the 4 cards
  const stats = useMemo(() => {
    const total = myOrders.length;
    const inProgress = myOrders.filter(o => o.status === 'IN_PROGRESS').length;
    const pending = myOrders.filter(o => o.status === 'PENDING').length;
    const completed = myOrders.filter(o => o.status === 'COMPLETED').length;
    return { total, inProgress, pending, completed };
  }, [myOrders]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statCards = [
    {
      label: 'TOTAL ASSIGNED',
      value: stats.total,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      desc: 'All assigned generator orders',
    },
    {
      label: 'IN PROGRESS',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      desc: 'Active orders currently running',
    },
    {
      label: 'PENDING',
      value: stats.pending,
      icon: AlertCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      desc: 'Awaiting site dispatch or setup',
    },
    {
      label: 'COMPLETED',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'Finished orders returned',
    },
  ];

  return (
    <div className="min-h-screen pb-14" style={{ background: 'var(--color-bg)' }}>
      {/* ── Top Hero Banner ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Shield size={13} />
                  Staff Portal
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300">
                  Logged in as <strong className="text-white">{user?.name || 'Staff Member'}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {greeting()}, {user?.name?.split(' ')[0] || 'Staff'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Track your assigned orders and easily log generator start and end operating times.
              </p>
            </div>

            <button
              onClick={() => navigate(ROUTES.STAFF_ORDERS)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer w-fit"
            >
              <span>Go to My Orders</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Simple Stat Cards ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((stat, i) => {
            const IconComp = stat.icon;
            return (
              <div
                key={i}
                onClick={() => navigate(ROUTES.STAFF_ORDERS)}
                role="button"
                tabIndex={0}
                className={`p-5 rounded-xl bg-white border ${stat.border} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <IconComp size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Orders
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {loading ? '—' : stat.value}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-0.5">
                    {stat.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {stat.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Simple Quick Navigation Card ──────────────────────────────── */}
        <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ClipboardList size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manage Assigned Orders & Log Times
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                View all your assigned bookings, check site details, and update generator & diesel start/end hours directly.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(ROUTES.STAFF_ORDERS)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <span>Open My Orders</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
