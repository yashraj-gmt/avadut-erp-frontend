// src/utils/helpers.js

/** Format date to DD/MM/YYYY */
export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

/** Capitalize first letter */
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

/** Truncate string */
export const truncate = (str = '', maxLength = 50) =>
  str.length > maxLength ? str.slice(0, maxLength) + '…' : str

/** Currency format (INR) */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount ?? 0)

/** Debounce */
export const debounce = (fn, delay = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}