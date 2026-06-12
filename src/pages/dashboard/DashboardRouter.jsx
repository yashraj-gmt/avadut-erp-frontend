// src/pages/dashboard/DashboardRouter.jsx
import { useAuthStore } from '@/store/authStore'
import { ROLES } from '@/constants/roles'
import SuperAdminDashboard from './SuperAdminDashboard'
import AdminDashboard      from './AdminDashboard'

export default function DashboardRouter() {
  const { user } = useAuthStore()

  if (user?.role === ROLES.SUPER_ADMIN) return <SuperAdminDashboard />
  if (user?.role === ROLES.ADMIN)       return <AdminDashboard />

  return <div className="p-6 text-slate-500">No dashboard configured for your role.</div>
}