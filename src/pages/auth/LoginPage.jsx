// src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService }  from '@/services/authService'
import { useToast }     from '@/components/shared/toast/ToastProvider'
import { ROLE_DEFAULT_ROUTE } from '@/constants/roles'
import { ENV } from '@/config/env'

/** Validate Indian mobile number: starts with 6–9, exactly 10 digits */
const isValidMobile = (value) => /^[6-9]\d{9}$/.test(value)

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">

        {/* Card */}
        <div
          className="rounded-2xl shadow-lg p-8"
          style={{
            background:   'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            boxShadow:    'var(--shadow-lg)',
          }}
        >

          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--color-primary)' }}
            >
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {ENV.APP_NAME}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Sign in to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Mobile */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Mobile Number
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm select-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Phone size={14} />
                  <span>+91</span>
                  <span className="w-px h-4 inline-block"
                    style={{ background: 'var(--color-border)' }} />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  placeholder="9876543210"
                  value={form.mobile}
                  onChange={handleMobileChange}
                  className={`${inputBase} pl-24`}
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
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, password: e.target.value }))
                    if (errors.password) setErrors((er) => ({ ...er, password: undefined }))
                  }}
                  className={`${inputBase} pr-10`}
                  style={inputStyle(!!errors.password && errors.password.trim())}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-text-subtle)' }}
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
                         transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ background: 'var(--color-primary)' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>
        </div>

        {/* Version badge */}
        <p className="text-center text-xs mt-4" style={{ color: 'var(--color-text-subtle)' }}>
          {ENV.APP_NAME} · v{ENV.APP_VERSION}
        </p>

      </div>
    </div>
  )
}