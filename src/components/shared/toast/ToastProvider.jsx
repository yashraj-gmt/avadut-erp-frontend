// src/components/shared/toast/ToastProvider.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

const ToastContext = createContext(null)

let toastId = 0

const ICONS = {
  success: <CheckCircle   size={18} className="text-green-500"  />,
  error:   <AlertCircle   size={18} className="text-red-500"    />,
  warning: <AlertTriangle size={18} className="text-yellow-500" />,
  info:    <Info          size={18} className="text-blue-500"   />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ type = 'info', title, message, duration = 3500 }) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white',
              'animate-in slide-in-from-right duration-300'
            )}
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="shrink-0 mt-0.5">{ICONS[t.type]}</div>
            <div className="flex-1 min-w-0">
              {t.title   && <p className="text-sm font-semibold text-slate-800">{t.title}</p>}
              {t.message && <p className="text-sm text-slate-500 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.toast
}