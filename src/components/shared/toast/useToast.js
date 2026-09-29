export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  const fn = ctx.toast
  if (fn) fn.toast = fn
  return fn
}