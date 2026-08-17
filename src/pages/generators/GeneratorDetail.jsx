// src/pages/generators/GeneratorDetail.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams }                  from 'react-router-dom'
import { generatorService }                        from '@/services/generatorService'
import { useToast }                                from '@/components/shared/toast/ToastProvider'
import ConfirmModal                                from '@/components/shared/modal/ConfirmModal'
import { SpinnerInline }                           from '@/components/shared'
import { getImageUrl }                             from '@/utils/imageUrl'
import { formatToDMY }                            from '@/utils/helpers'
import { ROUTES }                                  from '@/constants/routes'

/* ── Default placeholder image (inline SVG data URI) ─────────────────────── */
const DEFAULT_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Cpolygon points='100,60 60,140 140,140' fill='%23cbd5e1'/%3E%3C/svg%3E"

/* ── Icons ────────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  Edit:      () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:     () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  ZoomIn:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  X:         () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Zap:       () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Warning:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

/* ── Label maps ───────────────────────────────────────────────────────────── */
const FUEL_LABELS = {
  DIESEL:      'Diesel',
  PETROL:      'Petrol',
  GAS:         'Gas',
  NATURAL_GAS: 'Natural Gas',
  DUAL_FUEL:   'Dual Fuel',
}

const STATUS_LABELS = {
  AVAILABLE:         'Available',
  IN_USE:            'In Use',
  UNDER_MAINTENANCE: 'Maintenance',
  RETIRED:           'Retired',
}

const statusColor = (status) => {
  switch (status) {
    case 'AVAILABLE':         return { bg: '#dcfce7', color: '#166534' }
    case 'IN_USE':            return { bg: '#dbeafe', color: '#1e40af' }
    case 'UNDER_MAINTENANCE': return { bg: '#fef9c3', color: '#854d0e' }
    case 'RETIRED':           return { bg: '#f1f5f9', color: '#475569' }
    default:                  return { bg: '#f1f5f9', color: '#64748b' }
  }
}

/* ── Formatters ───────────────────────────────────────────────────────────── */
const fmt     = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'
const imgSrc  = (url) => getImageUrl(url) || DEFAULT_IMG
const fmtDate = (dt) => formatToDMY(dt)

/* ── Info Row ─────────────────────────────────────────────────────────────── */
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ width: 140, flexShrink: 0, fontSize: 13, color: 'var(--color-text-subtle)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, wordBreak: 'break-word' }}>{value ?? '—'}</span>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function GeneratorDetail() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const toast    = useToast()

  const [generator,  setGenerator]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [lightbox,   setLightbox]   = useState(false)
  const [prevId,     setPrevId]     = useState(id)

  if (id !== prevId) {
    setPrevId(id)
    setGenerator(null)
    setLoading(true)
  }

  /* ── Fetch generator ──────────────────────────────────────────────── */
  const fetchGenerator = useCallback(async () => {
    try {
      const res = await generatorService.getById(id)
      const g   = res?.data?.data ?? res?.data ?? res
      setGenerator(g)
    } catch (err) {
      toast({ type: 'error', title: 'Failed to load generator', message: err?.response?.data?.message ?? 'Please try again.' })
      navigate(ROUTES.GENERATORS)
    } finally {
      setLoading(false)
    }
  }, [id, toast, navigate])

  useEffect(() => { fetchGenerator() }, [fetchGenerator])

  /* ── Delete ─────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await generatorService.delete(id)
      toast({ type: 'success', title: 'Generator deleted', message: `"${generator?.name}" has been removed.` })
      navigate(ROUTES.GENERATORS)
    } catch (err) {
      toast({ type: 'error', title: 'Delete failed', message: err?.response?.data?.message ?? 'Could not delete generator.' })
    } finally {
      setDeleting(false)
    }
  }

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerInline message="Loading generator details…" />
      </div>
    )
  }

  if (!generator) return null

  /* ── Derived values ─────────────────────────────────────────────── */
  const stock       = generator.stockQuantity ?? 0
  const isOutOfStock = stock === 0
  const isLowStock   = stock <= 5 && stock > 0
  const sc           = statusColor(generator.currentStatus)
  const hasImage     = !!generator.imageUrl

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .gd-container   { min-height: 100vh; background: var(--color-bg); padding: 28px 32px; font-family: 'DM Sans', 'Segoe UI', sans-serif; }
        .gd-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .gd-header-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }
        .gd-actions     { display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
        .gd-main-grid   { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start; }
        .gd-pricing     { display: flex; gap: 20px; padding: 16px; background: var(--color-surface-2); border-radius: var(--radius-lg); border: 1px solid var(--color-border); flex-wrap: wrap; }
        .gd-pricing-item{ min-width: 110px; flex: 1; }
        .gd-divider     { width: 1px; background: var(--color-border); flex-shrink: 0; }
        .gd-action-btn:hover { transform: translateY(-2px); }
        .gd-img-wrap { position: relative; }
        .gd-img-wrap:hover .gd-zoom-btn { opacity: 1 !important; }

        @media (max-width: 900px) {
          .gd-main-grid { grid-template-columns: 1fr !important; }
          .gd-pricing   { gap: 12px !important; }
          .gd-pricing-item { min-width: calc(50% - 10px) !important; flex: unset !important; width: calc(50% - 10px); }
          .gd-divider   { display: none !important; }
        }
        @media (max-width: 640px) {
          .gd-container   { padding: 14px !important; }
          .gd-page-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .gd-header-left { flex-wrap: wrap; }
          .gd-actions     { width: 100% !important; }
          .gd-actions button { flex: 1 !important; justify-content: center !important; }
          .gd-pricing     { gap: 10px !important; }
          .gd-pricing-item{ min-width: calc(50% - 8px) !important; width: calc(50% - 8px) !important; }
        }
        @media (max-width: 400px) {
          .gd-pricing-item { min-width: 100% !important; width: 100% !important; }
          .gd-actions     { flex-direction: column !important; }
          .gd-actions button { width: 100% !important; }
        }
      `}</style>

      <div className="gd-container">

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div className="gd-page-header">
          <div className="gd-header-left">
            <button
              onClick={() => navigate(ROUTES.GENERATORS)}
              style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}
            >
              <Icon.ArrowLeft />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.4px' }}>Generator Details</h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Home</a> ›{' '}
                <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS) }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Generators</a> › {generator.name}
              </p>
            </div>
          </div>

          <div className="gd-actions">
            <button
              className="gd-action-btn"
              onClick={() => navigate(ROUTES.GENERATOR_EDIT.replace(':id', generator.id))}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            >
              <Icon.Edit /> Edit Generator
            </button>
            <button
              className="gd-action-btn"
              onClick={() => setShowDelete(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'linear-gradient(135deg, var(--color-danger), #dc2626)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            >
              <Icon.Trash /> Delete
            </button>
          </div>
        </div>

        {/* ── Main Grid ────────────────────────────────────────────── */}
        <div className="gd-main-grid">

          {/* LEFT: Image */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              className="gd-img-wrap"
              onClick={() => hasImage && setLightbox(true)}
              style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', aspectRatio: '1', position: 'relative', cursor: hasImage ? 'zoom-in' : 'default' }}
            >
              <img
                src={imgSrc(generator.imageUrl)}
                alt={generator.name}
                onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
              />
              {hasImage && (
                <button
                  className="gd-zoom-btn"
                  style={{ position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0, transition: 'opacity 0.2s', boxShadow: 'var(--shadow-md)' }}
                >
                  <Icon.ZoomIn />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Generator Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Info Card */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: generator.isActive ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: generator.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: generator.isActive ? 'var(--color-success)' : 'var(--color-danger)' }} />
                  {generator.isActive ? 'Active' : 'Inactive'}
                </span>

                {generator.currentStatus && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
                    {STATUS_LABELS[generator.currentStatus] ?? generator.currentStatus}
                  </span>
                )}

                {isOutOfStock && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                    <Icon.Warning /> Out of Stock
                  </span>
                )}
                {isLowStock && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                    <Icon.Warning /> Low Stock
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', letterSpacing: '-0.4px' }}>{generator.name}</h2>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: generator.description ? 16 : 20 }}>
                <span>Code: <strong style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{generator.generatorCode}</strong></span>
                {generator.productBy && <span>Product By: <strong style={{ color: 'var(--color-text-muted)' }}>{generator.productBy}</strong></span>}
              </div>

              {generator.description && (
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, margin: '0 0 20px' }}>{generator.description}</p>
              )}

              {/* Pricing & Stock */}
              <div className="gd-pricing">
                {[
                  { label: 'Purchase Price',        value: fmt(generator.purchasePrice),        color: 'var(--color-text)' },
                  { label: 'Party Diesel Rent ₹',   value: fmt(generator.partyDieselRentPrice), color: 'var(--color-primary)' },
                  { label: 'Diesel Price(with diesel)', value: fmt(generator.withDieselRentPrice), color: 'var(--color-primary)' },
                  { label: 'Stock Qty',              value: String(stock),                       color: isOutOfStock ? 'var(--color-danger)' : isLowStock ? 'var(--color-warning)' : 'var(--color-text)' },
                ].map((item, i, arr) => (
                  <React.Fragment key={item.label}>
                    <div className="gd-pricing-item">
                      <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: item.color, letterSpacing: '-0.5px' }}>{item.value}</div>
                    </div>
                    {i < arr.length - 1 && <div className="gd-divider" />}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16, fontSize: 12, color: 'var(--color-text-subtle)', flexWrap: 'wrap' }}>
                {generator.createdAt && <span>Created: <strong style={{ color: 'var(--color-text-muted)' }}>{fmtDate(generator.createdAt)}</strong></span>}
                {generator.createdAt && generator.updatedAt && <span>•</span>}
                {generator.updatedAt && <span>Last updated: <strong style={{ color: 'var(--color-text-muted)' }}>{fmtDate(generator.updatedAt)}</strong></span>}
              </div>
            </div>

            {/* Extra Details Card */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Generator Details</h3>
              <div style={{ marginTop: 4 }}>
                <InfoRow label="Generator Code"  value={generator.generatorCode} />
                <InfoRow label="Product By"      value={generator.productBy} />
                {generator.fuelType && (
                  <InfoRow label="Fuel Type" value={FUEL_LABELS[generator.fuelType] ?? generator.fuelType} />
                )}
                {generator.ratedPowerKva && (
                  <InfoRow label="Rated Power" value={`${generator.ratedPowerKva} KVA`} />
                )}
                {generator.currentStatus && (
                  <InfoRow label="Current Status" value={STATUS_LABELS[generator.currentStatus] ?? generator.currentStatus} />
                )}
                <InfoRow label="Stock Quantity" value={String(stock)} />
                <div style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
                  <span style={{ width: 140, flexShrink: 0, fontSize: 13, color: 'var(--color-text-subtle)', fontWeight: 500 }}>Active Status</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: generator.isActive ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: generator.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: generator.isActive ? 'var(--color-success)' : 'var(--color-danger)' }} />
                    {generator.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon.X />
          </button>
          <div style={{ maxWidth: '80vw', maxHeight: '85vh' }}>
            <img
              src={imgSrc(generator.imageUrl)}
              alt={generator.name}
              onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG }}
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 'var(--radius-lg)', objectFit: 'contain', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        onConfirm={handleDelete}
        title={`Delete "${generator.name}"?`}
        message="This action is permanent. The generator and all its records will be completely removed."
        confirmLabel="Delete Generator"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
