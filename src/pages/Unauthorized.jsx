// src/pages/Unauthorized.jsx
import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <ShieldOff size={48} className="text-red-400" />
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Access Denied</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>You don't have permission to view this page.</p>
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
        style={{ background: 'var(--color-primary)' }}
      >
        Go Back
      </button>
    </div>
  )
}