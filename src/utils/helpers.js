// src/utils/helpers.js

/** Parse string or date into a valid JS Date object */
export const parseDateStr = (str) => {
  if (!str) return null
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str
  if (Array.isArray(str)) {
    const [y, m = 1, d = 1, h = 0, min = 0, s = 0] = str
    const dt = new Date(y, m - 1, d, h, min, s)
    return isNaN(dt.getTime()) ? null : dt
  }
  if (typeof str === 'number') {
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof str === 'string') {
    const trimmed = str.trim()
    // Exact yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-')
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      return isNaN(d.getTime()) ? null : d
    }
    // Exact dd-mm-yyyy or dd/mm/yyyy
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
      const parts = trimmed.split(/[-/]/)
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
      return isNaN(d.getTime()) ? null : d
    }
    // "yyyy-MM-dd HH:mm:ss" -> replace space with T for valid ISO parsing
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const d = new Date(trimmed.replace(' ', 'T'))
      return isNaN(d.getTime()) ? null : d
    }
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/** Format date to dd-mm-yyyy in Asia/Kolkata timezone */
export const formatToDMY = (date) => {
  if (!date) return '-'
  if (typeof date === 'string') {
    const trimmed = date.trim()
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-')
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  }
  const d = parseDateStr(date)
  if (!d) return typeof date === 'string' ? date : '-'
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const parts = formatter.formatToParts(d)
    const map = {}
    parts.forEach(p => { map[p.type] = p.value })
    const day = map.day || String(d.getDate()).padStart(2, '0')
    const month = map.month || String(d.getMonth() + 1).padStart(2, '0')
    const year = map.year || d.getFullYear()
    return `${day}-${month}-${year}`
  } catch (e) {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }
}

/** Format a date range string (e.g. "2026-08-17 to 2026-08-20" or single date) to "dd-mm-yyyy to dd-mm-yyyy" */
export const formatRangeToDMY = (rangeStr) => {
  if (!rangeStr) return '-'
  if (typeof rangeStr === 'string' && rangeStr.includes(' to ')) {
    return rangeStr.split(' to ').map(s => formatToDMY(s)).join(' to ')
  }
  return formatToDMY(rangeStr)
}

/** Format date to dd-mm-yyyy */
export const formatDate = (date) => formatToDMY(date)

/** Format date and time to dd-mm-yyyy, hh:mm A in Indian Standard Time (Asia/Kolkata) */
export const formatDateTime = (date) => {
  if (!date) return '-'
  const d = parseDateStr(date)
  if (!d) return typeof date === 'string' ? date : '-'
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    const parts = formatter.formatToParts(d)
    const map = {}
    parts.forEach(p => { map[p.type] = p.value })
    const day = map.day || String(d.getDate()).padStart(2, '0')
    const month = map.month || String(d.getMonth() + 1).padStart(2, '0')
    const year = map.year || d.getFullYear()
    const hour = map.hour || String(d.getHours() % 12 || 12).padStart(2, '0')
    const minute = map.minute || String(d.getMinutes()).padStart(2, '0')
    const ampm = (map.dayPeriod || (d.getHours() >= 12 ? 'PM' : 'AM')).toUpperCase()
    return `${day}-${month}-${year}, ${hour}:${minute} ${ampm}`
  } catch (e) {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `${day}-${month}-${year}, ${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`
  }
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