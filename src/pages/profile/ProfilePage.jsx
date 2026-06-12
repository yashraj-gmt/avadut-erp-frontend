// src/pages/profile/ProfilePage.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  User, Mail, Phone, Shield, Clock, Calendar,
  KeyRound, Eye, EyeOff, CheckCircle2, XCircle,
  AlertTriangle, Loader2, RefreshCw, X, LogOut,
  Pencil, Save, RotateCcw, Info,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { useToast } from '@/components/shared/toast/ToastProvider'
import ConfirmModal from '@/components/shared/modal/ConfirmModal'

// ─── Role config (CSS vars only) ─────────────────────────────────────────────
const ROLE_MAP = {
  SUPER_ADMIN: { label: 'Super Admin', bg: 'var(--color-primary-50)',  color: 'var(--color-primary)',    border: 'var(--color-primary-100)' },
  ADMIN:       { label: 'Admin',       bg: 'var(--color-info-light)',  color: 'var(--color-info)',       border: '#BFDBFE' },
  USER:        { label: 'User',        bg: 'var(--color-surface-2)',   color: 'var(--color-text-muted)', border: 'var(--color-border)' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDateTime = (dt) =>
  dt
    ? new Date(dt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

const fmtDate = (dt) =>
  dt
    ? new Date(dt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

const initials = (name) =>
  (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

// ─── Field validation ─────────────────────────────────────────────────────────
function validateProfileForm({ name, email, mobile }) {
  const errors = {}
  if (!name || name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters.'
  else if (name.trim().length > 100)
    errors.name = 'Name must be at most 100 characters.'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Enter a valid email address.'

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile))
    errors.mobile = 'Enter a valid 10-digit Indian mobile number.'

  return errors
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, last = false }) {
  return (
    <div
      className="flex items-start gap-3 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid var(--color-border)' }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'var(--color-primary-50)' }}
      >
        <Icon size={13} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-subtle)' }}>
          {label}
        </p>
        <p
          className="text-sm font-medium break-all"
          style={{ color: value ? 'var(--color-text)' : 'var(--color-text-subtle)' }}
        >
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

// ─── FormField ───────────────────────────────────────────────────────────────
function FormField({ label, id, icon: Icon, children, error, hint }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {Icon && <Icon size={11} />}
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
          <XCircle size={11} /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── TextInput ────────────────────────────────────────────────────────────────
function TextInput({ id, value, onChange, placeholder, hasError, type = 'text', disabled = false }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background:   'var(--color-surface-2)',
        border:       `1.5px solid ${hasError ? 'var(--color-danger)' : focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
        color:        'var(--color-text)',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// ─── PasswordInput ────────────────────────────────────────────────────────────
function PasswordInput({ label, id, value, onChange, placeholder }) {
  const [show, setShow]       = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all"
          style={{
            background: 'var(--color-surface-2)',
            border:     `1.5px solid ${focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
            color:      'var(--color-text)',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose, changePassword }) {
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [uiState, setUiState] = useState({ loading: false, success: false, error: null })
  const [validErr, setValidErr] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidErr('')
    setUiState((s) => ({ ...s, error: null }))

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setValidErr('All fields are required.')
      return
    }
    if (form.newPassword.length < 8) {
      setValidErr('New password must be at least 8 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setValidErr('Passwords do not match.')
      return
    }

    setUiState({ loading: true, success: false, error: null })
    try {
      await changePassword(form)
      setUiState({ loading: false, success: true, error: null })
    } catch (err) {
      const msg = err?.message ?? err?.data?.message ?? 'Failed to change password.'
      setUiState({ loading: false, success: false, error: msg })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && !uiState.loading && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-warning-light)' }}
            >
              <KeyRound size={17} style={{ color: 'var(--color-warning)' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                Change Password
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                All sessions will be signed out
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uiState.loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 disabled:opacity-40"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {uiState.success && (
            <div
              className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: 'var(--color-success-light)', border: '1px solid #A7F3D0' }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#065F46' }}>Password changed!</p>
                <p className="text-xs" style={{ color: '#047857' }}>Redirecting to login…</p>
              </div>
            </div>
          )}

          {uiState.error && (
            <div
              className="flex items-start gap-3 p-3.5 rounded-xl"
              style={{ background: 'var(--color-danger-light)', border: '1px solid #FECACA' }}
            >
              <XCircle size={17} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-danger)' }} />
              <p className="text-sm" style={{ color: '#991B1B' }}>{uiState.error}</p>
            </div>
          )}

          {validErr && !uiState.error && (
            <div
              className="flex items-start gap-3 p-3.5 rounded-xl"
              style={{ background: 'var(--color-warning-light)', border: '1px solid #FDE68A' }}
            >
              <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
              <p className="text-sm" style={{ color: '#92400E' }}>{validErr}</p>
            </div>
          )}

          {!uiState.success && (
            <>
              <PasswordInput label="Current Password" id="currentPassword"
                value={form.currentPassword} onChange={set('currentPassword')} placeholder="Enter current password" />
              <PasswordInput label="New Password" id="newPassword"
                value={form.newPassword} onChange={set('newPassword')} placeholder="Min 8 characters" />
              <PasswordInput label="Confirm Password" id="confirmPassword"
                value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat new password" />

              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--color-warning-light)' }}>
                <LogOut size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                <p className="text-xs" style={{ color: '#92400E' }}>
                  Changing your password will immediately sign you out from all devices.
                </p>
              </div>

              <button
                type="submit"
                disabled={uiState.loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-60"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
              >
                {uiState.loading
                  ? <><Loader2 size={15} className="animate-spin" /> Changing…</>
                  : <><KeyRound size={15} /> Update Password</>}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

// ─── Profile Skeleton ─────────────────────────────────────────────────────────
function ProfileSkeleton() {
  const P = ({ cls }) => (
    <div className={`rounded-lg animate-pulse ${cls}`} style={{ background: 'var(--color-border)' }} />
  )
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
      {/* Left skeleton */}
      <div className="space-y-5">
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-5">
            <P cls="w-20 h-20 rounded-2xl flex-shrink-0" />
            <div className="space-y-2.5 flex-1"><P cls="h-5 w-40" /><P cls="h-3 w-24" /><P cls="h-6 w-20" /></div>
          </div>
        </div>
        <div className="rounded-2xl px-6 py-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3.5"
              style={{ borderBottom: i < 5 ? '1px solid var(--color-border)' : 'none' }}>
              <P cls="w-7 h-7 rounded-lg" />
              <div className="space-y-2 flex-1"><P cls="h-2.5 w-16" /><P cls="h-4 w-40" /></div>
            </div>
          ))}
        </div>
      </div>
      {/* Right skeleton */}
      <div className="space-y-5">
        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <P cls="h-4 w-32" />
          {[1,2,3].map((i) => <div key={i} className="space-y-2"><P cls="h-3 w-20" /><P cls="h-10 w-full rounded-lg" /></div>)}
          <P cls="h-10 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <P cls="h-4 w-24 mb-4" />
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><P cls="w-9 h-9 rounded-xl" /><div className="space-y-2"><P cls="h-4 w-24" /><P cls="h-3 w-40" /></div></div><P cls="h-9 w-28 rounded-xl" /></div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, refreshProfile, changePassword } = useAuth()
  const setUser  = useAuthStore((s) => s.setUser)
  const logout   = useAuthStore((s) => s.logout)
  const toast    = useToast()

  // Page state
  const [loading,    setLoading]    = useState(!user)
  const [fetchError, setFetchError] = useState(null)
  const [showPwdModal, setShowPwdModal] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)

  // Confirm modal for mobile change
  const [showMobileConfirm, setShowMobileConfirm] = useState(false)
  const [pendingSubmit, setPendingSubmit]          = useState(false)

  // ── Stable refs ─────────────────────────────────────────────────────────────
  // Keep refreshProfile in a ref so loadProfile never needs it as a dep.
  const refreshProfileRef = useRef(refreshProfile)
  useEffect(() => { refreshProfileRef.current = refreshProfile }, [refreshProfile])

  // Guard: form is only pre-filled on the very first successful load.
  // Subsequent store updates (e.g. after save) must NOT reset what the user
  // may be editing.
  const formInitialized = useRef(false)

  // ── Load profile ─────────────────────────────────────────────────────────────
  // useCallback has NO deps — loadProfile is a stable function for the lifetime
  // of the component. It reads refreshProfile through the ref above.
  const loadProfile = useCallback(async ({ resetForm = false } = {}) => {
    setLoading(true)
    setFetchError(null)
    const result = await refreshProfileRef.current()
    if (!result) {
      setFetchError('Could not load profile. Please try again.')
    } else if (resetForm) {
      // Manual refresh: allow the form to re-sync with latest server data.
      formInitialized.current = false
    }
    setLoading(false)
  }, []) // ← intentionally empty: stable across renders

  // Run exactly once on mount.
  useEffect(() => {
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill the edit form the FIRST time user data arrives.
  // After that, form state is owned by the component; we never overwrite it
  // automatically (that's what causes the flickering reset while editing).
  useEffect(() => {
    if (user && !formInitialized.current) {
      setEditForm({ name: user.name ?? '', email: user.email ?? '', mobile: user.mobile ?? '' })
      setDirty(false)
      formInitialized.current = true
    }
  }, [user])

  // ── Edit form handlers ──────────────────────────────────────────────────────
  const setField = (key) => (e) => {
    setEditForm((f) => ({ ...f, [key]: e.target.value }))
    setFormErrors((fe) => ({ ...fe, [key]: undefined }))
    setDirty(true)
  }

  const handleReset = () => {
    if (!user) return
    setEditForm({ name: user.name ?? '', email: user.email ?? '', mobile: user.mobile ?? '' })
    setFormErrors({})
    setDirty(false)
  }

  // Called after confirm (or directly if no mobile change)
  const doSave = async () => {
    setSaving(true)
    setShowMobileConfirm(false)
    try {
      const result = await authService.updateProfile({
        name:   editForm.name.trim(),
        email:  editForm.email.trim(),
        mobile: editForm.mobile.trim(),
      })

      if (result.mobileChanged) {
        // Server revoked all tokens — must re-login
        toast({
          type:    'warning',
          title:   'Mobile number changed',
          message: 'Your sessions have been cleared. Please log in with your new number.',
          duration: 4000,
        })
        // Short delay so user sees the toast, then logout + redirect
        setTimeout(() => {
          logout()
          // The app's router will redirect to /login automatically once auth clears
        }, 1800)
      } else {
        setUser(result.user)
        // Sync the form to the freshly-saved values and mark clean.
        // Done explicitly here so the user-effect (which only runs on first
        // load) never fires again and doesn't reset an in-progress edit.
        setEditForm({
          name:   result.user.name   ?? '',
          email:  result.user.email  ?? '',
          mobile: result.user.mobile ?? '',
        })
        setDirty(false)
        toast({ type: 'success', title: 'Profile updated', message: 'Your information has been saved.' })
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to update profile.'
      toast({ type: 'error', title: 'Update failed', message: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    const errors = validateProfileForm(editForm)
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    const mobileChanged = editForm.mobile.trim() !== (user?.mobile ?? '')
    if (mobileChanged) {
      setShowMobileConfirm(true) // Show warning confirm modal first
    } else {
      doSave()
    }
  }

  const role     = ROLE_MAP[user?.role] ?? ROLE_MAP.USER
  const isActive = user?.isActive ?? false

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'var(--color-bg)' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            My Profile
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            View and manage your account details
          </p>
        </div>
        <button
          onClick={() => loadProfile({ resetForm: true })}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-50"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Fetch error banner ──────────────────────────────────────────── */}
      {fetchError && !loading && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-5 max-w-5xl"
          style={{ background: 'var(--color-danger-light)', border: '1px solid #FECACA' }}
        >
          <XCircle size={18} style={{ color: 'var(--color-danger)' }} />
          <p className="text-sm flex-1" style={{ color: '#991B1B' }}>{fetchError}</p>
          <button onClick={() => loadProfile({ resetForm: true })} className="text-xs font-medium underline" style={{ color: 'var(--color-danger)' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Skeleton ───────────────────────────────────────────────────── */}
      {loading && <ProfileSkeleton />}

      {/* ── Main content (2-col grid) ──────────────────────────────────── */}
      {!loading && user && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">

          {/* ══════════════ LEFT COLUMN ══════════════ */}
          <div className="space-y-5">

            {/* Hero card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
            >
              <div className="h-1.5" style={{ background: 'var(--color-primary)' }} />
              <div className="p-5 flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold select-none"
                    style={{
                      background:  'var(--color-primary-100)',
                      color:       'var(--color-primary)',
                      border:      '3px solid var(--color-primary-50)',
                    }}
                  >
                    {initials(user.name)}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      background:  isActive ? 'var(--color-success)' : 'var(--color-text-subtle)',
                      borderColor: 'var(--color-surface)',
                    }}
                    title={isActive ? 'Active' : 'Inactive'}
                  />
                </div>

                {/* Name / badges / action */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {user.name}
                  </h2>
                  <p className="text-sm mb-2.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {user.email}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}
                    >
                      <Shield size={10} /> {role.label}
                    </span>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: isActive ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                        color:      isActive ? 'var(--color-success)'       : 'var(--color-danger)',
                      }}
                    >
                      {isActive ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account details (read-only) */}
            <div
              className="rounded-2xl px-5 py-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest pt-4 pb-1" style={{ color: 'var(--color-text-subtle)' }}>
                Account Details
              </p>
              <InfoRow icon={User}     label="Full Name"    value={user.name} />
              <InfoRow icon={Mail}     label="Email"        value={user.email} />
              <InfoRow icon={Phone}    label="Mobile"       value={user.mobile} />
              <InfoRow icon={Shield}   label="Role"         value={role.label} />
              <InfoRow icon={Clock}    label="Last Login"   value={fmtDateTime(user.lastLogin)} />
              <InfoRow icon={Calendar} label="Member Since" value={fmtDate(user.createdAt)} last />
            </div>
          </div>

          {/* ══════════════ RIGHT COLUMN ══════════════ */}
          <div className="space-y-5">

            {/* ── Edit Profile card ── */}
            <div
              className="rounded-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--color-primary-50)' }}
                  >
                    <Pencil size={14} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      Edit Profile
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                      Update your personal information
                    </p>
                  </div>
                </div>
                {dirty && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--color-warning-light)', color: '#92400E' }}
                  >
                    Unsaved
                  </span>
                )}
              </div>

              {/* Form body */}
              <div className="p-5 space-y-4">

                {/* Name */}
                <FormField
                  label="Full Name" id="edit-name" icon={User}
                  error={formErrors.name}
                >
                  <TextInput
                    id="edit-name"
                    value={editForm.name}
                    onChange={setField('name')}
                    placeholder="Enter your full name"
                    hasError={!!formErrors.name}
                    disabled={saving}
                  />
                </FormField>

                {/* Email */}
                <FormField
                  label="Email Address" id="edit-email" icon={Mail}
                  error={formErrors.email}
                >
                  <TextInput
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={setField('email')}
                    placeholder="Enter email address"
                    hasError={!!formErrors.email}
                    disabled={saving}
                  />
                </FormField>

                {/* Mobile */}
                <FormField
                  label="Mobile Number" id="edit-mobile" icon={Phone}
                  error={formErrors.mobile}
                  hint="10-digit Indian mobile number (e.g. 9876543210)"
                >
                  <TextInput
                    id="edit-mobile"
                    type="tel"
                    value={editForm.mobile}
                    onChange={setField('mobile')}
                    placeholder="e.g. 9876543210"
                    hasError={!!formErrors.mobile}
                    disabled={saving}
                  />
                </FormField>

                {/* Mobile change warning banner (shown only when mobile is different) */}
                {editForm.mobile.trim() !== (user?.mobile ?? '') && editForm.mobile.trim() !== '' && (
                  <div
                    className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: 'var(--color-warning-light)', border: '1px solid #FDE68A' }}
                  >
                    <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#92400E' }}>
                        Mobile number change detected
                      </p>
                      <p className="text-xs" style={{ color: '#92400E' }}>
                        Changing your mobile number will <strong>sign you out from all devices</strong>.
                        You will need to log in again using the new number.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!dirty || saving}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                    style={{
                      background: 'var(--color-surface-2)',
                      color:      'var(--color-text-muted)',
                      border:     '1px solid var(--color-border)',
                    }}
                  >
                    <RotateCcw size={13} /> Reset
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-50"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
                  >
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <><Save size={14} /> Save Changes</>}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Security card ── */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>
                Security
              </p>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--color-warning-light)' }}
                  >
                    <KeyRound size={16} style={{ color: 'var(--color-warning)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      Password
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                      Update regularly to keep your account safe
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPwdModal(true)}
                  className="text-sm font-medium px-4 py-2 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'var(--color-warning-light)', color: '#92400E', border: '1px solid #FDE68A' }}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ───────────────────────────────────────── */}
      {showPwdModal && (
        <ChangePasswordModal
          onClose={() => setShowPwdModal(false)}
          changePassword={changePassword}
        />
      )}

      {/* ── Mobile Change Confirm Modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={showMobileConfirm}
        onClose={() => setShowMobileConfirm(false)}
        onConfirm={doSave}
        title="Change Mobile Number?"
        variant="warning"
        confirmLabel="Yes, Update & Sign Out"
        cancelLabel="Cancel"
        loading={pendingSubmit}
      >
        <div className="space-y-2.5">
          <div
            className="rounded-xl p-3.5 space-y-1.5"
            style={{ background: 'var(--color-warning-light)', border: '1px solid #FDE68A' }}
          >
            <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
              What will happen next:
            </p>
            <ul className="text-xs space-y-1.5" style={{ color: '#92400E' }}>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">1.</span>
                Your mobile number will be updated to <strong>{editForm.mobile}</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">2.</span>
                All active sessions on every device will be <strong>immediately signed out</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">3.</span>
                You will be redirected to the login page and must sign in with your <strong>new mobile number</strong>.
              </li>
            </ul>
          </div>
        </div>
      </ConfirmModal>
    </div>
  )
} 