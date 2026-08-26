// src/pages/dashboard/AdminDashboard.jsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Zap, TrendingUp, AlertTriangle, BarChart2,
  Clock, RefreshCw, Filter, Eye, ArrowUpRight, ArrowDownRight,
  Plus
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { productService } from '@/services/inventoryService'
import { generatorService } from '@/services/generatorService'
import { ROUTES } from '@/constants/routes'
import { SpinnerInline } from '@/components/shared'

// ─── Constants & Mock Trend Data ──────────────────────────────────────────────
const STOCK_TREND = [
  { month: 'Jan', inStock: 420, lowStock: 32, outOfStock: 8 },
  { month: 'Feb', inStock: 390, lowStock: 45, outOfStock: 12 },
  { month: 'Mar', inStock: 460, lowStock: 28, outOfStock: 6 },
  { month: 'Apr', inStock: 510, lowStock: 38, outOfStock: 9 },
  { month: 'May', inStock: 480, lowStock: 42, outOfStock: 14 },
  { month: 'Jun', inStock: 530, lowStock: 25, outOfStock: 5 },
  { month: 'Jul', inStock: 575, stop: 31, outOfStock: 7 },
]

const TABS = ['Overview', 'Products', 'Activity']

// ─── Format Helpers ───────────────────────────────────────────────────────────
const formatCurrency = (val) => {
  if (val == null) return "₹0"
  if (val >= 10000000) {
    return "₹" + (val / 10000000).toFixed(2) + "Cr"
  }
  if (val >= 100000) {
    return "₹" + (val / 100000).toFixed(2) + "L"
  }
  return "₹" + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

// ─── Sub-components
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
        {change && (
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
        )}
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

function SectionCard({ title, action, onActionClick, children }) {
  return (
    <div className="rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
        {action && (
          <button onClick={onActionClick} className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
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
          {p.name}: <span className="font-bold">{p.name === 'Value' ? formatCurrency(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function OverviewTab({ products, generators }) {
  // Value Split between Products & Generators
  const totalProdVal = useMemo(() => products.reduce((s, p) => s + ((p.purchasePrice ?? 0) * (p.currentStock ?? 0)), 0), [products])
  const totalGenVal = useMemo(() => generators.reduce((s, g) => s + ((g.purchasePrice ?? 0) * (g.stockQuantity ?? 0)), 0), [generators])

  const chartData = useMemo(() => {
    if (totalProdVal === 0 && totalGenVal === 0) {
      return [
        { name: 'Products', value: 1, color: '#3b82f6' },
        { name: 'Generators', value: 1, color: '#ef4444' }
      ]
    }
    return [
      { name: 'Products Value', value: totalProdVal, color: '#2563EB' },
      { name: 'Generators Value', value: totalGenVal, color: '#EF4444' }
    ]
  }, [totalProdVal, totalGenVal])

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

      {/* Value Split */}
      <SectionCard title="Inventory Value Split">
        <div className="p-5 flex flex-col gap-4">
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={chartData} dataKey="value" cx="50%" cy="50%"
                innerRadius={52} outerRadius={80} paddingAngle={3}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [formatCurrency(v), 'Value']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {chartData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>{c.name}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {totalProdVal === 0 && totalGenVal === 0 ? '₹0' : formatCurrency(c.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function ProductsTab({ products, generators }) {
  const navigate = useNavigate()

  // Top products sorted by stock
  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.currentStock ?? 0) - (a.currentStock ?? 0))
      .slice(0, 5)
  }, [products])

  // Count stock levels for products and generators combined
  const counts = useMemo(() => {
    let inStock = 0
    let lowStock = 0
    let outOfStock = 0

    const checkStock = (stock) => {
      if (stock === 0) outOfStock++
      else if (stock <= 5) lowStock++
      else inStock++
    }

    products.forEach(p => checkStock(p.currentStock ?? 0))
    generators.forEach(g => checkStock(g.stockQuantity ?? 0))

    return [
      { name: 'In Stock', value: inStock, color: '#10B981' },
      { name: 'Low Stock', value: lowStock, color: '#F59E0B' },
      { name: 'Out of Stock', value: outOfStock, color: '#EF4444' }
    ]
  }, [products, generators])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Top Products Table */}
      <div className="xl:col-span-2">
        <SectionCard title="Top Products by Stock" action="View All" onActionClick={() => navigate(ROUTES.PRODUCTS)}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Product', 'SKU / Code', 'Stock', 'Value', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--color-text-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">No products found.</td>
                  </tr>
                ) : topProducts.map((p, i) => {
                  const stock = p.currentStock ?? 0
                  const status = stock === 0 ? 'out-stock' : stock <= 5 ? 'low-stock' : 'in-stock'
                  const val = stock * (p.purchasePrice ?? 0)

                  return (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50"
                      style={{ borderBottom: i < topProducts.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{p.productCode}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--color-text)' }}>{stock}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(val)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Stock Status Bar Chart */}
      <SectionCard title="Inventory Stock Status">
        <div className="p-5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={counts} layout="vertical" margin={{ left: 4, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Items" radius={[0, 4, 4, 0]}>
                {counts.map((entry) => (
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

function ActivityTab({ products, generators }) {
  const navigate = useNavigate()

  // Generate activities dynamically from latest products/generators
  const recentActivities = useMemo(() => {
    const items = [
      ...products.map(p => ({ label: 'Product Added', name: p.name, date: new Date(p.createdAt || Date.now()), type: 'add' })),
      ...generators.map(g => ({ label: 'Generator Added', name: g.name, date: new Date(g.createdAt || Date.now()), type: 'add' }))
    ]
    // Sort by date descending
    const sorted = items.sort((a, b) => b.date - a.date).slice(0, 5)

    // Map to formatted relative time
    return sorted.map((item, idx) => {
      const diffMs = Date.now() - item.date.getTime()
      const diffMin = Math.max(1, Math.floor(diffMs / 60000))
      let timeStr = `${diffMin} min ago`
      if (diffMin >= 60) {
        const hrs = Math.floor(diffMin / 60)
        timeStr = hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`
        if (hrs >= 24) {
          const days = Math.floor(hrs / 24)
          timeStr = days === 1 ? '1 day ago' : `${days} days ago`
        }
      }
      return {
        action: item.label,
        item: item.name,
        time: idx === 0 ? 'Just now' : timeStr,
        type: item.type
      }
    })
  }, [products, generators])

  // Count combined stock health
  const healthStats = useMemo(() => {
    let inStock = 0
    let lowStock = 0
    let outOfStock = 0

    const countStock = (stock) => {
      if (stock === 0) outOfStock++
      else if (stock <= 5) lowStock++
      else inStock++
    }

    products.forEach(p => countStock(p.currentStock ?? 0))
    generators.forEach(g => countStock(g.stockQuantity ?? 0))

    const total = inStock + lowStock + outOfStock || 1
    return [
      { label: 'In Stock',     pct: Math.round((inStock / total) * 100), color: 'var(--color-success)',  count: `${inStock} items` },
      { label: 'Low Stock',    pct: Math.round((lowStock / total) * 100), color: 'var(--color-warning)',  count: `${lowStock} items` },
      { label: 'Out of Stock', pct: Math.round((outOfStock / total) * 100), color: 'var(--color-danger)',   count: `${outOfStock} items` },
    ]
  }, [products, generators])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <SectionCard title="Recent Activity">
        <ul className="divide-y" style={{ borderColor: 'var(--color-border)', margin: 0, padding: 0, listStyle: 'none' }}>
          {recentActivities.length === 0 ? (
            <li className="text-center py-8 text-slate-400">No recent activity.</li>
          ) : recentActivities.map((a, i) => {
            const c = STATUS_MAP[a.type === 'add' ? 'in-stock' : a.type === 'alert' ? 'low-stock' : 'out-stock'] || STATUS_MAP['in-stock']
            return (
              <li key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: c.bg }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{a.action}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{a.item}</p>
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
            {healthStats.map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{item.label}</span>
                  <div className="flex items-center gap-2 font-semibold">
                    <span style={{ color: 'var(--color-text-subtle)' }}>{item.count}</span>
                    <span style={{ color: 'var(--color-text)' }}>{item.pct}%</span>
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
            <button
              onClick={() => navigate('/inventory/products/add')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={20} />
              Add Product
            </button>
            <button
              onClick={() => navigate('/generators/add')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={20} />
              Add Generator
            </button>
            <button
              onClick={() => navigate(ROUTES.PRODUCTS)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: 'none', cursor: 'pointer' }}
            >
              <BarChart2 size={20} />
              View Products
            </button>
            <button
              onClick={() => navigate(ROUTES.GENERATORS)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
            >
              <Zap size={20} />
              View Generators
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [products, setProducts] = useState([])
  const [generators, setGenerators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState('Just now')

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prodRes, genRes] = await Promise.all([
        productService.getAll({ size: 1000, sortBy: 'createdAt', sortDir: 'desc' }),
        generatorService.getAll({ size: 1000, sortBy: 'createdAt', sortDir: 'desc' })
      ])
      
      const prodContent = prodRes.data?.content ?? prodRes.data ?? []
      const genContent = genRes.data?.content ?? genRes.data ?? []
      
      setProducts(prodContent)
      setGenerators(genContent)
      setLastRefresh(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Could not connect to the server to load inventory statistics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Computed metrics
  const totalStockValue = useMemo(() => {
    const prodVal = products.reduce((s, p) => s + ((p.purchasePrice ?? 0) * (p.currentStock ?? 0)), 0)
    const genVal = generators.reduce((s, g) => s + ((g.purchasePrice ?? 0) * (g.stockQuantity ?? 0)), 0)
    return prodVal + genVal
  }, [products, generators])

  const lowStockCount = useMemo(() => {
    const lowProds = products.filter(p => (p.currentStock ?? 0) <= 5).length
    const lowGens = generators.filter(g => (g.stockQuantity ?? 0) <= 1).length
    return lowProds + lowGens
  }, [products, generators])

  const statsList = useMemo(() => [
    {
      label: 'Total Products', value: String(products.length),
      icon: Package, bg: 'var(--color-primary-50)', iconColor: 'var(--color-primary)',
      sub: 'in inventory catalog',
    },
    {
      label: 'Total Generators', value: String(generators.length),
      icon: Zap, bg: 'var(--color-danger-light)', iconColor: 'var(--color-danger)',
      sub: 'in generator catalog',
    },
    {
      label: 'Total Value', value: formatCurrency(totalStockValue),
      icon: TrendingUp, bg: 'var(--color-warning-light)', iconColor: 'var(--color-warning)',
      sub: 'total inventory worth',
    },
    {
      label: 'Low Stock Items', value: String(lowStockCount),
      icon: AlertTriangle, bg: 'var(--color-danger-light)', iconColor: 'var(--color-danger)',
      sub: 'need restructuring/stock',
    },
  ], [products.length, generators.length, totalStockValue, lowStockCount])

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'Overview': return <OverviewTab products={products} generators={generators} />
      case 'Products': return <ProductsTab products={products} generators={generators} />
      case 'Activity': return <ActivityTab products={products} generators={generators} />
      default:         return <OverviewTab products={products} generators={generators} />
    }
  }, [activeTab, products, generators])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SpinnerInline message="Loading dashboard statistics…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-3" />
        <p className="text-slate-600 font-semibold mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-700"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'var(--color-bg)' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Inventory Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Track products, generators & stock health in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-subtle)' }}>
            <RefreshCw size={12} /> Refreshed: {lastRefresh}
          </span>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)', border: 'none', cursor: 'pointer' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsList.map(s => <StatCard key={s.label} {...s} />)}
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
              border:      'none',
              cursor:      'pointer'
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