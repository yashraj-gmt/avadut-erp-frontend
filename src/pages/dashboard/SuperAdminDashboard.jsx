// src/pages/dashboard/SuperAdminDashboard.jsx
import React, { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import AdminDashboard from './AdminDashboard'
import TodayBookings from './components/TodayBookings'

/**
 * SuperAdminDashboard
 * Presents the Operations & Quick-Action Hub plus Today's Generator Bookings overview.
 */
export default function SuperAdminDashboard() {
  const [todayCount, setTodayCount] = useState(null)

  const scrollToBookings = () => {
    const el = document.getElementById('today-bookings-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <AdminDashboard
      title="Super Admin Dashboard"
      subtitle=""
      badgeText="Super Admin Operations Hub"
      headerRight={
        <div
          onClick={scrollToBookings}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              scrollToBookings()
            }
          }}
          title="Click to view Today's Bookings"
          className="inline-flex items-center gap-3 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
            <CalendarCheck size={18} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Today's Bookings
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {todayCount !== null ? (
                <span>
                  {todayCount}{' '}
                  <span className="text-xs font-semibold text-slate-500">
                    {todayCount === 1 ? 'Booking' : 'Bookings'}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Loading...</span>
              )}
            </span>
          </div>
        </div>
      }
    >
      <TodayBookings onCountChange={setTodayCount} />
    </AdminDashboard>
  )
}