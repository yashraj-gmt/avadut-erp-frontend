// src/pages/dashboard/AdminDashboard.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  PlusCircle,
  ClipboardList,
  Receipt,
  Wallet,
  Users,
  ArrowRight,
  UserCog,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'

// ── Quick Action Cards ───────────────────────────────────────────────────────
const QUICK_LINKS = [
  {
    id: 'staff-management',
    title: 'Staff Management',
    desc: 'Manage staff accounts and order performance',
    route: ROUTES.STAFF_MANAGEMENT,
    icon: UserCog,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
    borderHover: 'hover:border-purple-400',
  },
  {
    id: 'add-new-order',
    title: 'Add New Order',
    desc: 'Create and book a new generator rental',
    route: ROUTES.GENERATOR_ORDER_ADD,
    icon: PlusCircle,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
    borderHover: 'hover:border-blue-400',
  },
  {
    id: 'stock-availability',
    title: 'Check Stock Availability',
    desc: 'Live calendar of available & booked generators',
    route: ROUTES.GENERATOR_AVAILABILITY,
    icon: CalendarCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
    borderHover: 'hover:border-emerald-400',
  },
  {
    id: 'order-management',
    title: 'Order Management',
    desc: 'Track and manage all generator orders',
    route: ROUTES.GENERATOR_ORDERS,
    icon: ClipboardList,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
    borderHover: 'hover:border-indigo-400',
  },
  {
    id: 'billing-history',
    title: 'Billing History',
    desc: 'Review generator bills and invoice records',
    route: ROUTES.GENERATOR_BILLING_HISTORY,
    icon: Receipt,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50 group-hover:bg-sky-600 group-hover:text-white',
    borderHover: 'hover:border-sky-400',
  },
  {
    id: 'customer-management',
    title: 'Customer Management',
    desc: 'Manage customer accounts, profiles and history',
    route: ROUTES.CUSTOMERS,
    icon: Users,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
    borderHover: 'hover:border-amber-400',
  },
  {
    id: 'pending-payments',
    title: 'Pending Payments',
    desc: 'Track outstanding balances and receivables',
    route: ROUTES.CUSTOMER_PENDING,
    icon: Wallet,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 group-hover:bg-rose-600 group-hover:text-white',
    borderHover: 'hover:border-rose-400',
  },
]

export default function AdminDashboard({
  title = 'Dashboard Quick Links',
  subtitle = '',
  badgeText = 'ERP Operations Hub',
  headerRight = null,
  children,
}) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { canAccess } = usePermissions()

  const visibleLinks = QUICK_LINKS.filter((item) => canAccess(item.route))

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--color-bg)' }}>
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="border-b bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  {badgeText}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  Signed in as <strong className="text-slate-800">{user?.name || 'Administrator'}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm text-slate-600 mt-1">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Header Right: Custom Slot (e.g. Today's Bookings Count) */}
            {headerRight ? (
              <div className="flex items-center gap-2.5 self-start sm:self-center">
                {headerRight}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Content ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        {/* Quick Portals Grid */}
        <section aria-label="Quick Actions">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {visibleLinks.map((item) => {
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
                  className={`group flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md ${item.borderHover} hover:-translate-y-0.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 shadow-2xs ${item.iconBg} ${item.iconColor}`}
                    >
                      <Icon size={22} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0 ml-2">
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Dynamic Child Sections (e.g. Today's Bookings) ─────────────── */}
        {children}
      </div>
    </div>
  )
}