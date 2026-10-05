import React, { useState, useEffect, useRef } from 'react'
import { X, UserPlus, UserCheck, Eye, EyeOff, Loader2, AlertCircle, Camera, Upload, Trash2, MapPin } from 'lucide-react'
import { Button, Input } from '@/components/shared'
import { userService } from '@/services/userService'
import { getImageUrl } from '@/utils/imageUrl'

const EMPTY_FORM = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  address: '',
  profilePic: null,
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

  // Photo upload states
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      if (editStaff) {
        setForm({
          name: editStaff.name || '',
          email: editStaff.email || '',
          mobile: editStaff.mobile || '',
          password: '',
          address: editStaff.address || '',
          profilePic: editStaff.profilePic || null,
          isActive: editStaff.isActive !== false,
        })
        setPhotoFile(null)
        setPhotoPreview(editStaff.profilePic ? getImageUrl(editStaff.profilePic) : null)
      } else {
        setForm(EMPTY_FORM)
        setPhotoFile(null)
        setPhotoPreview(null)
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

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select a valid image file (JPG, PNG, WebP).' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image size must be less than 5MB.' }))
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrors((prev) => ({ ...prev, photo: '' }))
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    set('profilePic', null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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

    // Address (optional)
    if (form.address && form.address.length > 500) {
      e.address = 'Address cannot exceed 500 characters'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const eMap = validate()
    if (Object.keys(eMap).length > 0) {
      setErrors(eMap)
      return
    }

    let finalProfilePic = form.profilePic

    // If new photo selected, upload it first
    if (photoFile) {
      try {
        setIsUploadingPhoto(true)
        const uploadRes = await userService.uploadProfilePic(photoFile)
        finalProfilePic = uploadRes?.path || null
      } catch (uploadErr) {
        setIsUploadingPhoto(false)
        setErrors((prev) => ({
          ...prev,
          photo: uploadErr.response?.data?.message || 'Failed to upload profile picture.',
        }))
        return
      } finally {
        setIsUploadingPhoto(false)
      }
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      mobile: form.mobile.trim(),
      address: form.address.trim() || null,
      profilePic: finalProfilePic || null,
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
        className="w-full max-w-md max-h-[92vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
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
            disabled={loading || isUploadingPhoto}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" autoComplete="off">
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

          {/* Profile Picture Upload Section (Optional) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera size={14} className="text-blue-600" />
                Profile Picture <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={loading || isUploadingPhoto}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 shadow-2xs group">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Staff preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                    <Camera size={22} />
                  </div>
                )}
              </div>

              {/* Upload trigger buttons & hint */}
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || isUploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs active:scale-98"
                >
                  <Upload size={13} className="text-blue-600" />
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  JPG, PNG or WEBP (Max 5MB)
                </p>
              </div>
            </div>

            {errors.photo && (
              <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                <AlertCircle size={13} className="shrink-0" />
                {errors.photo}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Staff Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              autoComplete="off"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={loading || isUploadingPhoto}
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
                autoComplete="off"
                value={form.mobile}
                onChange={handleMobileChange}
                disabled={loading || isUploadingPhoto}
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
              autoComplete="off"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={loading || isUploadingPhoto}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                errors.email || (serverError && serverError.toLowerCase().includes('email'))
                  ? 'border-rose-400 text-rose-900 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
            {(errors.email || (serverError && serverError.toLowerCase().includes('email'))) && (
              <p className="text-rose-600 text-xs mt-1.5 font-semibold flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.email || serverError}</span>
              </p>
            )}
          </div>

          {/* Staff Address (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-600" />
                Staff Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {(form.address || '').length}/500
              </span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Enter residential or communication address..."
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              disabled={loading || isUploadingPhoto}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none placeholder:text-slate-400 ${
                errors.address
                  ? 'border-rose-400 text-rose-900 focus:border-rose-500'
                  : 'border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
            {errors.address && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.address}</p>
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
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                disabled={loading || isUploadingPhoto}
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
                {form.isActive ? 'Active - can log in and view orders' : 'Inactive - access blocked'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                disabled={loading || isUploadingPhoto}
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
              disabled={loading || isUploadingPhoto}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isUploadingPhoto}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading Photo...
                </>
              ) : loading ? (
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
