// src/pages/dashboard/SuperAdminDashboard.jsx
import { useState } from 'react'
import {
  Users, ShieldCheck, Activity, Server,
  TrendingUp, ArrowUpRight, Globe, Lock, ChevronRight
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import AdminDashboard from './AdminDashboard'

// ─── Mock platform-wide data ──────────────────────────────────────────────────
const PLATFORM_STATS = [
  {
    label: 'Total Users',   value: '24',  change: '+3', up: true,
    icon: Users,       bg: 'var(--color-primary-50)',     iconColor: 'var(--color-primary)',
  },
  {
    label: 'Active Admins', value: '6',   change: '+1', up: true,
    icon: ShieldCheck, bg: 'var(--color-info-light)',      iconColor: 'var(--color-info)',
  },
  {
    label: 'System Health', value: '98%', change: '+0.4%', up: true,
    icon: Activity,    bg: 'var(--color-success-light)',   iconColor: 'var(--color-success)',
  },
  {
    label: 'API Uptime',    value: '99.9%',change: 'Stable', up: true,
    icon: Server,      bg: 'var(--color-warning-light)',   iconColor: 'var(--color-warning)',
  },
]

const USER_ACTIVITY = [
  { day: 'Mon', logins: 18, actions: 142 },
  { day: 'Tue', logins: 22, actions: 188 },
  { day: 'Wed', logins: 15, actions: 110 },
  { day: 'Thu', logins: 27, actions: 215 },
  { day: 'Fri', logins: 24, actions: 194 },
  { day: 'Sat', logins: 8,  actions: 56 },
  { day: 'Sun', logins: 5,  actions: 34 },
]

const ADMIN_LIST = [
  { name: 'Ravi Sharma',    role: 'Admin',       module: 'Inventory', status: 'online',  lastSeen: 'Now' },
  { name: 'Priya Mehta',    role: 'Admin',       module: 'Products',  status: 'online',  lastSeen: 'Now' },
  { name: 'Ajay Patel',     role: 'Admin',       module: 'Reports',   status: 'offline', lastSeen: '2h ago' },
  { name: 'Sneha Rao',      role: 'Super Admin', module: 'All',       status: 'online',  lastSeen: 'Now' },
]

const AUDIT_LOG = [
  { user: 'Ravi Sharma',  action: 'Bulk imported 48 products',    time: '10 min ago', severity: 'info' },
  { user: 'Priya Mehta',  action: 'Category "Sports" deleted',    time: '1 hr ago',   severity: 'warning' },
  { user: 'Ajay Patel',   action: 'Exported inventory report',    time: '3 hr ago',   severity: 'info' },
  { user: 'System',       action: 'Nightly stock sync completed', time: '6 hr ago',   severity: 'success' },
  { user: 'Sneha Rao',    action: 'Admin role granted to Ravi',   time: '1 day ago',  severity: 'warning' },
]

const SEVERITY = {
  info:    { dot: 'var(--color-info)',    bg: 'var(--color-info-light)' },
  warning: { dot: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
  success: { dot: 'var(--color-success)', bg: 'var(--color-success-light)' },
  danger:  { dot: 'var(--color-danger)',  bg: 'var(--color-danger-light)' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function PlatformStatCard({ label, value, change, up, icon: Icon, bg, iconColor }) {
  return (
    <div className="p-5 rounded-xl flex items-center gap-4 transition-shadow hover:shadow-md"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
      </div>
      <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
        style={{
          background: up ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          color: up ? 'var(--color-success)' : 'var(--color-danger)',
        }}>
        {up ? <ArrowUpRight size={11} /> : null}
        {change}
      </span>
    </div>
  )
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 text-sm shadow-lg"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>  
      ))}
    </div>
  )
}

// ─── Platform section (shown above AdminDashboard)
function PlatformSection() {
  return (
    <div className="space-y-5 mb-2">
      {/* Platform Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORM_STATS.map(s => <PlatformStatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* User Activity Chart */}
        <div className="xl:col-span-2">
          <SectionCard title="Platform Activity — This Week" subtitle="Logins and admin actions per day">
            <div className="p-5">
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={USER_ACTIVITY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="logins"  name="Logins"  stroke="#2563EB" strokeWidth={2.5}
                    dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="actions" name="Actions" stroke="#10B981" strokeWidth={2.5}
                    dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Admin Users List */}
        <SectionCard title="Admin Users" subtitle="Current access holders">
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {ADMIN_LIST.map((a, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary)' }}>
                  {a.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{a.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{a.role} · {a.module}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full"
                    style={{ background: a.status === 'online' ? 'var(--color-success)' : 'var(--color-border-strong)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{a.lastSeen}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Audit Log */}
      <SectionCard title="Audit Log" subtitle="Recent privileged actions across the platform">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['User', 'Action', 'Time', 'Severity'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((log, i) => {
                const s = SEVERITY[log.severity]
                return (
                  <tr key={i} className="transition-colors hover:bg-slate-50"
                    style={{ borderBottom: i < AUDIT_LOG.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td className="px-5 py-3 font-medium text-xs" style={{ color: 'var(--color-text)' }}>{log.user}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{log.action}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-text-subtle)' }}>{log.time}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 w-fit text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: s.bg, color: s.dot }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [showPlatform, setShowPlatform] = useState(true)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* ── Super Admin Banner ── */}
      <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 px-4 py-3 rounded-xl flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <ShieldCheck size={15} style={{ color: 'var(--color-text-inverse)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
              Super Admin — Platform-wide access
            </p>
            <p className="text-xs" style={{ color: 'var(--color-primary)' }}>
              You have full visibility across all modules, users, and audit logs
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPlatform(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}>
          {showPlatform ? 'Hide' : 'Show'} Platform Stats
          <ChevronRight size={13} className={`transition-transform ${showPlatform ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* ── Platform-only section (collapsible) ── */}
      {showPlatform && (
        <div className="px-4 sm:px-6 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-text-subtle)' }}>
            <Globe size={12} /> Platform Overview
          </p>
          <PlatformSection />
        </div>
      )}

      {/* ── Divider ── */}
      <div className="mx-4 sm:mx-6 my-4 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: 'var(--color-text-subtle)' }}>
          <Lock size={10} /> Inventory Dashboard (Admin View)
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
      </div>

      {/* ── Embedded Admin Dashboard ── */}
      <AdminDashboard />
    </div>
  )
}