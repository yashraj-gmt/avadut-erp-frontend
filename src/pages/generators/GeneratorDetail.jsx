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
  Fuel:      () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"   viewBox="0 0 24 24"><path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>,
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
const fmt     = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'
const imgSrc  = (url) => getImageUrl(url) || DEFAULT_IMG
const fmtDate = (dt) => formatToDMY(dt)

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
  const stock        = generator.stockQuantity ?? 0
  const underService = generator.underServiceQuantity || 0
  const bookable     = generator.effectiveStock ?? (stock - underService)
  const isOutOfStock = stock === 0
  const isLowStock   = stock <= 5 && stock > 0
  const sc           = statusColor(generator.currentStatus)
  const hasImage     = !!generator.imageUrl

  const metricCards = [
    {
      label: 'Party Diesel Rent',
      value: fmt(generator.partyDieselRentPrice),
      color: 'var(--color-primary)',
    },
    {
      label: 'With Diesel Price',
      value: fmt(generator.withDieselRentPrice),
      color: 'var(--color-primary)',
    },
    {
      label: 'Total Stock',
      value: `${stock} Units`,
      color: 'var(--color-text)',
    },
    {
      label: 'Bookable Stock',
      value: `${bookable} Units`,
      color: bookable === 0 ? 'var(--color-danger)' : '#059669',
    },
    {
      label: 'Under Service',
      value: `${underService} Units`,
      color: underService > 0 ? '#d97706' : 'var(--color-text-muted)',
    },
  ]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .gd-container {
          min-height: 100vh;
          background: var(--color-bg);
          padding: 24px 32px 48px;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          max-width: 100%;
          overflow-x: hidden;
        }

        .gd-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .gd-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }
        .gd-back-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .gd-back-btn:hover {
          background: var(--color-surface-2);
          color: var(--color-text);
        }
        .gd-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .gd-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: inherit;
        }
        .gd-action-btn:hover {
          transform: translateY(-1px);
        }

        /* ── Unified Details Card ── */
        .gd-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          padding: 28px;
          width: 100%;
        }

        /* Top Hero section: Image + Details */
        .gd-hero {
          display: flex;
          gap: 26px;
          align-items: flex-start;
          margin-bottom: 28px;
        }

        /* Image frame - compact and clean */
        .gd-img-wrap {
          width: 220px;
          height: 220px;
          flex-shrink: 0;
          background: var(--color-surface-2);
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--color-border);
          overflow: hidden;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .gd-img-wrap:hover .gd-zoom-btn {
          opacity: 1 !important;
        }
        .gd-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gd-zoom-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.92);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          opacity: 0;
          transition: opacity 0.2s;
          box-shadow: var(--shadow-md);
        }

        /* Info pane */
        .gd-info-pane {
          flex: 1;
          min-width: 0;
        }
        .gd-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .gd-title {
          font-size: clamp(24px, 3.5vw, 30px);
          font-weight: 800;
          color: var(--color-text);
          margin: 0 0 12px;
          letter-spacing: -0.5px;
          line-height: 1.2;
          word-break: break-word;
        }

        /* Specs row */
        .gd-specs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }
        .gd-spec-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 13.5px;
          color: var(--color-text);
        }
        .gd-spec-label {
          color: var(--color-text-subtle);
          font-weight: 500;
        }
        .gd-spec-val {
          font-weight: 700;
        }

        .gd-desc {
          font-size: 14.5px;
          color: var(--color-text-muted);
          line-height: 1.65;
          margin: 0;
          word-break: break-word;
        }

        /* Divider */
        .gd-section-divider {
          height: 1px;
          background: var(--color-border);
          margin: 24px 0;
        }

        /* Operational Metrics Section */
        .gd-metrics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .gd-metrics-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-subtle);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin: 0;
        }

        /* Metrics Grid */
        .gd-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          width: 100%;
        }
        .gd-metric-card {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.15s;
        }
        .gd-metric-card:hover {
          border-color: var(--color-border-strong);
        }
        .gd-metric-label {
          font-size: 11px;
          color: var(--color-text-subtle);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gd-metric-value {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.4px;
          line-height: 1.2;
          word-break: break-word;
        }

        /* Timestamps footer */
        .gd-timestamps {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
          font-size: 12px;
          color: var(--color-text-subtle);
          flex-wrap: wrap;
        }

        /* ── Responsive breakpoints ── */
        @media (max-width: 860px) {
          .gd-hero {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 20px;
          }
          .gd-img-wrap {
            width: 200px;
            height: 200px;
            margin: 0 auto;
          }
          .gd-info-pane {
            width: 100%;
          }
          .gd-badges {
            justify-content: center;
          }
          .gd-specs-row {
            justify-content: center;
          }
          .gd-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .gd-container {
            padding: 14px 12px 32px !important;
          }
          .gd-card {
            padding: 18px 16px;
          }
          .gd-page-header {
            flex-direction: column !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .gd-header-left {
            flex: none !important;
            width: 100% !important;
          }
          .gd-actions {
            width: 100% !important;
          }
          .gd-actions .gd-action-btn {
            flex: 1 1 calc(50% - 6px);
            justify-content: center !important;
          }
          .gd-metric-card {
            padding: 12px 14px;
          }
          .gd-metric-value {
            font-size: 20px;
          }
          .gd-metric-label {
            font-size: 10px;
          }
        }

        @media (max-width: 380px) {
          .gd-page-header {
            gap: 10px !important;
            margin-bottom: 14px !important;
          }
          .gd-actions {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .gd-actions .gd-action-btn {
            width: 100% !important;
          }
          .gd-metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="gd-container">

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div className="gd-page-header">
          <div className="gd-header-left">
            <button
              onClick={() => navigate(ROUTES.GENERATORS)}
              className="gd-back-btn"
              title="Back to Generators"
            >
              <Icon.ArrowLeft />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.4px' }}>
                Generator Details
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Home</a> ›{' '}
                <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS) }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  Generators
                </a> › {generator.name}
              </p>
            </div>
          </div>

          <div className="gd-actions">
            <button
              className="gd-action-btn"
              onClick={() => navigate(ROUTES.GENERATOR_EDIT.replace(':id', generator.id))}
              style={{
                border: '1.5px solid var(--color-primary)',
                background: 'var(--color-surface)',
                color: 'var(--color-primary)',
              }}
            >
              <Icon.Edit /> Edit Generator
            </button>
            <button
              className="gd-action-btn"
              onClick={() => setShowDelete(true)}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-danger), #dc2626)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
              }}
            >
              <Icon.Trash /> Delete
            </button>
          </div>
        </div>

        {/* ── Main Unified Details Card ────────────────────────────── */}
        <div className="gd-card">

          {/* Top Hero Section */}
          <div className="gd-hero">

            {/* Left: Compact Image */}
            <div
              className="gd-img-wrap"
              onClick={() => hasImage && setLightbox(true)}
              style={{ cursor: hasImage ? 'zoom-in' : 'default' }}
            >
              <img
                src={imgSrc(generator.imageUrl)}
                alt={generator.name}
                className="gd-img"
                onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG }}
              />
              {hasImage && (
                <button className="gd-zoom-btn" title="View Full Size">
                  <Icon.ZoomIn />
                </button>
              )}
            </div>

            {/* Right: Primary Info */}
            <div className="gd-info-pane">

              {/* Status Badges */}
              <div className="gd-badges">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: generator.isActive ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                  color: generator.isActive ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: generator.isActive ? 'var(--color-success)' : 'var(--color-danger)' }} />
                  {generator.isActive ? 'Active' : 'Inactive'}
                </span>

                {generator.currentStatus && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: sc.bg, color: sc.color,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
                    {STATUS_LABELS[generator.currentStatus] ?? generator.currentStatus}
                  </span>
                )}

                {isOutOfStock && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: 'var(--color-danger-light)', color: 'var(--color-danger)',
                  }}>
                    <Icon.Warning /> Out of Stock
                  </span>
                )}

                {isLowStock && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: 'var(--color-warning-light)', color: 'var(--color-warning)',
                  }}>
                    <Icon.Warning /> Low Stock
                  </span>
                )}

                {underService > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: '#fef9c3', color: '#854d0e',
                  }}>
                    ⚠️ {underService} Under Service
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="gd-title">{generator.name}</h2>

              {/* Specifications Pills */}
              <div className="gd-specs-row">
                {generator.fuelType && (
                  <span className="gd-spec-pill">
                    <Icon.Fuel />
                    <span className="gd-spec-val">{FUEL_LABELS[generator.fuelType] ?? generator.fuelType}</span>
                  </span>
                )}

                {generator.ratedPowerKva && (
                  <span className="gd-spec-pill">
                    <Icon.Zap />
                    <span className="gd-spec-val">{generator.ratedPowerKva} KVA</span>
                  </span>
                )}
              </div>

              {/* Description */}
              {generator.description && (
                <p className="gd-desc">{generator.description}</p>
              )}
            </div>
          </div>

          <div className="gd-section-divider" />

          {/* Operational Metrics & Pricing */}
          <div className="gd-metrics-header">
            <h3 className="gd-metrics-title">Operational & Pricing Metrics</h3>
          </div>

          <div className="gd-metrics-grid">
            {metricCards.map((item) => (
              <div key={item.label} className="gd-metric-card">
                <span className="gd-metric-label">{item.label}</span>
                <span className="gd-metric-value" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Timestamps */}
          {(generator.createdAt || generator.updatedAt) && (
            <div className="gd-timestamps">
              {generator.createdAt && (
                <span>
                  Created: <strong style={{ color: 'var(--color-text-muted)' }}>{fmtDate(generator.createdAt)}</strong>
                </span>
              )}
              {generator.createdAt && generator.updatedAt && <span>•</span>}
              {generator.updatedAt && (
                <span>
                  Last updated: <strong style={{ color: 'var(--color-text-muted)' }}>{fmtDate(generator.updatedAt)}</strong>
                </span>
              )}
            </div>
          )}

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
