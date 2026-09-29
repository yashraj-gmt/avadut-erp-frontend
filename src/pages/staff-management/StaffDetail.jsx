// src/pages/staff-management/StaffDetail.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Search,
  ExternalLink,
  Eye,
  Phone,
  Mail,
  MapPin,
  RotateCw,
  Edit2,
  Power,
  Shield,
  FileText,
  AlertCircle,
  Calendar,
  X
} from 'lucide-react'
import { userService } from '@/services/userService'
import { useToast } from '@/components/shared/toast/ToastProvider'
import StaffModal from './StaffModal'

export default function StaffDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [staff, setStaff] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [serverError, setServerError] = useState('')

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [staffData, ordersData] = await Promise.all([
        userService.getStaffById(id),
        userService.getStaffOrders(id),
      ])
      setStaff(staffData)
      setOrders(ordersData || [])
    } catch (err) {
      console.error('Failed to load staff details:', err)
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load staff details.',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Summary count
  const totalAssigned = orders.length

  // Filtered orders based on selected date & search query
  const filteredOrders = useMemo(() => {
    let result = orders

    // Filter by selected date
    if (selectedDate) {
      result = result.filter((o) => {
        // 1. Function Date range (functionDateFrom to functionDateTo)
        if (o.functionDateFrom) {
          const from = String(o.functionDateFrom).substring(0, 10)
          const to = o.functionDateTo ? String(o.functionDateTo).substring(0, 10) : from
          if (selectedDate >= from && selectedDate <= to) {
            return true
          }
        }
        // 2. Delivery Date
        if (o.deliveryDate) {
          const delDate = String(o.deliveryDate).substring(0, 10)
          if (delDate === selectedDate) {
            return true
          }
        }
        // 3. Fallback: orderDate / createdAt
        if (o.orderDate) {
          const oDate = String(o.orderDate).substring(0, 10)
          if (oDate === selectedDate) {
            return true
          }
        }
        if (o.createdAt) {
          const cDate = String(o.createdAt).substring(0, 10)
          if (cDate === selectedDate) {
            return true
          }
        }
        return false
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((o) => {
        return (
          (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
          (o.billNumber && o.billNumber.toLowerCase().includes(query)) ||
          (o.customerName && o.customerName.toLowerCase().includes(query)) ||
          (o.customerMobile && o.customerMobile.includes(query)) ||
          (o.siteAddress && o.siteAddress.toLowerCase().includes(query)) ||
          (o.dieselType && o.dieselType.toLowerCase().includes(query)) ||
          (o.cableType && o.cableType.toLowerCase().includes(query))
        )
      })
    }

    return result
  }, [orders, selectedDate, searchQuery])

  // Edit submit
  const handleModalSubmit = async (formData) => {
    setSubmitting(true)
    setServerError('')
    try {
      await userService.update(staff.id, formData)
      toast({
        type: 'success',
        title: 'Success',
        message: 'Staff profile updated successfully.',
      })
      setIsModalOpen(false)
      setServerError('')
      fetchData()
    } catch (err) {
      console.error('Failed to update staff:', err)
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Could not update staff profile.'
      setServerError(errorMsg)
      toast({
        type: 'error',
        title: 'Update Failed',
        message: errorMsg,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle active
  const handleToggleActive = async () => {
    if (!staff) return
    setTogglingActive(true)
    try {
      await userService.toggleActive(staff.id)
      toast({
        title: 'Status Updated',
        description: `Staff account is now ${staff.isActive ? 'Inactive' : 'Active'}.`,
        variant: 'info',
      })
      fetchData()
    } catch (err) {
      console.error('Failed to toggle status:', err)
      toast({
        title: 'Action Failed',
        description: err.response?.data?.message || 'Could not toggle active status.',
        variant: 'error',
      })
    } finally {
      setTogglingActive(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'S'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            In Progress
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Confirmed
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  if (loading && !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RotateCw size={32} className="animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Loading staff details...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center shadow-sm">
          <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Staff Member Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            The requested staff record does not exist or may have been deleted.
          </p>
          <button
            onClick={() => navigate('/super-admin/staff')}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Staff Management
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--color-bg)' }}>
      {/* ── Top Bar with Back Button ──────────────────────────────────────── */}
      <div className="border-b bg-white border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={() => navigate('/super-admin/staff')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Staff Management
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                setServerError('')
                setIsModalOpen(true)
              }}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Edit2 size={13} />
              <span>Edit</span>
              <span className="hidden sm:inline"> Profile</span>
            </button>
            <button
              onClick={handleToggleActive}
              disabled={togglingActive}
              className={`inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                staff.isActive
                  ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Power size={13} />
              <span>{staff.isActive ? 'Deactivate' : 'Activate'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ── Staff User Details Card with Counters ────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white font-black text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-xs">
                {getInitials(staff.name)}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight break-words">
                    {staff.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    <Shield size={11} />
                    Staff Member
                  </span>
                  {staff.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Contact pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
                  <a
                    href={`tel:${staff.mobile}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                  >
                    <Phone size={13} className="text-blue-600 shrink-0" />
                    <span>+91 {staff.mobile}</span>
                  </a>

                  {staff.email && (
                    <a
                      href={`mailto:${staff.email}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors max-w-full overflow-hidden"
                      title={staff.email}
                    >
                      <Mail size={13} className="text-indigo-600 shrink-0" />
                      <span className="truncate max-w-[180px] sm:max-w-none">{staff.email}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Counter provided in Staff User Details section (Total Assigned) */}
            <div className="w-full sm:w-auto pt-3.5 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:border-slate-200 sm:pl-8 flex items-center justify-between sm:justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 sm:hidden">
                Total Assigned
              </span>
              <div className="text-right sm:text-center min-w-[80px]">
                <span className="block text-2xl sm:text-3xl font-black text-indigo-600 leading-none">
                  {totalAssigned}
                </span>
                <span className="hidden sm:block text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                  Total Assigned
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Staff Orders Table Section ───────────────────────────────────── */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Staff Orders
              </h2>
              <p className="text-xs text-slate-500">
                All orders currently assigned to or completed by {staff.name}.
              </p>
            </div>

            {/* Filter controls: Date picker + Today shortcut + Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Calendar Date Filter */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 sm:flex-initial">
                  <Calendar
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs font-medium cursor-pointer"
                    title="Select date to filter assigned orders"
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                      title="Clear date filter"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(selectedDate === todayStr ? '' : todayStr)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors shrink-0 ${
                    selectedDate === todayStr
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                  title="Filter today's assigned orders"
                >
                  Today
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-56 lg:w-64">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(selectedDate || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Active filters:</span>
              {selectedDate && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  <Calendar size={12} className="text-blue-600" />
                  Date: {formatDate(selectedDate)}
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="ml-0.5 hover:text-blue-900 font-bold"
                    title="Remove date filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  Search: "{searchQuery}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ml-0.5 hover:text-slate-900 font-bold"
                    title="Remove search query"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('')
                  setSearchQuery('')
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline ml-1"
              >
                Reset all
              </button>
            </div>
          )}

          {/* Orders Table with exact requested columns:
              Sr. No. | Order No. | Customer Name | Function Date | Site Address | Diesel Type | Cable Type | Booking Status | Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Mobile swipe hint */}
            <div className="sm:hidden px-3.5 py-2 text-[11px] font-medium text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 select-none">
              <span>👉 Scroll table horizontally to view full order details</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[780px]">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center whitespace-nowrap">Sr. No.</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Order No.</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Customer Name</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Function Date</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Site Address</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Diesel Type</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Cable Type</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Booking Status</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RotateCw size={24} className="animate-spin text-blue-600" />
                          <span className="text-sm font-medium">Loading orders...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center">
                        <div className="max-w-xs mx-auto flex flex-col items-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <FileText size={24} />
                          </div>
                          <h4 className="text-base font-bold text-slate-800">No orders found</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedDate && searchQuery
                              ? `No orders match "${searchQuery}" on ${formatDate(selectedDate)}.`
                              : selectedDate
                              ? `No orders assigned for ${formatDate(selectedDate)}.`
                              : searchQuery
                              ? 'No orders match your search query.'
                              : 'This staff member does not have any assigned or completed orders yet.'}
                          </p>
                          {(selectedDate || searchQuery) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate('')
                                setSearchQuery('')
                              }}
                              className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* 1. Sr. No. */}
                        <td className="py-3.5 px-3.5 text-center font-medium text-slate-400 whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* 2. Order No. */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <Link
                            to={`/generators/orders/${order.id}`}
                            className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                          {order.billNumber && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Bill: {order.billNumber}
                            </div>
                          )}
                        </td>

                        {/* 3. Customer Name */}
                        <td className="py-3.5 px-3.5 font-bold text-slate-800 whitespace-nowrap">
                          {order.customerName || '—'}
                        </td>

                        {/* 4. Function Date */}
                        <td className="py-3.5 px-3.5 text-xs text-slate-700 whitespace-nowrap">
                          {order.functionDateFrom ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {formatDate(order.functionDateFrom)}
                              </div>
                              {order.functionDateTo && order.functionDateTo !== order.functionDateFrom && (
                                <div className="text-slate-400 text-[11px]">
                                  to {formatDate(order.functionDateTo)}
                                </div>
                              )}
                            </div>
                          ) : order.deliveryDate ? (
                            <div className="font-semibold text-slate-800">
                              {formatDate(order.deliveryDate)}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 5. Site Address */}
                        <td className="py-3.5 px-3.5 max-w-[240px]">
                          {order.siteAddress ? (
                            <div className="text-xs text-slate-700 flex items-start gap-1">
                              <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 break-words">{order.siteAddress}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No site address</span>
                          )}
                          {order.siteAddressLink && (
                            <a
                              href={order.siteAddressLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              Open Map <ExternalLink size={10} />
                            </a>
                          )}
                        </td>

                        {/* 6. Diesel Type */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            order.dieselType === 'With Diesel'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {order.dieselType || (order.withDiesel ? 'With Diesel' : 'Party Diesel')}
                          </span>
                        </td>

                        {/* 7. Cable Type */}
                        <td className="py-3.5 px-3.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                          {order.cableType || (order.cableRequired === false ? 'Not Required' : 'Required')}
                        </td>

                        {/* 8. Booking Status */}
                        <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                          {getOrderStatusBadge(order.orderStatus)}
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <Link
                            to={`/generators/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                            title="View Order Details"
                          >
                            <Eye size={13} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Edit Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setServerError('')
        }}
        onSubmit={handleModalSubmit}
        editStaff={staff}
        loading={submitting}
        serverError={serverError}
        onClearServerError={() => setServerError('')}
      />
    </div>
  )
}
