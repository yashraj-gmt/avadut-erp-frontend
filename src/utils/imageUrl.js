// src/utils/imageUrl.js

/**
 * Build the full URL for an image stored in the uploads directory.
 *
 * Backend stores the relative path in the DB, e.g.:
 *   "generators/images/7d15781b-26d9-401c-a24d-3b0100e62ed6.png"
 *
 * It is served by Nginx / the backend at:
 *   /uploads/generators/images/...
 *
 * VITE_UPLOADS_BASE_URL  (optional)
 *   - Development : http://192.168.1.13:8086   (if backend is cross-origin)
 *   - Production  : ""  (Nginx serves uploads at same origin)
 */
const UPLOADS_BASE = (import.meta.env.VITE_UPLOADS_BASE_URL || '').replace(/\/$/, '')

export const getImageUrl = (path) => {
  if (!path) return null

  // Already a full URL — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Strip any leading slashes for normalisation
  let normalised = path.replace(/^\/+/, '')

  // If it already starts with "uploads/", keep it
  // Otherwise prepend "uploads/"
  if (!normalised.startsWith('uploads/')) {
    normalised = 'uploads/' + normalised
  }

  // Combine with optional base URL
  return `${UPLOADS_BASE}/${normalised}`
}

export default getImageUrl