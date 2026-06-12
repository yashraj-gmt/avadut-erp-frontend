// src/pages/dashboard/AdminDashboard.jsx
import { useState, useMemo } from 'react'
import {
  Package, Tag, TrendingUp, AlertTriangle, BarChart2,
  ShoppingCart, ArrowUpRight, ArrowDownRight, Clock, RefreshCw,
  Filter, ChevronDown, Eye
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STOCK_TREND = [
  { month: 'Jan', inStock: 420, lowStock: 32, outOfStock: 8 },
  { month: 'Feb', inStock: 390, lowStock: 45, outOfStock: 12 },
  { month: 'Mar', inStock: 460, lowStock: 28, outOfStock: 6 },
  { month: 'Apr', inStock: 510, lowStock: 38, outOfStock: 9 },
  { month: 'May', inStock: 480, lowStock: 42, outOfStock: 14 },
  { month: 'Jun', inStock: 530, lowStock: 25, outOfStock: 5 },
  { month: 'Jul', inStock: 575, lowStock: 31, outOfStock: 7 },
]

const CATEGORY_DIST = [
  { name: 'Electronics',  value: 142, color: '#2563EB' },
  { name: 'Clothing',     value: 98,  color: '#10B981' },
  { name: 'Furniture',    value: 74,  color: '#F59E0B' },
  { name: 'Grocery',      value: 113, color: '#0EA5E9' },
  { name: 'Stationery',   value: 56,  color: '#EF4444' },
]

const TOP_PRODUCTS = [
  { name: 'Wireless Headphones', category: 'Electronics', stock: 284, value: '₹5,68,000', status: 'in-stock' },
  { name: 'Cotton T-Shirt (L)',   category: 'Clothing',    stock: 18,  value: '₹27,000',  status: 'low-stock' },
  { name: 'Office Chair',         category: 'Furniture',   stock: 0,   value: '₹0',       status: 'out-stock' },
  { name: 'Basmati Rice 5kg',     category: 'Grocery',     stock: 432, value: '₹2,16,000',status: 'in-stock' },
  { name: 'A4 Notebook Pack',     category: 'Stationery',  stock: 12,  value: '₹9,600',   status: 'low-stock' },
]

const RECENT_ACTIVITY = [
  { action: 'Product Added',    item: 'USB-C Hub 7-in-1',     time: '2 min ago',  type: 'add' },
  { action: 'Stock Updated',    item: 'Wireless Headphones',  time: '18 min ago', type: 'update' },
  { action: 'Category Created', item: 'Sports & Outdoors',    time: '1 hr ago',   type: 'add' },
  { action: 'Low Stock Alert',  item: 'A4 Notebook Pack',     time: '3 hr ago',   type: 'alert' },
  { action: 'Product Removed',  item: 'Broken Desk Lamp',     time: '5 hr ago',   type: 'remove' },
]

const STATS = [
  {
    label: 'Total Products', value: '483', change: '+12', up: true,
    icon: Package, bg: 'var(--color-primary-50)', iconColor: 'var(--color-primary)',
    sub: 'vs last month',
  },
  {
    label: 'Categories', value: '18', change: '+2', up: true,
    icon: Tag, bg: 'var(--color-success-light)', iconColor: 'var(--color-success)',
    sub: 'vs last month',
  },
  {
    label: 'Stock Value', value: '₹24.6L', change: '+8.3%', up: true,
    icon: TrendingUp, bg: 'var(--color-warning-light)', iconColor: 'var(--color-warning)',
    sub: 'total inventory worth',
  },
  {
    label: 'Low Stock Items', value: '31', change: '+5', up: false,
    icon: AlertTriangle, bg: 'var(--color-danger-light)', iconColor: 'var(--color-danger)',
    sub: 'need restocking',
  },
]

const TABS = ['Overview', 'Products', 'Categories', 'Activity']

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, change, up, icon: Icon, bg, iconColor, sub }) {
  return (
    <div
      className="p-5 rounded-xl flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon size={19} style={{ color: iconColor }} />
        </div>
        <span
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
          style={{
            background: up ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            color: up ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{sub}</p>
    </div>
  )
}

const STATUS_MAP = {
  'in-stock':  { label: 'In Stock',    bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  'low-stock': { label: 'Low Stock',   bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  'out-stock': { label: 'Out of Stock',bg: 'var(--color-danger-light)',  color: 'var(--color-danger)' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status]
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

const ACTIVITY_COLORS = {
  add:    { dot: 'var(--color-success)', bg: 'var(--color-success-light)' },
  update: { dot: 'var(--color-info)',    bg: 'var(--color-info-light)' },
  alert:  { dot: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
  remove: { dot: 'var(--color-danger)',  bg: 'var(--color-danger-light)' },
}

function SectionCard({ title, action, children }) {
  return (
    <div className="rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
        {action && (
          <button className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}>
            {action} <Eye size={12} />
          </button>
        )}
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

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function OverviewTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Stock Trend — spans 2 cols */}
      <div className="xl:col-span-2">
        <SectionCard title="Stock Trend — Last 7 Months">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={STOCK_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 8 }} />
                <Area type="monotone" dataKey="inStock"    name="In Stock"     stroke="#2563EB" fill="url(#gInStock)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="lowStock"   name="Low Stock"    stroke="#F59E0B" fill="url(#gLow)"     strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="outOfStock" name="Out of Stock" stroke="#EF4444" fill="url(#gOut)"     strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Category Distribution */}
      <SectionCard title="Stock by Category">
        <div className="p-5 flex flex-col gap-4">
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={CATEGORY_DIST} dataKey="value" cx="50%" cy="50%"
                innerRadius={52} outerRadius={80} paddingAngle={3}>
                {CATEGORY_DIST.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} products`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {CATEGORY_DIST.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>{c.name}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function ProductsTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Top Products Table */}
      <div className="xl:col-span-2">
        <SectionCard title="Top Products by Stock" action="View All">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Product', 'Category', 'Stock', 'Value', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--color-text-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_PRODUCTS.map((p, i) => (
                  <tr key={i} className="transition-colors hover:bg-slate-50"
                    style={{ borderBottom: i < TOP_PRODUCTS.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.category}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--color-text)' }}>{p.stock}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--color-text-muted)' }}>{p.value}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Stock Status Bar Chart */}
      <SectionCard title="Stock by Category (Units)">
        <div className="p-5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={CATEGORY_DIST} layout="vertical" margin={{ left: 4, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Products" radius={[0, 4, 4, 0]}>
                {CATEGORY_DIST.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  )
}

function CategoriesTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {CATEGORY_DIST.map((cat) => {
        const total = CATEGORY_DIST.reduce((s, c) => s + c.value, 0)
        const pct = Math.round((cat.value / total) * 100)
        return (
          <div key={cat.name} className="p-5 rounded-xl transition-shadow hover:shadow-md"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: cat.color + '1A' }}>
                <Tag size={18} style={{ color: cat.color }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{cat.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{cat.value} products</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full mb-1" style={{ background: 'var(--color-surface-2)' }}>
              <div className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, background: cat.color }} />
            </div>
            <p className="text-xs text-right" style={{ color: 'var(--color-text-subtle)' }}>{pct}% of catalog</p>
          </div>
        )
      })}

      {/* Monthly bar chart spanning remaining */}
      <div className="sm:col-span-2 xl:col-span-3">
        <SectionCard title="Monthly Stock Movement">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={STOCK_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 8 }} />
                <Bar dataKey="inStock"    name="In Stock"     fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowStock"   name="Low Stock"    fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outOfStock" name="Out of Stock" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function ActivityTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <SectionCard title="Recent Activity">
        <ul className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--color-border)' }}>
          {RECENT_ACTIVITY.map((a, i) => {
            const c = ACTIVITY_COLORS[a.type]
            return (
              <li key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: c.bg }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{a.action}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{a.item}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                  <Clock size={11} />
                  {a.time}
                </div>
              </li>
            )
          })}
        </ul>
      </SectionCard>

      {/* Quick Stats Panel */}
      <div className="flex flex-col gap-5">
        <SectionCard title="Inventory Health">
          <div className="p-5 flex flex-col gap-4">
            {[
              { label: 'In Stock',     pct: 87, color: 'var(--color-success)',  count: '421 products' },
              { label: 'Low Stock',    pct: 10, color: 'var(--color-warning)',  count: '31 products' },
              { label: 'Out of Stock', pct: 3,  color: 'var(--color-danger)',   count: '7 products' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--color-text-subtle)' }}>{item.count}</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Add Product',    icon: Package,    color: 'var(--color-primary)',  bg: 'var(--color-primary-50)' },
              { label: 'Add Category',   icon: Tag,        color: 'var(--color-success)',  bg: 'var(--color-success-light)' },
              { label: 'View Reports',   icon: BarChart2,  color: 'var(--color-warning)',  bg: 'var(--color-warning-light)' },
              { label: 'Stock Alerts',   icon: AlertTriangle, color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
            ].map(({ label, icon: Icon, color, bg }) => (
              <button key={label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: bg, color }}>
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [lastRefresh] = useState('Just now')

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'Overview':    return <OverviewTab />
      case 'Products':    return <ProductsTab />
      case 'Categories':  return <CategoriesTab />
      case 'Activity':    return <ActivityTab />
      default:            return <OverviewTab />
    }
  }, [activeTab])

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'var(--color-bg)' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Inventory Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Track products, categories & stock health at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-subtle)' }}>
            <RefreshCw size={12} /> Updated {lastRefresh}
          </span>
          <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}>
            <Filter size={13} /> Filter
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Tabs ── */}
      <div className="mb-5 flex gap-1 p-1 rounded-xl w-full sm:w-auto inline-flex"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background:  activeTab === tab ? 'var(--color-surface)' : 'transparent',
              color:       activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow:   activeTab === tab ? 'var(--shadow-sm)' : 'none',
              fontWeight:  activeTab === tab ? 600 : 400,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tabContent}
    </div>
  )
}