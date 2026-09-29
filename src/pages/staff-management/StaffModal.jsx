import React, { useState, useEffect } from 'react'
import { X, UserPlus, UserCheck, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/components/shared'

const EMPTY_FORM = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  isActive: true,
}

export default function StaffModal({
  isOpen,
  onClose,
  onSubmit,
  editStaff,
  loading,
  serverError,
  onClearServerError,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editStaff) {
        setForm({
          name: editStaff.name || '',
          email: editStaff.email || '',
          mobile: editStaff.mobile || '',
          password: '',
          isActive: editStaff.isActive !== false,
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
      setShowPassword(false)
      if (onClearServerError) onClearServerError()
    }
  }, [isOpen, editStaff])

  if (!isOpen) return null

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
    if (onClearServerError) onClearServerError()
  }

  const handleMobileChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    set('mobile', digits)
    if (onClearServerError) onClearServerError()
  }

  const validate = () => {
    const e = {}

    // Name
    const name = (form.name || '').trim()
    if (!name) {
      e.name = 'Staff name is required'
    } else if (name.length < 2) {
      e.name = 'Name must be at least 2 characters'
    }

    // Mobile
    const mobile = (form.mobile || '').trim()
    if (!mobile) {
      e.mobile = 'Mobile number is required'
    } else if (!/^\d{10}$/.test(mobile)) {
      e.mobile = 'Enter a valid 10-digit mobile number'
    }

    // Email (optional)
    const email = (form.email || '').trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address'
    }

    // Password
    const pwd = form.password || ''
    if (!editStaff) {
      if (!pwd.trim()) {
        e.password = 'Password is required'
      } else if (pwd.length < 6) {
        e.password = 'Password must be at least 6 characters'
      }
    } else if (pwd.length > 0 && pwd.length < 6) {
      e.password = 'Password must be at least 6 characters'
    }

    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const eMap = validate()
    if (Object.keys(eMap).length > 0) {
      setErrors(eMap)
      return
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      mobile: form.mobile.trim(),
      role: 'STAFF',
      isActive: form.isActive,
    }

    if (form.password && form.password.trim()) {
      payload.password = form.password
    }

    onSubmit(payload)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              {editStaff ? <UserCheck size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <p className="text-xs text-slate-500">
                {editStaff
                  ? 'Update staff account profile and status'
                  : 'Create a new staff login for order management'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Server-side Error Alert */}
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">{serverError}</div>
              {onClearServerError && (
                <button
                  type="button"
                  onClick={onClearServerError}
                  className="text-rose-400 hover:text-rose-700 p-0.5"
                  title="Dismiss error"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Staff Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={loading}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.name
                  ? 'border-rose-400 text-rose-900 focus:border-rose-500'
                  : 'border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                +91
              </span>
              <input
                type="text"
                maxLength={10}
                placeholder="10-digit number"
                value={form.mobile}
                onChange={handleMobileChange}
                disabled={loading}
                className={`w-full pl-12 pr-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.mobile || (serverError && serverError.toLowerCase().includes('mobile'))
                    ? 'border-rose-400 text-rose-900 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
            {(errors.mobile || (serverError && serverError.toLowerCase().includes('mobile'))) && (
              <p className="text-xs text-rose-600 mt-1.5 font-semibold flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.mobile || serverError}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="email"
              placeholder="e.g. staff@company.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={loading}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.email || (serverError && serverError.toLowerCase().includes('email'))
                  ? 'border-rose-400 text-rose-900 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
            {(errors.email || (serverError && serverError.toLowerCase().includes('email'))) && (
              <p className="text-xs text-rose-600 mt-1.5 font-semibold flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.email || serverError}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              {editStaff ? (
                <>
                  New Password{' '}
                  <span className="text-slate-400 font-normal lowercase">
                    (leave blank to keep current)
                  </span>
                </>
              ) : (
                <>
                  Password <span className="text-rose-500">*</span>
                </>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={editStaff ? 'Enter new password only if changing' : 'Min. 6 characters'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                disabled={loading}
                className={`w-full pr-10 px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.password
                    ? 'border-rose-400 text-rose-900 focus:border-rose-500'
                    : 'border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password}</p>
            )}
          </div>

          {/* Account Status Switch */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Account Status</p>
              <p className="text-xs text-slate-500">
                {form.isActive ? 'Active — can log in and view orders' : 'Inactive — access blocked'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : editStaff ? (
                'Save Changes'
              ) : (
                'Add Staff'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
