// src/pages/staff-management/StaffList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Edit2,
  RotateCw,
  ShieldCheck,
} from 'lucide-react'
import { userService } from '@/services/userService'
import { useToast } from '@/components/shared/toast/ToastProvider'
import { getImageUrl } from '@/utils/imageUrl'
import StaffModal from './StaffModal'

export default function StaffList() {
  const navigate = useNavigate()
  const toast = useToast()

  const [staffList, setStaffList] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [staffData, statsData] = await Promise.all([
        userService.getAllStaff(),
        userService.getStaffStats(),
      ])
      setStaffList(staffData || [])
      setStats(statsData || null)
    } catch (err) {
      console.error('Failed to load staff list:', err)
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch staff members.',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter staff list by search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList
    const q = searchQuery.toLowerCase().trim()
    return staffList.filter((s) => {
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.mobile && s.mobile.includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
      )
    })
  }, [staffList, searchQuery])

  // Handle Add/Edit submit
  const handleModalSubmit = async (formData) => {
    setSubmitting(true)
    setServerError('')
    try {
      if (editingStaff) {
        await userService.update(editingStaff.id, formData)
        toast({
          type: 'success',
          title: 'Success',
          message: `Staff member "${formData.name}" updated successfully.`,
        })
      } else {
        await userService.create(formData)
        toast({
          type: 'success',
          title: 'Success',
          message: `Staff member "${formData.name}" created successfully.`,
        })
      }
      setIsModalOpen(false)
      setEditingStaff(null)
      setServerError('')
      fetchData()
    } catch (err) {
      console.error('Error saving staff:', err)
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to save staff record.'
      setServerError(errorMsg)
      toast({
        type: 'error',
        title: 'Save Failed',
        message: errorMsg,
      })
    } finally {
      setSubmitting(false)
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

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--color-bg)' }}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="border-b bg-white border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                  <ShieldCheck size={13} />
                  Super Admin Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Users className="text-blue-600" size={26} />
                Staff Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage staff accounts and view their assigned and completed orders.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchData}
                disabled={loading}
                title="Refresh list"
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <RotateCw size={17} className={loading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => {
                  setEditingStaff(null)
                  setServerError('')
                  setIsModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-98 transition-all shadow-xs"
              >
                <UserPlus size={18} />
                Add Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Top Bar: Total Staff Counter & Search ────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Total Staff Counter Card */}
          <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-2xs flex items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Staff
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-900">
                  {stats?.totalStaffCount ?? staffList.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">members</span>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by staff name, mobile or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Staff List Table ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Sr. No.</th>
                  <th className="py-3.5 px-6">Staff Name</th>
                  <th className="py-3.5 px-6">Mobile Number</th>
                  <th className="py-3.5 px-6">Staff Address</th>
                  <th className="py-3.5 px-6 text-center">Total Assigned</th>
                  <th className="py-3.5 px-6 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RotateCw size={24} className="animate-spin text-blue-600" />
                        <span className="text-sm font-medium">Loading staff members...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <Users size={24} />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">No staff members found</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {searchQuery
                            ? 'No staff match your search query.'
                            : 'Click "Add Staff" above to create your first staff member.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff, idx) => {
                    const assigned = staff.assignedOrdersCount || 0

                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* Sr. No. */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Staff Name with Profile Avatar */}
                        <td className="py-3.5 px-6">
                          <div
                            onClick={() => navigate(`/super-admin/staff/${staff.id}`)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs">
                              {staff.profilePic ? (
                                <img
                                  src={getImageUrl(staff.profilePic)}
                                  alt={staff.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.parentElement.innerText = getInitials(staff.name)
                                  }}
                                />
                              ) : (
                                getInitials(staff.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block truncate">
                                {staff.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Mobile Number */}
                        <td className="py-3.5 px-6 font-medium text-slate-700 whitespace-nowrap">
                          {staff.mobile ? `+91 ${staff.mobile}` : '-'}
                        </td>

                        {/* Staff Address */}
                        <td className="py-3.5 px-6 text-slate-600 max-w-xs">
                          {staff.address ? (
                            <span className="line-clamp-2" title={staff.address}>
                              {staff.address}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Total Assigned */}
                        <td className="py-3.5 px-6 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            {assigned}
                          </span>
                        </td>

                        {/* Actions (Eye Icon -> View Details, Edit Icon) */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Eye icon → View Details */}
                            <button
                              onClick={() => navigate(`/super-admin/staff/${staff.id}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <Eye size={17} />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingStaff(staff)
                                setServerError('')
                                setIsModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Edit Staff Member"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Staff Add / Edit Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStaff(null)
          setServerError('')
        }}
        onSubmit={handleModalSubmit}
        editStaff={editingStaff}
        loading={submitting}
        serverError={serverError}
        onClearServerError={() => setServerError('')}
      />
    </div>
  )
}
