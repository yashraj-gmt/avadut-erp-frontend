import { useState, useRef, useEffect } from 'react'
import Spinner from './Spinner'

/**
 * SearchableSelect — searchable dropdown that matches the app's design system.
 *
 * Props:
 *   options       [{value, label}]   — all options
 *   value         any                — current selected value
 *   onChange      (value, option)    — called on selection
 *   placeholder   string
 *   label         string
 *   error         string
 *   required      boolean
 *   disabled      boolean
 *   loading       boolean            — shows spinner while options load
 *   size          'sm'|'md'|'lg'
 *   className     string
 *
 * Usage:
 *   <SearchableSelect
 *     label="Category"
 *     options={categories.map(c => ({ value: c.id, label: c.name }))}
 *     value={form.categoryId}
 *     onChange={(val) => setForm(f => ({ ...f, categoryId: val }))}
 *     required
 *   />
 */

const sizeMap = {
  sm: { trigger: 'h-8  text-xs  px-3',   label: 'text-xs', hint: 'text-[10px]' },
  md: { trigger: 'h-10 text-sm  px-3.5', label: 'text-sm', hint: 'text-xs'     },
  lg: { trigger: 'h-12 text-base px-4',  label: 'text-sm', hint: 'text-xs'     },
}

export default function SearchableSelect({
  options       = [],
  value,
  onChange,
  placeholder   = 'Select…',
  label,
  error,
  required      = false,
  disabled      = false,
  loading       = false,
  size          = 'md',
  className     = '',
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef             = useRef(null)
  const searchRef           = useRef(null)

  const s        = sizeMap[size] ?? sizeMap.md
  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  /* close on outside click */
  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* focus search when dropdown opens */
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30)
  }, [open])

  const handleToggle = () => {
    if (disabled) return
    setOpen(v => !v)
    if (!open) setSearch('')
  }

  const handleSelect = (opt) => {
    onChange(opt.value, opt)
    setOpen(false)
    setSearch('')
  }

  const borderColor = error
    ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
    : 'border-[var(--color-border)]'

  return (
    <div ref={wrapRef} className={['flex flex-col gap-1.5 relative', className].join(' ')}>
      {label && (
        <label className={['font-medium text-[var(--color-text)]', s.label].join(' ')}>
          {label}
          {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={[
          'w-full flex items-center justify-between rounded-[var(--radius-md)] border',
          'bg-[var(--color-surface)] text-left transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          borderColor,
          s.trigger,
          open ? 'ring-2 ring-[var(--color-primary)] border-[var(--color-primary)]' : '',
        ].join(' ')}
      >
        <span className={selected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)]'}>
          {loading ? 'Loading…' : (selected?.label ?? placeholder)}
        </span>
        <span className="shrink-0 ml-2 text-[var(--color-text-muted)]">
          {loading
            ? <Spinner size="xs" />
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="m6 9 6 6 6-6"/></svg>
          }
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
          style={{ top: '100%', maxHeight: 260 }}
        >
          {/* Search */}
          <div className="p-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full h-8 pl-7 pr-3 text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--color-text-subtle)] text-center">
                No options found
              </div>
            ) : filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={[
                  'w-full text-left px-4 py-2.5 text-sm transition-colors duration-100',
                  opt.value === value
                    ? 'bg-[var(--color-primary-50)] text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error / Hint */}
      {error && (
        <p className={['text-[var(--color-danger)]', s.hint].join(' ')}>{error}</p>
      )}
    </div>
  )
}