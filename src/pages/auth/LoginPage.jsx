// src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Phone, Lock, Package, Users, Clock, Truck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService }  from '@/services/authService'
import { useToast }     from '@/components/shared/toast/ToastProvider'
import { ROLE_DEFAULT_ROUTE } from '@/constants/roles'
import { ENV } from '@/config/env'

/** Validate Indian mobile number: starts with 6–9, exactly 10 digits */
const isValidMobile = (value) => /^[6-9]\d{9}$/.test(value)

/** What this console manages — shown on the ops panel (desktop only) */
const CAPABILITIES = [
  { icon: Package, label: 'Stock & Equipment',  detail: 'Generators, lighting & décor inventory' },
  { icon: Users,   label: 'Customer Accounts',  detail: 'Bookings, billing & rental history' },
  { icon: Clock,   label: 'Staff Attendance',   detail: 'Shift logs & on-site check-ins' },
  { icon: Truck,   label: 'Site Deployments',   detail: 'Track what\u2019s out and where' },
]

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuthStore()
  const toast     = useToast()

  const [form, setForm]       = useState({ mobile: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Client-side validation ─────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.mobile)
      e.mobile = 'Mobile number is required.'
    else if (!isValidMobile(form.mobile))
      e.mobile = 'Enter a valid 10-digit Indian mobile number.'
    if (!form.password)
      e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // authService.login returns AuthResponse (ApiResponse envelope already unwrapped)
      const authData = await authService.login({
        mobile:   form.mobile.trim(),
        password: form.password,
      })

      // Persist tokens + user to Zustand + localStorage
      login(authData)

      const from = location.state?.from?.pathname
                ?? ROLE_DEFAULT_ROUTE[authData.user.role]
                ?? '/dashboard'

      navigate(from, { replace: true })

      toast({
        type:    'success',
        title:   `Welcome, ${authData.user.name}!`,
        message: `Logged in as ${authData.user.role.replace('_', ' ')}`,
      })

    } catch (err) {
      // Backend sends error as ApiResponse or plain error object
      const message =
        err?.message ??
        err?.data?.message ??
        'Invalid credentials. Please try again.'

      toast({ type: 'error', title: 'Login Failed', message })

      // Highlight the password field on auth failure
      setErrors({ password: ' ' })   // space = show red border, no text
    } finally {
      setLoading(false)
    }
  }

  // ── Mobile input handler — digits only ────────────────────────────────
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm((f) => ({ ...f, mobile: value }))
    if (errors.mobile) setErrors((er) => ({ ...er, mobile: undefined }))
  }

  // ── Styles ────────────────────────────────────────────────────────────
  const inputBase =
    'w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-150 focus:ring-2'

  const inputStyle = (hasError) => ({
    border:     `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
    background: 'var(--color-bg)',
    color:      'var(--color-text)',
    '--tw-ring-color': 'var(--color-primary)',
  })

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2" style={{ background: 'var(--color-bg)' }}>

      {/* ════════════════════════════════════════════════════════════════
          OPS PANEL — visible from lg breakpoint up only
      ════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:flex-col lg:justify-between relative overflow-hidden p-12"
        style={{ background: 'var(--color-sidebar-bg)' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo + headline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img
              src="/images/avadhut-logo-login.png"
              alt="Avadhut"
              className="w-16 h-16  rounded-xl object-contain shrink-0"
            />
            <div>
              <p className="text-white font-semibold text-base leading-tight">AVADHUT</p>
              <p className="text-xl leading-tight" style={{ color: 'var(--color-sidebar-text)' }}>
                Lights &amp; decoration
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white leading-snug max-w-md">
            One console for every generator, light, and event on the books.
          </h1>
          <p className="mt-4 text-sm leading-relaxed max-w-sm" style={{ color: 'var(--color-sidebar-text)' }}>
            Track stock, manage customer accounts, and keep staff attendance straight — all from a single sign-in.
          </p>
        </div>

        {/* Capability list — the signature element */}
        <div className="relative z-10 space-y-4 mt-12">
          {CAPABILITIES.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Icon size={15} style={{ color: 'var(--color-sidebar-text)' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs" style={{ color: 'var(--color-sidebar-text)' }}>{detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* System status readout */}
        <div className="relative z-10 flex items-center gap-2 mt-12">
          <span className="relative flex h-2 w-2">
            <span
              className="motion-safe:animate-pulse absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: 'var(--color-success)' }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--color-success)' }} />
          </span>
          <span
            className="font-mono text-[11px] tracking-wider uppercase"
            style={{ color: 'var(--color-sidebar-text)' }}
          >
            System status: operational
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SIGN-IN PANEL — full width on mobile/tablet, right column on lg+
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Compact brand header — hidden once the ops panel takes over */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img
              src="/images/avadhut-logo-login.png"
              alt="Avadhut"
              className="w-11 h-11 rounded-xl object-contain shrink-0"
            />
            <div>
              <p className="font-semibold text-base leading-tight" style={{ color: 'var(--color-text)' }}>
                AVADHUT
              </p>
              <p className="text-xs leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                Lights &amp; decoration
              </p>
            </div>
          </div>

          <p
            className="font-mono text-[11px] tracking-wider uppercase mb-2"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            Admin &amp; super admin console
          </p>
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>
            Sign in
          </h2>
          <p className="text-sm mb-7" style={{ color: 'var(--color-text-muted)' }}>
            Enter your registered mobile number and password.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Mobile number
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm select-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Phone size={14} />
                  <span className="w-px h-4 inline-block" style={{ background: 'var(--color-border)' }} />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  placeholder="9876543210"
                  value={form.mobile}
                  onChange={handleMobileChange}
                  className={`${inputBase} pl-10`}
                  style={inputStyle(!!errors.mobile)}
                />
              </div>
              {errors.mobile && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>
                  {errors.mobile}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  <Lock size={14} />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, password: e.target.value }))
                    if (errors.password) setErrors((er) => ({ ...er, password: undefined }))
                  }}
                  className={`${inputBase} pl-10 pr-10`}
                  style={inputStyle(!!errors.password && errors.password.trim())}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus:outline-none"
                  style={{ color: 'var(--color-text-subtle)' }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && errors.password.trim() && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                         flex items-center justify-center gap-2
                         transition-opacity hover:opacity-90 disabled:opacity-60 mt-2
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: 'var(--color-primary)', '--tw-ring-color': 'var(--color-primary)' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

          {/* Version badge */}
          <p className="text-center text-xs mt-8" style={{ color: 'var(--color-text-subtle)' }}>
            AVADHUT
          </p>

        </div>
      </div>
    </div>
  )
}