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
};