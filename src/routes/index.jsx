// src/routes/index.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '@/constants/routes'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicRoute    from '@/routes/PublicRoute'
import RoleRoute      from '@/routes/RoleRoute'
import AppShell       from '@/components/layout/AppShell'
import ErrorBoundary  from '@/components/shared/ErrorBoundary'

// ── Auth ──────────────────────────────────────────────────────────────────
const LoginPage      = lazy(() => import('@/pages/auth/LoginPage'))

// ── Dashboard ─────────────────────────────────────────────────────────────
const DashboardRouter = lazy(() => import('@/pages/dashboard/DashboardRouter'))

// ── Inventory ─────────────────────────────────────────────────────────────
const ProductList   = lazy(() => import('@/pages/inventory/products/ProductList'))
const ProductForm   = lazy(() => import('@/pages/inventory/products/ProductForm'))
const ProductDetail = lazy(() => import('@/pages/inventory/products/ProductDetail'))

// ── Generator Management ──────────────────────────────────────────────
const GeneratorList         = lazy(() => import('@/pages/generators/GeneratorList'))
const GeneratorForm         = lazy(() => import('@/pages/generators/GeneratorForm'))
const GeneratorAvailability = lazy(() => import('@/pages/generators/GeneratorAvailability'))
const GeneratorDetail       = lazy(() => import('@/pages/generators/GeneratorDetail'))

// ── Generator Order Management ────────────────────────────────────────
const GeneratorOrderList   = lazy(() => import('@/pages/generators/orders/GeneratorOrderList'))
const GeneratorOrderForm   = lazy(() => import('@/pages/generators/orders/GeneratorOrderForm'))
const GeneratorOrderDetail = lazy(() => import('@/pages/generators/orders/GeneratorOrderDetail'))
const GeneratorOrderBilling = lazy(() => import('@/pages/generators/orders/GeneratorOrderBilling'))
const GeneratorBillingHistory = lazy(() => import('@/pages/generators/billing/GeneratorBillingHistory'))

// ── Roles ─────────────────────────────────────────────────────────────────
const RolesPermissions = lazy(() => import('@/pages/roles/RolesPermissions'))

// ── Staff Portal ──────────────────────────────────────────────────────────
const StaffOrderList   = lazy(() => import('@/pages/staff/StaffOrderList'))
const StaffOrderDetail = lazy(() => import('@/pages/staff/StaffOrderDetail'))

// ── Misc ──────────────────────────────────────────────────────────────────
const ProfilePage  = lazy(() => import('@/pages/profile/ProfilePage'))
const Unauthorized = lazy(() => import('@/pages/Unauthorized'))

// ── Customer Management ──────────────────────────────────────────────────────
const CustomerList              = lazy(() => import('@/pages/customers/CustomerList'))
const CustomerProfile           = lazy(() => import('@/pages/customers/CustomerProfile'))
const PendingPaymentsDashboard  = lazy(() => import('@/pages/customers/PendingPaymentsDashboard'))

// ── Loader ────────────────────────────────────────────────────────────────
const Loader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
  </div>
)

const s = (Component) => (
  <Suspense fallback={<Loader />}><Component /></Suspense>
)

// Role-gated lazy route helper
const rr = (route, Component) => ({
  path: route,
  element: (
    <RoleRoute route={route}>
      <Suspense fallback={<Loader />}><Component /></Suspense>
    </RoleRoute>
  ),
  errorElement: <ErrorBoundary />,
})

// ── Router ────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Public (Auth) routes ────────────────────────────────────────────────
  {
    path: ROUTES.LOGIN,
    element: <PublicRoute>{s(LoginPage)}</PublicRoute>,
    errorElement: <ErrorBoundary />,
  },

  // ── Protected app shell ─────────────────────────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },

      // Dashboard
      rr(ROUTES.DASHBOARD, DashboardRouter),

      // Inventory — Products
      rr(ROUTES.PRODUCTS,       ProductList),
      rr(ROUTES.PRODUCT_ADD,    ProductForm),
      rr(ROUTES.PRODUCT_EDIT,   ProductForm),
      rr(ROUTES.PRODUCT_DETAIL, ProductDetail),

      // Roles
      rr(ROUTES.ROLES, RolesPermissions),

      // Generator Inventory Management
      rr(ROUTES.GENERATORS,             GeneratorList),
      rr(ROUTES.GENERATOR_ADD,          GeneratorForm),
      rr(ROUTES.GENERATOR_AVAILABILITY, GeneratorAvailability),
      rr(ROUTES.GENERATOR_EDIT,         GeneratorForm),
      rr(ROUTES.GENERATOR_DETAIL,       GeneratorDetail),

      // Generator Order Management
      rr(ROUTES.GENERATOR_ORDERS,        GeneratorOrderList),
      rr(ROUTES.GENERATOR_ORDER_ADD,     GeneratorOrderForm),
      rr(ROUTES.GENERATOR_ORDER_EDIT,    GeneratorOrderForm),
      rr(ROUTES.GENERATOR_ORDER_DETAIL,  GeneratorOrderDetail),
      rr(ROUTES.GENERATOR_ORDER_BILLING, GeneratorOrderBilling),
      rr(ROUTES.GENERATOR_BILLING_HISTORY, GeneratorBillingHistory),

      // Staff Portal
      rr(ROUTES.STAFF_ORDERS,       StaffOrderList),
      rr(ROUTES.STAFF_ORDER_DETAIL, StaffOrderDetail),

      // Customer Management
      rr(ROUTES.CUSTOMERS,         CustomerList),
      rr(ROUTES.CUSTOMER_ADD,      CustomerList),
      rr(ROUTES.CUSTOMER_PENDING,  PendingPaymentsDashboard),
      rr(ROUTES.CUSTOMER_EDIT,     CustomerList),
      rr(ROUTES.CUSTOMER_PROFILE,  CustomerProfile),

      // Profile (no role gate — any authenticated user)
      { path: ROUTES.PROFILE, errorElement: <ErrorBoundary />, element: s(ProfilePage) },

      // Unauthorized
      { path: ROUTES.UNAUTHORIZED, errorElement: <ErrorBoundary />, element: s(Unauthorized) },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])