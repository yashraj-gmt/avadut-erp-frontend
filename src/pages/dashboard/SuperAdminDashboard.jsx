// src/pages/dashboard/SuperAdminDashboard.jsx
import AdminDashboard from './AdminDashboard'
import Last7DaysCompletedOrders from './components/Last7DaysCompletedOrders'

/**
 * SuperAdminDashboard
 * Presents the Operations & Quick-Action Hub plus the Last 7 Days Completed Generator Orders overview.
 */
export default function SuperAdminDashboard() {
  return (
    <AdminDashboard
      title="Super Admin Dashboard"
      subtitle="Access key operations across generator inventory, booking operations, billing, and review recent completed orders."
      badgeText="Super Admin Operations Hub"
    >
      <Last7DaysCompletedOrders />
    </AdminDashboard>
  )
}