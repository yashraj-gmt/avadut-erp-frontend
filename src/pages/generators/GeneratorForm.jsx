import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams }                          from 'react-router-dom'
import { generatorService }        from '@/services/generatorService'
import { useToast }                from '@/components/shared/toast/ToastProvider'
import { SpinnerInline }           from '@/components/shared'

/* ── Constants ─────────────────────────────────────────────────────────── */
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_B  = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES    = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

/* ── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  Check:       () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertCircle: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Info:        () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  Dollar:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Zap:         () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Image:       () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Upload:      () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  X:           () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Settings:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

/* ── Subcomponents ────────────────────────────────────────────────────── */
function Label({ children, req, hint }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
      {children}{' '}
      {req  && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      {hint && <span style={{ fontWeight: 400, color: 'var(--color-text-subtle)', fontSize: 11, marginLeft: 4 }}>{hint}</span>}
    </label>
  )
}

function TextField({ name, value, onChange, hasError, style: extraStyle, ...props }) {
  return (
    <input
      {...props}
      name={name}
      value={value}
      onChange={onChange}
      className={`pf-input ${hasError ? 'has-error' : ''}`}
      style={{
        width: '100%', padding: '11px 14px',
        borderColor: hasError ? 'var(--color-danger)' : undefined,
        ...extraStyle,
      }}
    />
  )
}

function ErrMsg({ message }) {
  if (!message) return null
  return (
    <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon.AlertCircle />{message}
    </div>
  )
}

function CardHeader({ icon: IconComponent, children }) {
  return (
    <div className="pf-card-header">
      {IconComponent && <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}><IconComponent /></span>}
      <h3 className="pf-card-title">{children}</h3>
    </div>
  )
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function GeneratorForm() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id
  const toast    = useToast()
  const fileRef  = useRef(null)

  /* ── Form State ────────────────────────────────── */
  const initialFormState = {
    name: '',
    generatorCode: '',
    purchasePrice: '',
    partyDieselRentPrice: '',
    withDieselRentPrice: '',
    stockQuantity: '0',
    productBy: '',
    description: '',
    isActive: true,
  }

  const [form, setForm]           = useState(initialFormState)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const [saveAction, setSaveAction] = useState(null)
  const [loadingPage, setLoadingPage] = useState(isEdit)

  // Image preview state (for new uploads that aren't saved yet)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile]       = useState(null)
  const [dragging, setDragging]         = useState(false)

  /* ── Load Generator (Edit Mode) ────────────────────────────────── */
  const fetchGenerator = useCallback(async () => {
    if (!isEdit) return
    setLoadingPage(true)
    try {
      const res = await generatorService.getById(id)
      const g   = res.data?.data ?? res.data
      if (!g) throw new Error('Not found')
      setForm({
        name:          g.name          ?? '',
        generatorCode: g.generatorCode ?? '',
        purchasePrice:        g.purchasePrice           != null ? String(g.purchasePrice)           : '',
        partyDieselRentPrice: g.partyDieselRentPrice     != null ? String(g.partyDieselRentPrice)     : '',
        withDieselRentPrice:  g.withDieselRentPrice      != null ? String(g.withDieselRentPrice)      : '',
        stockQuantity: g.stockQuantity != null ? String(g.stockQuantity) : '0',
        productBy:     g.productBy     ?? '',
        description:   g.description   ?? '',
        isActive:      g.isActive      ?? true,
      })
      // Show existing image for edit mode (server returns public URL)
      if (g.imageUrl) {
        setImagePreview(g.imageUrl)
      }
    } catch (err) {
      toast({ type: 'error', title: 'Failed to load generator', message: err?.response?.data?.message ?? 'Please try again.' })
      navigate('/generators')
    } finally {
      setLoadingPage(false)
    }
  }, [id, isEdit, toast, navigate])

  useEffect(() => { fetchGenerator() }, [fetchGenerator])

  /* ── Field Change Helper ───────────────────────────────────────── */
  const field = useCallback((k, v) => {
    setForm(f  => ({ ...f,  [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }, [])

  /* ── Image Handling ─────────────────────────────────────────────── */
  const handleImageSelect = (files) => {
    const file = files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type?.toLowerCase())) {
      toast({ type: 'error', title: 'Unsupported format', message: 'Please upload a PNG or JPG image.' })
      return
    }
    if (file.size > MAX_FILE_SIZE_B) {
      toast({ type: 'error', title: 'File too large', message: `Max size is ${MAX_FILE_SIZE_MB}MB.` })
      return
    }
    // Revoke old preview blob URL only (not server URLs)
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Validation ────────────────────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!form.name.trim())                                      e.name          = 'Generator name is required.'
    else if (form.name.trim().length < 2)                       e.name          = 'Name must be at least 2 characters.'
    // if (!form.generatorCode.trim())                             e.generatorCode = 'Generator code is required.'
    if (form.purchasePrice && (isNaN(form.purchasePrice) || Number(form.purchasePrice) < 0))
                                                                e.purchasePrice = 'Enter a valid price.'
    if (form.partyDieselRentPrice && (isNaN(form.partyDieselRentPrice) || Number(form.partyDieselRentPrice) < 0))
                                                                e.partyDieselRentPrice = 'Enter a valid party diesel rent price.'
    if (form.withDieselRentPrice && (isNaN(form.withDieselRentPrice) || Number(form.withDieselRentPrice) < 0))
                                                                e.withDieselRentPrice  = 'Enter a valid with diesel rent price.'
    if (form.stockQuantity && (isNaN(form.stockQuantity) || Number(form.stockQuantity) < 0))
                                                                e.stockQuantity = 'Enter a valid quantity.'
    return e
  }

  /* ── Reset Form ────────────────────────────────────────────────── */
  const resetForm = () => {
    setForm(initialFormState)
    setErrors({})
    if (imagePreview && !imagePreview.startsWith('http')) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Submit ────────────────────────────────────────────────────── */
  const handleSubmit = async (action) => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      const firstErrorKey = Object.keys(errs)[0]
      const el = document.querySelector(`[name="${firstErrorKey}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    setSaveAction(action)
    try {
      const payload = {
        name:          form.name.trim(),
        generatorCode: form.generatorCode.trim() ? form.generatorCode.trim().toUpperCase() : null,
        purchasePrice:        form.purchasePrice        ? Number(form.purchasePrice)        : null,
        partyDieselRentPrice: form.partyDieselRentPrice ? Number(form.partyDieselRentPrice) : null,
        withDieselRentPrice:  form.withDieselRentPrice  ? Number(form.withDieselRentPrice)  : null,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : 0,
        productBy:     form.productBy.trim() || null,
        description:   form.description.trim() || null,
        isActive:      form.isActive,
      }

      if (isEdit) {
        await generatorService.update(id, payload, imageFile ?? undefined)
        toast({ type: 'success', title: 'Generator updated', message: `"${form.name}" has been saved successfully.` })
      } else {
        await generatorService.create(payload, imageFile ?? undefined)
        toast({ type: 'success', title: 'Generator created', message: `"${form.name}" has been added.` })
      }

      if (action === 'saveNew') {
        resetForm()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate('/generators')
      }
    } catch (err) {
      toast({ type: 'error', title: isEdit ? 'Update failed' : 'Create failed', message: err?.response?.data?.message ?? 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
      setSaveAction(null)
    }
  }

  if (loadingPage) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerInline message="Loading generator…" />
      </div>
    )
  }

  // displayImage: show new file blob preview, or existing image URL from edit mode
  const displayImage = imagePreview || null

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pf-container   { min-height: 100vh; background: var(--color-bg); padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
        .pf-page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        
        .pf-main-grid   { display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; align-items: start; }
        .pf-main-content{ display: flex; flex-direction: column; gap: 24px; }
        .pf-sidebar     { display: flex; flex-direction: column; gap: 24px; position: sticky; top: 24px; }
        
        .pf-card        { background: transparent; border: none; border-radius: 0; padding: 12px 0 24px 0; box-shadow: none; }
        .pf-card:hover  { box-shadow: none; border-color: transparent; }
        
        .pf-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
        .pf-card-title  { font-size: 16px; font-weight: 700; color: var(--color-text); margin: 0; }
        
        .pf-grid-2      { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .pf-full         { grid-column: 1 / -1; }
        
        .pf-input        { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); font-size: 14px; color: var(--color-text); background: var(--color-surface); outline: none; transition: all 0.2s ease; }
        .pf-input:hover:not(:focus):not(.has-error) { border-color: var(--color-border-strong); }
        .pf-input:focus  { border-color: var(--color-primary) !important; box-shadow: 0 0 0 3.5px rgba(37,99,235,0.15) !important; }
        .pf-input.has-error { border-color: var(--color-primary) !important; }
        .pf-input.has-error:focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 3.5px rgba(37,99,235,0.12) !important; }
        
        .pf-drop { transition: all 0.2s; }
        .pf-drop:hover { border-color: var(--color-primary) !important; background: var(--color-primary-50) !important; }

        .pf-btn          { padding: 11px 24px; border-radius: var(--radius-md); font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; }
        .pf-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .pf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .pf-btn-primary  { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .pf-btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); box-shadow: 0 6px 16px rgba(37,99,235,0.3); }
        
        .pf-btn-secondary { background: var(--color-primary-50); color: var(--color-primary-dark); border: 1.5px solid var(--color-primary-100); }
        .pf-btn-secondary:hover:not(:disabled) { background: var(--color-primary-100); }
        
        .pf-btn-outline  { background: transparent; color: var(--color-text-muted); border: 1.5px solid var(--color-border); }
        .pf-btn-outline:hover:not(:disabled) { background: var(--color-surface-2); color: var(--color-text); border-color: var(--color-border-strong); }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 1024px) {
          .pf-main-grid { grid-template-columns: 1fr !important; }
          .pf-sidebar { position: relative !important; top: 0 !important; }
        }
        @media (max-width: 640px) {
          .pf-container { padding: 16px !important; }
          .pf-page-header { margin-bottom: 20px !important; }
          .pf-grid-2 { grid-template-columns: 1fr !important; }
          .pf-full { grid-column: 1 !important; }
        }
      `}</style>

      <div className="pf-container">
        {/* Page Header */}
        <div className="pf-page-header">
          <button onClick={() => navigate('/generators')}
            style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.4px' }}>
              {isEdit ? 'Edit Generator' : 'Add New Generator'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', margin: '3px 0 0' }}>
              <a href="#" onClick={e => { e.preventDefault(); navigate('/generators') }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Generators</a> › {isEdit ? 'Edit' : 'Add'}
            </p>
          </div>
        </div>

        {/* Dashboard Layout */}
        <div className="pf-main-grid">
          {/* Left Column: Form Details */}
          <div className="pf-main-content">
            
            {/* Card 1: Basic Information */}
            <div className="pf-card">
              <CardHeader icon={Icon.Info}>Generator Information</CardHeader>
              <div className="pf-grid-2">
                <div>
                  <Label req>Generator Name</Label>
                  <TextField name="name" value={form.name} onChange={e => field('name', e.target.value)} hasError={!!errors.name} placeholder="e.g. Caterpillar 500kVA" />
                  <ErrMsg message={errors.name} />
                </div>
                <div>
                  <Label>Generator Code (SKU)</Label>
                  <TextField name="generatorCode" value={form.generatorCode} onChange={e => field('generatorCode', e.target.value)} hasError={!!errors.generatorCode} placeholder="e.g. GEN-001" disabled={isEdit} />
                  <ErrMsg message={errors.generatorCode} />
                </div>
                <div>
                  <Label>Product By</Label>
                  <TextField name="productBy" value={form.productBy} onChange={e => field('productBy', e.target.value)} placeholder="Manufacturer / Brand" />
                </div>
                <div className="pf-full">
                  <Label>Remarks</Label>
                  <textarea
                    value={form.description}
                    onChange={e => field('description', e.target.value)}
                    placeholder="Describe the generator details, specs, usage..."
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)',
                      background: 'var(--color-surface)', outline: 'none',
                      resize: 'vertical', minHeight: 100, lineHeight: 1.6,
                    }}
                    className="pf-input"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Pricing & Stock */}
            <div className="pf-card">
              <CardHeader icon={Icon.Dollar}>Pricing &amp; Stock</CardHeader>
              <div className="pf-grid-2">
                <div>
                  <Label>Purchase Price</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>₹</span>
                    <TextField name="purchasePrice" value={form.purchasePrice} onChange={e => field('purchasePrice', e.target.value)} hasError={!!errors.purchasePrice} placeholder="0.00" type="number" min="0" step="0.01" style={{ paddingLeft: 28 }} />
                  </div>
                  <ErrMsg message={errors.purchasePrice} />
                </div>
                <div>
                  <Label>Rent Price (Per day)</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>₹</span>
                    <TextField name="partyDieselRentPrice" value={form.partyDieselRentPrice} onChange={e => field('partyDieselRentPrice', e.target.value)} hasError={!!errors.partyDieselRentPrice} placeholder="0.00" type="number" min="0" step="0.01" style={{ paddingLeft: 28 }} />
                  </div>
                  <ErrMsg message={errors.partyDieselRentPrice} />
                </div>
                <div>
                  <Label>Diesel Price (Per Hour)</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>₹</span>
                    <TextField name="withDieselRentPrice" value={form.withDieselRentPrice} onChange={e => field('withDieselRentPrice', e.target.value)} hasError={!!errors.withDieselRentPrice} placeholder="0.00" type="number" min="0" step="0.01" style={{ paddingLeft: 28 }} />
                  </div>
                  <ErrMsg message={errors.withDieselRentPrice} />
                </div>
                <div className="pf-full">
                  <Label>Stock Quantity (Unit)</Label>
                  <TextField name="stockQuantity" value={form.stockQuantity} onChange={e => field('stockQuantity', e.target.value)} hasError={!!errors.stockQuantity} placeholder="0" type="number" min="0" />
                  <ErrMsg message={errors.stockQuantity} />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sidebar (Status & Image) */}
          <div className="pf-sidebar">

            {/* Status Card */}
            <div className="pf-card">
              <CardHeader icon={Icon.Settings}>Status &amp; Visibility</CardHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Active Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Generator Status</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Active / Inactive</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={form.isActive} onChange={e => field('isActive', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: 12,
                        background: form.isActive ? 'var(--color-primary)' : 'var(--color-border-strong)',
                        transition: 'background 0.2s',
                      }} />
                      <span style={{
                        position: 'absolute', top: 3, left: form.isActive ? 23 : 3,
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        boxShadow: 'var(--shadow-sm)', transition: 'left 0.2s',
                      }} />
                    </label>
                  </div>
                </div>

                {/* Button actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    className="pf-btn pf-btn-primary"
                    style={{ width: '100%' }}
                    disabled={saving}
                    onClick={() => handleSubmit('save')}
                  >
                    {saving && saveAction === 'save'
                      ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Saving…</>
                      : <><Icon.Check />Save Generator</>
                    }
                  </button>

                  {!isEdit && (
                    <button
                      type="button"
                      className="pf-btn pf-btn-secondary"
                      style={{ width: '100%' }}
                      disabled={saving}
                      onClick={() => handleSubmit('saveNew')}
                    >
                      {saving && saveAction === 'saveNew'
                        ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.4)', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Saving…</>
                        : 'Save & Create New'
                      }
                    </button>
                  )}

                  <button
                    type="button"
                    className="pf-btn pf-btn-outline"
                    style={{ width: '100%' }}
                    disabled={saving}
                    onClick={() => navigate('/generators')}
                  >
                    Discard Changes
                  </button>
                </div>

              </div>
            </div>

            {/* Generator Image Card */}
            <div className="pf-card">
              <CardHeader icon={Icon.Image}>Generator Image</CardHeader>

              {/* Image preview */}
              {displayImage ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', marginBottom: 12 }}>
                  <img
                    src={displayImage}
                    alt="Generator"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--color-danger)', border: 'none',
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon.X />
                  </button>
                </div>
              ) : (
                <div
                  className="pf-drop"
                  style={{
                    border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '24px 16px',
                    background: dragging ? 'var(--color-primary-50)' : 'var(--color-surface)',
                    textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleImageSelect(e.dataTransfer.files) }}
                >
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                    <Icon.Upload />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>Upload Image</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>PNG or JPG (Max {MAX_FILE_SIZE_MB}MB)</div>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                style={{ display: 'none' }}
                onChange={e => { handleImageSelect(e.target.files); e.target.value = '' }}
              />
            </div>

          </div>

        </div>
      </div>
    </>
  )
}
