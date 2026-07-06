// src/constants/routes.js
export const ROUTES = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  LOGIN:        '/login',
 
  // ── Core ──────────────────────────────────────────────────────────────────
  DASHBOARD:    '/dashboard',
  PROFILE:      '/profile',
  UNAUTHORIZED: '/unauthorized',
 
  // ── Roles & Permissions ───────────────────────────────────────────────────
  ROLES:        '/roles',
 
  // ── Inventory — Products ──────────────────────────────────────────────────
  PRODUCTS:       '/inventory/products',
  PRODUCT_ADD:    '/inventory/products/add',
  PRODUCT_EDIT:   '/inventory/products/:id/edit',
  PRODUCT_DETAIL: '/inventory/products/:id',

  // ── Generator Management ────────────────────────────────────────────────
  GENERATORS:        '/generators',
  GENERATOR_ADD:     '/generators/add',
  GENERATOR_EDIT:    '/generators/:id/edit',
  GENERATOR_DETAIL:  '/generators/:id',

  // ── Generator Order Management ───────────────────────────────────────────
  GENERATOR_ORDERS:        '/generators/orders',
  GENERATOR_ORDER_ADD:     '/generators/orders/add',
  GENERATOR_ORDER_EDIT:    '/generators/orders/:id/edit',
  GENERATOR_ORDER_DETAIL:  '/generators/orders/:id',
  GENERATOR_ORDER_BILLING: '/generators/orders/:id/billing',
};