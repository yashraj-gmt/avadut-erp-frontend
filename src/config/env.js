// src/config/env.js
export const ENV = {
  API_BASE_URL:      import.meta.env.VITE_API_BASE_URL  || '/api',
  APP_NAME:          import.meta.env.VITE_APP_NAME       || 'ERP System',
  APP_VERSION:       import.meta.env.VITE_APP_VERSION    || '1.0.0',
  TOKEN_KEY:         import.meta.env.VITE_TOKEN_KEY      || 'erp_access_token',
  REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || 'erp_refresh_token',
}