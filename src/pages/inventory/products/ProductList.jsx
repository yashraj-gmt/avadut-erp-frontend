import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate }                              from 'react-router-dom'
import { productService }                          from '@/services/inventoryService'
import { useCategories }                           from '@/hooks/useCategories'
import { useToast }                                from '@/components/shared/toast/ToastProvider'
import ConfirmModal                                from '@/components/shared/modal/ConfirmModal'
import defaultImg                                  from '@/assets/images/default.png'
import { getImageUrl } from '@/utils/imageUrl'


/* ── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  Plus:    () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  Search:  () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Eye:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Edit:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:   () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  ChevL:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>,
  ChevR:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>,
  Warning: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Refresh: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
}

const fmt = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—'

const stockStatus = (product) => {
  const stock = product.currentStock ?? 0
  const min   = product.minimumStock ?? 0
  if (stock === 0)  return { label: 'Out of Stock', bg: '#fce7f3', color: '#9d174d' }
  if (stock <= min) return { label: 'Low Stock',    bg: '#fef3c7', color: '#92400e' }
  return                   { label: 'In Stock',     bg: '#dcfce7', color: '#166534' }
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, borderRadius: 6, background: 'var(--color-border)', width: `${55 + (i % 4) * 12}%`, animation: 'pl-pulse 1.5s ease-in-out infinite' }} />
        </td>
      ))}
    </tr>
  )
}

export default function ProductList() {
  const navigate = useNavigate()
  const toast    = useToast()

  const [products,     setProducts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteId,     setDeleteId]     = useState(null)
  const [search,       setSearch]       = useState('')
  const [catFilter,    setCatFilter]    = useState('All Categories')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(8)
  const [sortBy,       setSortBy]       = useState('id')
  const [sortDir,      setSortDir]      = useState('asc')

  // Use the same hook as ProductForm so we get consistent data + loading state
  const { categories } = useCategories()

  /* ── Fetch products ──────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productService.getAll({ page: 0, size: 500, sortBy: 'createdAt', sortDir: 'desc' })
      // Interceptor already unwraps ApiResponse → res.data is PagedResponse
      setProducts(res.data?.content ?? [])
    } catch (err) {
      toast({ type: 'error', title: 'Failed to load products', message: err?.response?.data?.message ?? 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  /* ── Sorting ─────────────────────────────────────────────────── */
  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
    setPage(1)
  }

  /* ── Filtering ───────────────────────────────────────────────── */
  const filtered = products
    .filter(p => {
      const q           = search.toLowerCase()
      const matchSearch = p.name?.toLowerCase().includes(q) || p.productCode?.toLowerCase().includes(q)
      const matchCat    = catFilter === 'All Categories' || p.categoryName === catFilter
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? p.isActive : !p.isActive
      return matchSearch && matchCat && matchStatus
    })
    .sort((a, b) => {
      const fieldMap = { id: 'id', sku: 'productCode', category: 'categoryName', price: 'sellingPrice', stock: 'currentStock' }
      const key      = fieldMap[sortBy] ?? sortBy
      let va = a[key], vb = b[key]
      if (va == null) return 1; if (vb == null) return -1
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      const cmp = va > vb ? 1 : va < vb ? -1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)

  /* ── Delete ──────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await productService.delete(deleteId)
      setProducts(prev => prev.filter(p => p.id !== deleteId))
      toast({ type: 'success', title: 'Product deleted', message: 'The product has been removed.' })
      setDeleteId(null)
    } catch (err) {
      toast({ type: 'error', title: 'Delete failed', message: err?.response?.data?.message ?? 'Could not delete product.' })
    } finally {
      setDeleting(false)
    }
  }

  /* ── Stats ───────────────────────────────────────────────────── */
  const stats = [
    { label: 'Total Products',     value: products.length,                                                            color: 'var(--color-primary)' },
    { label: 'Active',             value: products.filter(p => p.isActive).length,                                    color: 'var(--color-success)' },
    { label: 'Low / Out of Stock', value: products.filter(p => (p.currentStock ?? 0) <= (p.minimumStock ?? 0)).length, color: 'var(--color-warning)' },
    { label: 'Total SKUs',         value: products.length,                                                            color: 'var(--color-info)'    },
  ]

  const SortIcon = ({ col }) => (
    <span style={{ color: sortBy === col ? '#2563eb' : '#cbd5e1', marginLeft: 4, fontSize: 10 }}>
      {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )

  const categoryOptions = ['All Categories', ...categories.map(c => c.name)]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes pl-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .pl-container { padding: 28px 32px; min-height: 100vh; background: var(--color-bg); }
        .pl-header    { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 12px; }
        .pl-stats     { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .pl-toolbar   { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
        .pl-search    { position: relative; flex: 1; min-width: 220px; max-width: 360px; }
        .pl-table-wrap{ overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .pl-pagination{ display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid var(--color-border); background: #fafbfd; flex-wrap: wrap; gap: 10px; }
        .pl-btn:hover { transform: translateY(-1px); }
        .pl-row:hover td { background: #f5f7ff !important; }
        .pl-act:hover { transform: scale(1.08); }
        .pl-input:focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; }
        .pl-pgbtn:hover:not(:disabled) { background: var(--color-surface-2) !important; }
        .sort-th { cursor: pointer; user-select: none; }
        .sort-th:hover { color: var(--color-primary) !important; }
        .pl-select { min-width: 140px; }
        @media (max-width: 1024px) { .pl-stats { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 768px) {
          .pl-container { padding: 16px 14px !important; }
          .pl-header { flex-direction: column !important; align-items: stretch !important; }
          .pl-add-btn { width: 100% !important; justify-content: center !important; }
          .pl-stats { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; margin-bottom: 16px !important; }
          .pl-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .pl-search { max-width: 100% !important; min-width: unset !important; width: 100% !important; }
          .pl-select { width: 100% !important; min-width: unset !important; }
          .pl-count { margin-left: 0 !important; }
          .pl-pagesize { width: 100% !important; }
          .pl-pagination { flex-direction: column !important; align-items: flex-start !important; }
          .pl-pg-btns { align-self: center; }
        }
        @media (max-width: 480px) {
          .pl-container { padding: 12px 10px !important; }
          .pl-stats { grid-template-columns: repeat(2,1fr) !important; }
          .pl-stat-val { font-size: 22px !important; }
        }
      `}</style>

      <div className="pl-container">

        {/* Header */}
        <div className="pl-header">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.4px' }}>Products</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', margin: '3px 0 0' }}>
              <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Inventory</a> › Products
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchProducts} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
              <Icon.Refresh /> Refresh
            </button>
            <button className="pl-btn pl-add-btn" onClick={() => navigate('/inventory/products/add')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              <Icon.Plus /> Add Product
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="pl-stats">
          {stats.map(s => (
            <div key={s.label} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)', borderLeft: `4px solid ${s.color}` }}>
              <div className="pl-stat-val" style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)' }}>
                {loading ? <div style={{ width: 40, height: 28, background: 'var(--color-border)', borderRadius: 4, animation: 'pl-pulse 1.5s infinite' }} /> : s.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="pl-toolbar">
          <div className="pl-search">
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)', pointerEvents: 'none' }}><Icon.Search /></span>
            <input className="pl-input"
              style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none' }}
              placeholder="Search by name or SKU…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>

          <select className="pl-input pl-select"
            style={{ padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', cursor: 'pointer', outline: 'none' }}
            value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
            {categoryOptions.map(c => <option key={c}>{c}</option>)}
          </select>

          <select className="pl-input pl-select"
            style={{ padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', cursor: 'pointer', outline: 'none' }}
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <span className="pl-count" style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </span>

          <select className="pl-pagesize"
            style={{ padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', cursor: 'pointer', outline: 'none' }}
            value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>
            <option value={5}>5 / page</option>
            <option value={8}>8 / page</option>
            <option value={12}>12 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          <div className="pl-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead style={{ background: 'var(--color-surface-2)', borderBottom: '1.5px solid var(--color-border)' }}>
                <tr>
                  {[
                    { label: '#',        align: 'left',   col: null       },
                    { label: 'Product',  align: 'left',   col: null       },
                    { label: 'SKU',      align: 'left',   col: 'sku'      },
                    { label: 'Category', align: 'left',   col: 'category' },
                    { label: 'Price',    align: 'right',  col: 'price'    },
                    { label: 'Stock',    align: 'center', col: 'stock'    },
                    { label: 'Status',   align: 'center', col: null       },
                    { label: 'Actions',  align: 'center', col: null       },
                  ].map(({ label, align, col }) => (
                    <th key={label} className={col ? 'sort-th' : ''} onClick={col ? () => handleSort(col) : undefined}
                      style={{ padding: '12px 16px', textAlign: align, fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      {label}{col && <SortIcon col={col} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                  : paged.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--color-text-subtle)' }}>
                        <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>No products found</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
                      </td>
                    </tr>
                  )
                  : paged.map((p, i) => {
                    const ss = stockStatus(p)
                    return (
                      <tr key={p.id} className="pl-row" style={{ borderBottom: '1px solid var(--color-surface-2)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-subtle)', fontSize: 13 }}>{(page - 1) * pageSize + i + 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <img src={getImageUrl(p.primaryImageUrl) || defaultImg} alt={p.name}
                              onError={e => { e.target.onerror = null; e.target.src = defaultImg }}
                              style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1.5px solid var(--color-border)', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', lineHeight: 1.3 }}>{p.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 2 }}>{p.categoryName ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>{p.productCode ?? '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{p.categoryName ?? '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{fmt(p.sellingPrice)}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: (p.currentStock ?? 0) === 0 ? 'var(--color-danger)' : (p.currentStock ?? 0) <= (p.minimumStock ?? 0) ? 'var(--color-warning)' : 'var(--color-text)' }}>
                              {p.currentStock ?? 0}
                            </span>
                            {(p.currentStock ?? 0) > 0 && (p.currentStock ?? 0) <= (p.minimumStock ?? 0) && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-warning)' }}><Icon.Warning /> Low</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: ss.bg, color: ss.color, whiteSpace: 'nowrap' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.color, flexShrink: 0 }} />
                            {ss.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            <button className="pl-act" title="View"   onClick={() => navigate(`/inventory/products/${p.id}`)}      style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: 'var(--color-primary-100)', color: 'var(--color-primary)',  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}><Icon.Eye /></button>
                            <button className="pl-act" title="Edit"   onClick={() => navigate(`/inventory/products/${p.id}/edit`)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: 'var(--color-info-light)',   color: 'var(--color-info)',     display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}><Icon.Edit /></button>
                            <button className="pl-act" title="Delete" onClick={() => setDeleteId(p.id)}                           style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: 'var(--color-danger-light)', color: 'var(--color-danger)',   display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}><Icon.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="pl-pagination">
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="pl-pg-btns" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button className="pl-pgbtn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.ChevL />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let n
                  if (totalPages <= 7)             n = i + 1
                  else if (page <= 4)              n = i + 1
                  else if (page >= totalPages - 3) n = totalPages - 6 + i
                  else                             n = page - 3 + i
                  if (n < 1 || n > totalPages) return null
                  return (
                    <button key={n} className="pl-pgbtn" onClick={() => setPage(n)}
                      style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', border: n === page ? 'none' : '1.5px solid var(--color-border)', background: n === page ? 'var(--color-primary)' : 'var(--color-surface)', color: n === page ? '#fff' : 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {n}
                    </button>
                  )
                })}
                <button className="pl-pgbtn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: (page === totalPages || totalPages === 0) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.ChevR />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product?"
        message="This action is permanent. All inventory records linked to this product will also be removed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
