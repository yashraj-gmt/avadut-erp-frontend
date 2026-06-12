// src/routes/index.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '@/constants/routes'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicRoute    from '@/routes/PublicRoute'
import RoleRoute      from '@/routes/RoleRoute'
import AppShell       from '@/components/layout/AppShell'

// ── Auth ──────────────────────────────────────────────────────────────────
const LoginPage      = lazy(() => import('@/pages/auth/LoginPage'))

// ── Dashboard ─────────────────────────────────────────────────────────────
const DashboardRouter = lazy(() => import('@/pages/dashboard/DashboardRouter'))

// ── Inventory ─────────────────────────────────────────────────────────────
const ProductList   = lazy(() => import('@/pages/inventory/products/ProductList'))
const ProductForm   = lazy(() => import('@/pages/inventory/products/ProductForm'))
const ProductDetail = lazy(() => import('@/pages/inventory/products/ProductDetail'))
const CategoryList  = lazy(() => import('@/pages/inventory/categories/CategoryList'))
const CategoryForm  = lazy(() => import('@/pages/inventory/categories/CategoryForm'))

// Master data
const WarehouseList = lazy(() => import('@/pages/master-data/warehouses/WarehouseList'))

// ── Generator Management ──────────────────────────────────────────────
const GeneratorList = lazy(() => import('@/pages/generators/GeneratorList'))
const GeneratorForm = lazy(() => import('@/pages/generators/GeneratorForm'))


// ── Roles ─────────────────────────────────────────────────────────────────
const RolesPermissions = lazy(() => import('@/pages/roles/RolesPermissions'))

// ── Misc ──────────────────────────────────────────────────────────────────
const ProfilePage  = lazy(() => import('@/pages/profile/ProfilePage'))
const Unauthorized = lazy(() => import('@/pages/Unauthorized'))

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
})

// ── Router ────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Public (Auth) routes ────────────────────────────────────────────────
  {
    path: ROUTES.LOGIN,
    element: <PublicRoute>{s(LoginPage)}</PublicRoute>,
  },

  // ── Protected app shell ─────────────────────────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },

      // Dashboard
      rr(ROUTES.DASHBOARD, DashboardRouter),

      // Inventory — Products
      rr(ROUTES.PRODUCTS,       ProductList),
      rr(ROUTES.PRODUCT_ADD,    ProductForm),
      rr(ROUTES.PRODUCT_EDIT,   ProductForm),
      rr(ROUTES.PRODUCT_DETAIL, ProductDetail),

      // Inventory — Categories
      rr(ROUTES.CATEGORIES,    CategoryList),
      rr(ROUTES.CATEGORY_ADD,  CategoryForm),
      rr(ROUTES.CATEGORY_EDIT, CategoryForm),

      // Roles
      rr(ROUTES.ROLES, RolesPermissions),

      rr(ROUTES.WAREHOUSES, WarehouseList),

      // Generator Management
      rr(ROUTES.GENERATORS,     GeneratorList),
      rr(ROUTES.GENERATOR_ADD,  GeneratorForm),
      rr(ROUTES.GENERATOR_EDIT, GeneratorForm),


      // Profile (no role gate — any authenticated user)
      { path: ROUTES.PROFILE, element: s(ProfilePage) },

      // Unauthorized
      { path: ROUTES.UNAUTHORIZED, element: s(Unauthorized) },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])