// src/constants/roles.js

/**
 * Must match com.erp.system.enums.UserRole exactly.
 * Spring serializes the enum as its name() — no prefix.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN:       'ADMIN',
  STAFF:       'STAFF',       // Phase 5 (included now to avoid future breaking changes)
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.ADMIN]:       'Administrator',
  [ROLES.STAFF]:       'Staff',
}

export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: { bg: '#FEF3C7', text: '#92400E' },
  [ROLES.ADMIN]:       { bg: '#DBEAFE', text: '#1E40AF' },
  [ROLES.STAFF]:       { bg: '#D1FAE5', text: '#065F46' },
}

/** Default post-login redirect per role */
export const ROLE_DEFAULT_ROUTE = {
  [ROLES.SUPER_ADMIN]: '/dashboard',
  [ROLES.ADMIN]:       '/dashboard',
  [ROLES.STAFF]:       '/dashboard',
}