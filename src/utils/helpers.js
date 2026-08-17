// src/utils/helpers.js

/** Parse string or date into a valid JS Date object */
export const parseDateStr = (str) => {
  if (!str) return null
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str
  if (typeof str === 'string') {
    const trimmed = str.trim()
    const parts = trimmed.split(/[-/]/)
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // yyyy-mm-dd
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        return isNaN(d.getTime()) ? null : d
      } else if (parts[2].length === 4) {
        // dd-mm-yyyy or dd/mm/yyyy
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
        return isNaN(d.getTime()) ? null : d
      }
    }
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/** Format date to dd-mm-yyyy */
export const formatToDMY = (date) => {
  if (!date) return '—'
  if (typeof date === 'string') {
    const trimmed = date.trim()
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (ymdMatch) return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`
  }
  const d = parseDateStr(date)
  if (!d) return typeof date === 'string' ? date : '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

/** Format a date range string (e.g. "2026-08-17 to 2026-08-20" or single date) to "dd-mm-yyyy to dd-mm-yyyy" */
export const formatRangeToDMY = (rangeStr) => {
  if (!rangeStr) return '—'
  if (typeof rangeStr === 'string' && rangeStr.includes(' to ')) {
    return rangeStr.split(' to ').map(s => formatToDMY(s)).join(' to ')
  }
  return formatToDMY(rangeStr)
}

/** Format date to dd-mm-yyyy */
export const formatDate = (date) => formatToDMY(date)

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