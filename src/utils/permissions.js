// src/utils/permissions.js
import { ROLES }  from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

/**
 * ROUTE_PERMISSIONS
 * ─────────────────
 * Maps each route to the roles that may access it.
 * Phase routes are added here — no component changes needed.
 *
 * NOTE: STAFF is defined but has minimal access in Phase 1.
 *       Expand it in Phase 5 (Staff Management).
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
  [ROUTES.PRODUCT_DETAIL]: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],


  // ── Generator Management ──────────────────────────────────────────────
  [ROUTES.GENERATORS]:        [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ADD]:     [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_EDIT]:    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_DETAIL]:  [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],

  // ── Generator Order Management ────────────────────────────────────────
  [ROUTES.GENERATOR_ORDERS]:        [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  [ROUTES.GENERATOR_ORDER_ADD]:     [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ORDER_EDIT]:    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  [ROUTES.GENERATOR_ORDER_DETAIL]:  [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  [ROUTES.GENERATOR_ORDER_BILLING]: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
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