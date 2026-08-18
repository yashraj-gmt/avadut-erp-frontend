// src/utils/permissions.js
import { ROLES }  from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

/**
 * ROUTE_PERMISSIONS
 * ─────────────────
 * Maps each route to the roles that may access it.
 *
 * STAFF has a dedicated /staff/** portal and cannot access /generators/** admin routes.
 */
export const ROUTE_PERMISSIONS = {
  // ── Core ──────────────────────────────────────────────────────────────────
  [ROUTES.DASHBOARD]: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  [ROUTES.PROFILE]:   [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],

  // ── Roles & Permissions (SUPER_ADMIN only) ─────────────────────────────────
  [ROUTES.ROLES]: [ROLES.SUPER_ADMIN],

  // ── Inventory ─────────────────────────────────────────────────────────────
  [ROUTES.PRODUCTS]:       [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.PRODUCT_ADD]:    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.PRODUCT_EDIT]:   [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.PRODUCT_DETAIL]: [ROLES.SUPER_ADMIN, ROLES.ADMIN],


  // ── Generator Management (Admin only) ──────────────────────────────────
  [ROUTES.GENERATORS]:        [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ADD]:     [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_EDIT]:    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_DETAIL]:  [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // ── Generator Order Management (Admin only) ───────────────────────────
  [ROUTES.GENERATOR_ORDERS]:        [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ORDER_ADD]:     [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ORDER_EDIT]:    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ORDER_DETAIL]:  [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ORDER_BILLING]:  [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_BILLING_HISTORY]: [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // ── Staff Portal (STAFF only) ─────────────────────────────────────────
  [ROUTES.STAFF_ORDERS]:       [ROLES.STAFF],
  [ROUTES.STAFF_ORDER_DETAIL]: [ROLES.STAFF],
}

/** Returns true if role is allowed on the given route */
export const hasRouteAccess = (role, route) => {
  if (!role) return true                         // dev bypass
  const allowed = ROUTE_PERMISSIONS[route]
  if (!allowed) return false
  return allowed.includes(role)
}

/** All sidebar routes visible to the given role */
export const getSidebarItems = (role) =>
  Object.entries(ROUTE_PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([route]) => route)