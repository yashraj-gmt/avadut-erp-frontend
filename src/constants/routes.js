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
 
  // ── Inventory — Phase 1 ───────────────────────────────────────────────────
  PRODUCTS:        '/inventory/products',
  PRODUCT_ADD:     '/inventory/products/add',
  PRODUCT_EDIT:    '/inventory/products/:id/edit',
  PRODUCT_DETAIL:  '/inventory/products/:id',
  CATEGORIES:      '/inventory/categories',
  CATEGORY_ADD:    '/inventory/categories/add',
  CATEGORY_EDIT:   '/inventory/categories/:id/edit',
 
  // ── Master Data — Warehouses ──────────────────────────────────────────────
  WAREHOUSES:       '/master-data/warehouses',
  WAREHOUSE_ADD:    '/master-data/warehouses/add',
  WAREHOUSE_EDIT:   '/master-data/warehouses/:id/edit',
  WAREHOUSE_DETAIL: '/master-data/warehouses/:id',

  // ── Generator Management ────────────────────────────────────────────────
  GENERATORS:        '/generators',
  GENERATOR_ADD:     '/generators/add',
  GENERATOR_EDIT:    '/generators/:id/edit',
  GENERATOR_DETAIL:  '/generators/:id',
};
 