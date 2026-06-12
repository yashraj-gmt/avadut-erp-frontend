import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams }                  from 'react-router-dom'
import { productService }                          from '@/services/inventoryService'
import { useToast }                                from '@/components/shared/toast/ToastProvider'
import ConfirmModal                                from '@/components/shared/modal/ConfirmModal'
import { SpinnerInline }                           from '@/components/shared'
import defaultImg                                  from '@/assets/images/default.png'
import { getImageUrl } from '@/utils/imageUrl'


/* ── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  Edit:      () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:     () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  ZoomIn:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ChevL:     () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>,
  ChevR:     () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>,
  Warning:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Tag:       () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  X:         () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
}

const fmt = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—'
const imgSrc = (url) => getImageUrl(url) || defaultImg


const stockStatus = (inv) => {
  const qty = inv.stockQuantity ?? 0
  if (qty === 0)           return { label: 'Out of Stock', color: 'var(--color-danger)',  bg: 'var(--color-danger-light)' }
  if (inv.isLowStock)      return { label: 'Low Stock',    color: 'var(--color-warning)', bg: 'var(--color-warning-light)' }
  return                          { label: 'In Stock',     color: 'var(--color-success)', bg: 'var(--color-success-light)' }
}

export default function ProductDetail() {
  const navigate  = useNavigate()
  const { id }    = useParams()
  const toast     = useToast()

  const [product,     setProduct]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [activeImg,   setActiveImg]   = useState(null)
  const [lightbox,    setLightbox]    = useState(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  /* ── Fetch product */
  const fetchProduct = useCallback(async () => {
  setLoading(true)
  try {
    const res = await productService.getById(id)
    const p   = res.data
    setProduct(p)
    setActiveImg(p?.images?.find(i => i.isPrimary) ?? p?.images?.[0] ?? null)
  } catch (err) {
    toast({ type: 'error', title: 'Failed to load product', message: err?.response?.data?.message ?? 'Please try again.' })
    navigate('/inventory/products')
  } finally {
    setLoading(false)
  }
}, [id, toast, navigate])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  /* ── Delete ───────────────────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await productService.delete(id)
      toast({ type: 'success', title: 'Product deleted', message: `"${product?.name}" has been removed.` })
      navigate('/inventory/products')
    } catch (err) {
      toast({ type: 'error', title: 'Delete failed', message: err?.response?.data?.message ?? 'Could not delete product.' })
    } finally {
      setDeleting(false)
    }
  }

  /* Lightbox helpers */
  const images    = product?.images ?? []
  const openLightbox = (img) => {
    const idx = images.findIndex(i => i.id === img.id)
    setLightboxIdx(idx < 0 ? 0 : idx)
    setLightbox(img)
  }
  const lbPrev = () => { const idx = (lightboxIdx - 1 + images.length) % images.length; setLightboxIdx(idx); setLightbox(images[idx]) }
  const lbNext = () => { const idx = (lightboxIdx + 1) % images.length;                setLightboxIdx(idx); setLightbox(images[idx]) }

  /* Loading */
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerInline message="Loading product details…" />
      </div>
    )
  }

  if (!product) return null

  /* ── Derived values ───────────────────────────────────────────── */
  const inventories  = product.inventories ?? []
  const totalStock   = inventories.reduce((a, i) => a + (i.stockQuantity ?? 0), 0)
  const totalAlert   = inventories.reduce((a, i) => a + (i.stockAlert   ?? 0), 0)
  const isLowStockP  = totalStock <= (product.minimumStock ?? 0) && totalStock !== 0
  const isOutOfStock = totalStock === 0

  const sellingPrice  = product.sellingPrice
  const purchasePrice = product.purchasePrice
  const marginPct     = sellingPrice && purchasePrice && sellingPrice > 0
    ? (((sellingPrice - purchasePrice) / sellingPrice) * 100).toFixed(1)
    : null

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pd-container   { min-height: 100vh; background: var(--color-bg); padding: 28px 32px; }
        .pd-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .pd-header-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }
        .pd-actions     { display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
        .pd-main-grid   { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
        .pd-pricing     { display: flex; gap: 20px; padding: 16px; background: var(--color-surface-2); border-radius: var(--radius-lg); border: 1px solid var(--color-border); flex-wrap: wrap; }
        .pd-pricing-item{ min-width: 120px; flex: 1; }
        .pd-meta        { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px; }
        .pd-table-wrap  { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .pd-divider     { width: 1px; background: var(--color-border); flex-shrink: 0; }
        .thumb:hover    { border-color: var(--color-primary) !important; transform: scale(1.04); }
        .thumb          { transition: all 0.15s; cursor: pointer; }
        .main-img:hover .zoom-btn { opacity: 1 !important; }
        .action-btn:hover { transform: translateY(-2px); }
        @media (max-width: 900px) {
          .pd-main-grid { grid-template-columns: 1fr !important; }
          .pd-pricing   { gap: 12px !important; }
          .pd-pricing-item { min-width: calc(50% - 10px) !important; flex: unset !important; width: calc(50% - 10px); }
          .pd-divider   { display: none !important; }
        }
        @media (max-width: 640px) {
          .pd-container   { padding: 14px !important; }
          .pd-page-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .pd-header-left { flex-wrap: wrap; }
          .pd-actions     { width: 100% !important; }
          .pd-actions button { flex: 1 !important; justify-content: center !important; }
          .pd-pricing     { gap: 10px !important; }
          .pd-pricing-item{ min-width: calc(50% - 8px) !important; width: calc(50% - 8px) !important; }
          .pd-meta        { gap: 8px !important; }
        }
        @media (max-width: 400px) {
          .pd-pricing-item { min-width: 100% !important; width: 100% !important; }
          .pd-actions     { flex-direction: column !important; }
          .pd-actions button { width: 100% !important; }
        }
      `}</style>

      <div className="pd-container">

        {/* ── Page Header ───────────────────────────────────────── */}
        <div className="pd-page-header">
          <div className="pd-header-left">
            <button
              onClick={() => navigate('/inventory/products')}
              style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}
            >
              <Icon.ArrowLeft />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.4px' }}>Product Details</h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Inventory</a> ›{' '}
                <a href="#" onClick={e => { e.preventDefault(); navigate('/inventory/products') }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Products</a> › {product.name}
              </p>
            </div>
          </div>

          <div className="pd-actions">
            <button className="action-btn" onClick={() => navigate(`/inventory/products/${product.id}/edit`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              <Icon.Edit /> Edit Product
            </button>
            <button className="action-btn" onClick={() => setShowDelete(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'linear-gradient(135deg, var(--color-danger), #dc2626)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              <Icon.Trash /> Delete
            </button>
          </div>
        </div>

        {/* ── Main Grid ─────────────────────────────────────────── */}
        <div className="pd-main-grid">

          {/* LEFT: Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="main-img" onClick={() => activeImg && openLightbox(activeImg)}
              style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', aspectRatio: '1', position: 'relative', cursor: images.length ? 'zoom-in' : 'default' }}>
              <img
                src={imgSrc(activeImg?.imageUrl)}
                alt={product.name}
                onError={e => { e.target.onerror = null; e.target.src = defaultImg }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
              />
              {images.length > 0 && (
                <>
                  <button className="zoom-btn"
                    style={{ position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0, transition: 'opacity 0.2s', boxShadow: 'var(--shadow-md)' }}>
                    <Icon.ZoomIn />
                  </button>
                  <div style={{ position: 'absolute', bottom: 12, right: 14, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                    {images.findIndex(i => i.id === activeImg?.id) + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {images.map(img => (
                  <div key={img.id} className="thumb" onClick={() => setActiveImg(img)}
                    style={{ width: 70, height: 70, flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: activeImg?.id === img.id ? '2.5px solid var(--color-primary)' : '2px solid var(--color-border)' }}>
                    <img
                      src={imgSrc(img.imageUrl)}
                      alt=""
                      onError={e => { e.target.onerror = null; e.target.src = defaultImg }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info + Inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Product Info Card */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {product.categoryName && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--color-primary-100)', color: 'var(--color-primary)' }}>
                    <Icon.Tag /> {product.categoryName}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: product.isActive ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: product.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: product.isActive ? 'var(--color-success)' : 'var(--color-danger)' }} />
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
                {(isLowStockP || isOutOfStock) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                    <Icon.Warning /> {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: product.status === 'PUBLISHED' ? 'var(--color-success-light)' : 'var(--color-surface-2)', color: product.status === 'PUBLISHED' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  {product.status}
                </span>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', letterSpacing: '-0.4px' }}>{product.name}</h2>

              <div className="pd-meta">
                <span>SKU: <strong style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{product.productCode}</strong></span>
                {product.unit   && <span>Unit: <strong style={{ color: 'var(--color-text-muted)' }}>{product.unit}</strong></span>}
                {product.weight && <span>Weight: <strong style={{ color: 'var(--color-text-muted)' }}>{product.weight} kg</strong></span>}
                {product.hsnCode && <span>HSN: <strong style={{ color: 'var(--color-text-muted)' }}>{product.hsnCode}</strong></span>}
              </div>

              {product.description && (
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, margin: '0 0 20px' }}>{product.description}</p>
              )}

              {/* Pricing */}
              <div className="pd-pricing">
                {[
                  { label: 'Selling Price', value: fmt(sellingPrice),  color: 'var(--color-text)' },
                  { label: 'Cost Price',    value: fmt(purchasePrice), color: 'var(--color-text-muted)' },
                  { label: 'Margin',        value: marginPct != null ? `${marginPct}%` : '—', color: 'var(--color-success)' },
                  { label: 'Total Stock',   value: totalStock, color: isOutOfStock ? 'var(--color-danger)' : isLowStockP ? 'var(--color-warning)' : 'var(--color-text)' },
                ].map((item, i, arr) => (
                  <React.Fragment key={item.label}>
                    <div className="pd-pricing-item">
                      <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: item.color, letterSpacing: '-0.5px' }}>{item.value}</div>
                    </div>
                    {i < arr.length - 1 && <div className="pd-divider" />}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16, fontSize: 12, color: 'var(--color-text-subtle)', flexWrap: 'wrap' }}>
                {product.createdAt && <span>Created: <strong style={{ color: 'var(--color-text-muted)' }}>{new Date(product.createdAt).toLocaleDateString()}</strong></span>}
                {product.createdAt && product.updatedAt && <span>•</span>}
                {product.updatedAt && <span>Last updated: <strong style={{ color: 'var(--color-text-muted)' }}>{new Date(product.updatedAt).toLocaleDateString()}</strong></span>}
              </div>
            </div>

            {/* Inventory Card */}
            {inventories.length > 0 && (
              <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-surface-2)' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Inventory by Warehouse</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {inventories.length} warehouse{inventories.length !== 1 ? 's' : ''} · {totalStock} units total
                  </p>
                </div>

                <div className="pd-table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                    <thead style={{ background: 'var(--color-surface-2)' }}>
                      <tr>
                        {['Warehouse', 'Stock Qty', 'Alert Threshold', 'Capacity', 'Utilisation', 'Status'].map(h => (
                          <th key={h} style={{ padding: '11px 16px', textAlign: h === 'Warehouse' ? 'left' : 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventories.map((inv, i) => {
                        const ss  = stockStatus(inv)
                        const cp  = inv.capacityUtilisationPercentage
                        const ap  = inv.stockAlertPercentage
                        return (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-surface-2)', background: i % 2 === 0 ? 'var(--color-surface)' : '#fafbfd' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                                {inv.warehouseName}
                                {inv.warehouseCode && <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginLeft: 6 }}>({inv.warehouseCode})</span>}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: 18, color: inv.stockQuantity === 0 ? 'var(--color-danger)' : inv.isLowStock ? 'var(--color-warning)' : 'var(--color-text)' }}>
                                {inv.stockQuantity ?? 0}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)' }}>{inv.stockAlert ?? '—'}</span>
                                {ap != null && (
                                  <span style={{ fontSize: 11, color: ap < 100 ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 600 }}>{ap.toFixed(0)}% of alert</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{inv.warehouseCapacity ?? '—'}</span>
                            </td>
                            <td style={{ padding: '14px 16px', minWidth: 120 }}>
                              {cp != null ? (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Utilisation</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: cp > 90 ? 'var(--color-danger)' : cp > 70 ? 'var(--color-warning)' : 'var(--color-success)' }}>{cp.toFixed(1)}%</span>
                                  </div>
                                  <div style={{ background: 'var(--color-surface-2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, cp)}%`, height: '100%', borderRadius: 4, background: cp > 90 ? 'var(--color-danger)' : cp > 70 ? 'var(--color-warning)' : 'var(--color-success)', transition: 'width 0.5s' }} />
                                  </div>
                                </div>
                              ) : <span style={{ fontSize: 13, color: 'var(--color-border-strong)' }}>—</span>}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: ss.bg, color: ss.color, whiteSpace: 'nowrap' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.color }} />
                                {ss.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot style={{ background: 'var(--color-surface-2)', borderTop: '1.5px solid var(--color-border)' }}>
                      <tr>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, color: 'var(--color-text-muted)' }}>Total</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, fontSize: 16, color: 'var(--color-text)' }}>{totalStock}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--color-text-muted)' }}>{totalAlert}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────── */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setLightbox(null)}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.X />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={lbPrev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.ChevL />
              </button>
              <button onClick={lbNext} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.ChevR />
              </button>
            </>
          )}
          <div style={{ maxWidth: '80vw', maxHeight: '85vh' }}>
            <img
              src={imgSrc(lightbox.imageUrl)}
              alt=""
              onError={e => { e.target.onerror = null; e.target.src = defaultImg }}
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 'var(--radius-lg)', objectFit: 'contain', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
            />
            <div style={{ textAlign: 'center', marginTop: 14, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{lightboxIdx + 1} / {images.length}</div>
          </div>
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
              {images.map((img, i) => (
                <div key={img.id} onClick={() => { setLightboxIdx(i); setLightbox(img) }}
                  style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', border: i === lightboxIdx ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.2)', opacity: i === lightboxIdx ? 1 : 0.55, transition: 'all 0.15s' }}>
                  <img src={imgSrc(img.imageUrl)} alt="" onError={e => { e.target.onerror = null; e.target.src = defaultImg }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        onConfirm={handleDelete}
        title={`Delete "${product.name}"?`}
        message="This action is permanent. All inventory records linked to this product will also be removed."
        confirmLabel="Delete Product"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}