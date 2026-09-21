// src/pages/dashboard/AdminDashboard.jsx
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  PlusCircle,
  ClipboardList,
  Receipt,
  Wallet,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'

// ── 6 Core Quick Action Redirect Links ──────────────────────────────────────
const QUICK_LINKS = [
  {
    id: 'add-new-order',
    title: 'Add New Order',
    tag: 'New Booking',
    route: ROUTES.GENERATOR_ORDER_ADD,
    icon: PlusCircle,
    theme: {
      border: 'border-blue-200/90 hover:border-blue-400',
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      btnBg: 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white border-blue-200',
    },
  },
  {
    id: 'stock-availability',
    title: 'Check Stock Availability',
    tag: 'Live Calendar',
    route: ROUTES.GENERATOR_AVAILABILITY,
    icon: CalendarCheck,
    theme: {
      border: 'border-emerald-200/90 hover:border-emerald-400',
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      btnBg: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white border-emerald-200',
    },
  },
  {
    id: 'order-management',
    title: 'Order Management',
    tag: 'Operations',
    route: ROUTES.GENERATOR_ORDERS,
    icon: ClipboardList,
    theme: {
      border: 'border-indigo-200/90 hover:border-indigo-400',
      gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      btnBg: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white border-indigo-200',
    },
  },
  {
    id: 'billing-history',
    title: 'Billing History',
    tag: 'Invoices',
    route: ROUTES.GENERATOR_BILLING_HISTORY,
    icon: Receipt,
    theme: {
      border: 'border-sky-200/90 hover:border-sky-400',
      gradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      iconBg: 'bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white',
      btnBg: 'bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white border-sky-200',
    },
  },
  {
    id: 'customer-management',
    title: 'Customer Management',
    tag: 'Directory',
    route: ROUTES.CUSTOMERS,
    icon: Users,
    theme: {
      border: 'border-amber-200/90 hover:border-amber-400',
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      btnBg: 'bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white border-amber-200',
    },
  },
  {
    id: 'pending-payments',
    title: 'Pending Payments',
    tag: 'Receivables',
    route: ROUTES.CUSTOMER_PENDING,
    icon: Wallet,
    theme: {
      border: 'border-rose-200/90 hover:border-rose-400',
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
      btnBg: 'bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white border-rose-200',
    },
  },
]

export default function AdminDashboard({
  title = 'Dashboard Quick Links',
  subtitle = 'Quickly access key workflows across generator inventory, booking operations, customer billing, and payment tracking.',
  badgeText = 'ERP Operations Hub',
  children,
}) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--color-bg)' }}>
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="border-b bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  {badgeText}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  Signed in as <strong className="text-slate-700">{user?.name || 'Administrator'}</strong>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {subtitle}
              </p>
            </div>

            {/* Quick status badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 shadow-xs">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>6 Core Portals Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Compact Redirect Buttons Grid ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.id}
                onClick={() => navigate(item.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(item.route)
                  }
                }}
                className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-white border ${item.theme.border} bg-gradient-to-br ${item.theme.gradient} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {/* Top Row: Icon + Category Tag */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 shadow-xs ${item.theme.iconBg}`}
                  >
                    <Icon size={20} />
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.theme.badgeBg}`}
                  >
                    {item.tag}
                  </span>
                </div>

                {/* Bottom Row: Title + Compact Action Button */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h2>

                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all duration-150 shrink-0 ${item.theme.btnBg}`}
                  >
                    <span>Open</span>
                    <ArrowRight
                      size={12}
                      className="transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Additional Dynamic Content (e.g. Completed Orders Table) ──── */}
        {children}

      </div>
    </div>
  )
}