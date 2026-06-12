import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams }                          from 'react-router-dom'
import { productService }         from '@/services/inventoryService'
import { useCategories }          from '@/hooks/useCategories'
import { useWarehouses }          from '@/hooks/useWarehouses'
import { useToast }               from '@/components/shared/toast/ToastProvider'
import SearchableSelect           from '@/components/shared/SearchableSelect'
import { SpinnerInline }          from '@/components/shared'
import defaultImg                 from '@/assets/images/default.png'
import { getImageUrl }            from '@/utils/imageUrl'


/* ── Constants ─────────────────────────────────────────────────────────── */
const MAX_IMAGES       = 8
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_B  = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES    = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTS     = 'PNG, JPG'

/* ── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  Upload:      () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  X:           () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Star:        () => <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Check:       () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertCircle: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Info:        () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  Dollar:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Box:         () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Image:       () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Settings:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

/* ══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

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

/* ── Main component ────────────────────────────────────────────────────── */
export default function ProductForm() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id
  const toast    = useToast()
  const fileRef  = useRef(null)

  /* ── Form state ───────────────────────────────────────────────── */
  const initialFormState = {
    name: '', sku: '', categoryId: null, productBy: '', description: '',
    price: '', costPrice: '', weight: '', unit: 'piece',
    hsnCode: '', gstPercent: '', isActive: true,
    warehouseId: null, stockAlert: '',
  }

  const [form, setForm] = useState(initialFormState)

  const [existingImages,  setExistingImages]  = useState([])
  const [removeImageIds,  setRemoveImageIds]  = useState([])
  const [newImageFiles,   setNewImageFiles]   = useState([])

  const { categories, loading: catLoading, error: catError } = useCategories()
  const { warehouses, loading: whLoading,  error: whError  } = useWarehouses()

  const [errors,        setErrors]        = useState({})
  const [saving,        setSaving]        = useState(false)
  const [saveAction,    setSaveAction]    = useState(null) // 'save' | 'saveNew'
  const [loadingPage,   setLoadingPage]   = useState(isEdit)
  const [dragging,      setDragging]      = useState(false)

  /* ── Surface hook errors via toast ───────────────────────────── */
  useEffect(() => {
    if (catError) toast({ type: 'warning', title: 'Could not load categories', message: catError })
  }, [catError, toast])

  useEffect(() => {
    if (whError) toast({ type: 'warning', title: 'Could not load warehouses', message: whError })
  }, [whError, toast])

  /* ── Load product (edit mode) ─────────────────────────────────── */
  const fetchProduct = useCallback(async () => {
    if (!isEdit) return
    setLoadingPage(true)
    try {
      const res = await productService.getById(id)
      const p   = res.data?.data ?? res.data
      if (!p) throw new Error('Not found')
      setForm({
        name:              p.name              ?? '',
        sku:               p.productCode       ?? '',
        categoryId:        p.categoryId        ?? null,
        productBy:         p.productBy         ?? '',
        description:       p.description       ?? '',
        price:             p.sellingPrice      != null ? String(p.sellingPrice)  : '',
        costPrice:         p.purchasePrice     != null ? String(p.purchasePrice) : '',
        weight:            p.weight            != null ? String(p.weight)        : '',
        unit:              p.unit              ?? 'piece',
        hsnCode:           p.hsnCode           ?? '',
        gstPercent:        p.gstPercent        != null ? String(p.gstPercent)    : '',
        isActive:          p.isActive          ?? true,
        warehouseId:       p.inventories?.[0]?.warehouseId       ?? null,
        stockAlert:        p.inventories?.[0]?.stockAlert        != null ? String(p.inventories[0].stockAlert) : '',
      })
      setExistingImages(p.images ?? [])
    } catch (err) {
      toast({ type: 'error', title: 'Failed to load product', message: err?.response?.data?.message ?? 'Please try again.' })
      navigate('/inventory/products')
    } finally {
      setLoadingPage(false)
    }
  }, [id, isEdit, toast, navigate])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  /* ── Field change helper ──────────────────────────────────────── */
  const field = useCallback((k, v) => {
    setForm(f  => ({ ...f,  [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }, [])

  /* ── Image helpers ────────────────────────────────────────────── */
  const totalImgCount   = existingImages.filter(i => !removeImageIds.includes(i.id)).length + newImageFiles.length
  const visibleExisting = existingImages.filter(i => !removeImageIds.includes(i.id))

  const validateFiles = (files) => {
    const results = { valid: [], errors: [] }
    Array.from(files).forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type?.toLowerCase())) {
        results.errors.push(`"${file.name}": unsupported format. Allowed: ${ALLOWED_EXTS}`)
        return
      }
      if (file.size > MAX_FILE_SIZE_B) {
        results.errors.push(`"${file.name}": exceeds ${MAX_FILE_SIZE_MB} MB limit`)
        return
      }
      results.valid.push(file)
    })
    return results
  }

  const addFiles = (files) => {
    const { valid, errors: fileErrors } = validateFiles(files)
    if (fileErrors.length) toast({ type: 'error', title: 'Some files were rejected', message: fileErrors.join(' | ') })
    const remaining = MAX_IMAGES - totalImgCount
    const toAdd     = valid.slice(0, remaining)
    if (valid.length > remaining) toast({ type: 'warning', title: `Max ${MAX_IMAGES} images allowed`, message: `${valid.length - remaining} file(s) were not added.` })
    if (!toAdd.length) return
    const newEntries = toAdd.map((file, i) => ({
      id: `new-${Date.now()}-${i}`, file,
      previewUrl: URL.createObjectURL(file), name: file.name,
    }))
    setNewImageFiles(prev => [...prev, ...newEntries])
    setErrors(e => ({ ...e, images: '' }))
  }

  const removeExistingImage = (imgId) => setRemoveImageIds(prev => [...prev, imgId])

  const removeNewImage = (tmpId) => {
    setNewImageFiles(prev => {
      const img = prev.find(i => i.id === tmpId)
      if (img) URL.revokeObjectURL(img.previewUrl)
      return prev.filter(i => i.id !== tmpId)
    })
  }

  const setPrimaryExisting = (imgId) => {
    setExistingImages(prev => prev.map(i => ({ ...i, isPrimary: i.id === imgId })))
    setNewImageFiles(prev  => prev.map(i => ({ ...i, _isPrimary: false })))
  }

  const setPrimaryNew = (tmpId) => {
    setExistingImages(prev => prev.map(i => ({ ...i, isPrimary: false })))
    setNewImageFiles(prev  => prev.map(i => ({ ...i, _isPrimary: i.id === tmpId })))
  }

  /* ── Validation ───────────────────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!form.name.trim())                                  e.name       = 'Product name is required.'
    if (!form.sku.trim())                                   e.sku        = 'SKU / product code is required.'
    if (!form.categoryId)                                   e.categoryId = 'Select a category.'
    if (!form.price)                                        e.price      = 'Selling price is required.'
    else if (isNaN(form.price) || Number(form.price) < 0)  e.price      = 'Enter a valid price.'
    if (!isEdit && totalImgCount === 0)                     e.images     = 'At least one product image is required.'
    return e
  }

  /* ── Reset form for Save & New ──────────────────────────────── */
  const resetForm = () => {
    setForm(initialFormState)
    setExistingImages([])
    setRemoveImageIds([])
    newImageFiles.forEach(img => URL.revokeObjectURL(img.previewUrl))
    setNewImageFiles([])
    setErrors({})
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Submit ───────────────────────────────────────────────────── */
  const handleSubmit = async (action) => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      // Scroll to first error
      const firstErrorKey = Object.keys(errs)[0]
      const el = document.querySelector(`[name="${firstErrorKey}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    setSaveAction(action)
    try {
      const requestData = {
        name:              form.name.trim(),
        productCode:       form.sku.trim().toUpperCase(),
        categoryId:        form.categoryId        ? Number(form.categoryId)        : null,
        productBy:         form.productBy         || null,
        unit:              form.unit              || null,
        purchasePrice:     form.costPrice         ? Number(form.costPrice)         : null,
        sellingPrice:      form.price             ? Number(form.price)             : null,
        weight:            form.weight            ? Number(form.weight)            : null,
        hsnCode:           form.hsnCode           || null,
        gstPercent:        form.gstPercent        ? Number(form.gstPercent)        : null,
        description:       form.description       || null,
        isActive:          form.isActive,
        status:            form.isActive ? 'PUBLISHED' : 'DRAFT',
        warehouseId:       form.warehouseId       ? Number(form.warehouseId)       : null,
        stockAlert:        form.stockAlert        ? Number(form.stockAlert)        : null,
        minimumStock:      form.stockAlert        ? Number(form.stockAlert)        : 0,
        ...(isEdit && { removeImageIds }),
      }
      const imageFiles = newImageFiles.map(i => i.file)
      if (isEdit) {
        await productService.update(id, requestData, imageFiles)
        toast({ type: 'success', title: 'Product updated', message: `"${form.name}" has been saved successfully.` })
      } else {
        await productService.create(requestData, imageFiles)
        toast({ type: 'success', title: 'Product created', message: `"${form.name}" has been added to inventory.` })
      }

      if (action === 'saveNew') {
        resetForm()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate('/inventory/products')
      }
    } catch (err) {
      toast({ type: 'error', title: isEdit ? 'Update failed' : 'Create failed', message: err?.response?.data?.message ?? 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
      setSaveAction(null)
    }
  }

  /* ── Derived ──────────────────────────────────────────────────── */
  const categoryOptions  = categories.map(c => ({ value: c.id, label: c.name }))
  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name + (w.code ? ` (${w.code})` : '') }))

  /* ── Loading skeleton ─────────────────────────────────────────── */
  if (loadingPage) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerInline message="Loading product…" />
      </div>
    )
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pf-container   { min-height: 100vh; background: var(--color-bg); padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
        .pf-page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        
        .pf-main-grid   { display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; align-items: start; }
        .pf-main-content{ display: flex; flex-direction: column; gap: 24px; }
        .pf-sidebar     { display: flex; flex-direction: column; gap: 24px; position: sticky; top: 24px; }
        
        .pf-card        { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, border-color 0.2s; }
        .pf-card:hover  { box-shadow: var(--shadow-md); border-color: var(--color-border-strong); }
        
        .pf-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
        .pf-card-title  { font-size: 16px; font-weight: 700; color: var(--color-text); margin: 0; }
        
        .pf-grid-2      { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .pf-full         { grid-column: 1 / -1; }
        
        .pf-input        { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); font-size: 14px; color: var(--color-text); background: var(--color-surface); outline: none; transition: all 0.2s ease; }
        .pf-input:hover:not(:focus):not(.has-error) { border-color: var(--color-border-strong); }
        .pf-input:focus  { border-color: var(--color-primary) !important; box-shadow: 0 0 0 3.5px rgba(37,99,235,0.12) !important; }
        .pf-input.has-error { border-color: var(--color-danger) !important; }
        .pf-input.has-error:focus { border-color: var(--color-danger) !important; box-shadow: 0 0 0 3.5px rgba(239,68,68,0.12) !important; }
        
        .pf-drop         { transition: all 0.2s; }
        .pf-drop:hover   { border-color: var(--color-primary) !important; background: var(--color-primary-50) !important; }
        
        .img-card        { transition: transform 0.15s; }
        .img-card:hover .img-overlay { opacity: 1 !important; }
        .img-card:hover  { transform: scale(1.03); }
        
        .pf-btn          { padding: 11px 24px; border-radius: var(--radius-md); font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; }
        .pf-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .pf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .pf-btn-primary  { background: var(--color-primary); color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .pf-btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); box-shadow: 0 6px 16px rgba(37,99,235,0.3); }
        
        .pf-btn-secondary { background: var(--color-primary-50); color: var(--color-primary); border: 1.5px solid var(--color-primary-100); }
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
          <button onClick={() => navigate('/inventory/products')}
            style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.4px' }}>
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', margin: '3px 0 0' }}>
              <a href="#" onClick={e => { e.preventDefault(); navigate('/inventory/products') }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Inventory</a> ›{' '}
              <a href="#" onClick={e => { e.preventDefault(); navigate('/inventory/products') }} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Products</a> › {isEdit ? 'Edit' : 'Add'}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TWO-COLUMN DASHBOARD LAYOUT
           ═══════════════════════════════════════════════════════════ */}
        <div className="pf-main-grid">

          {/* Left Column: Main Details */}
          <div className="pf-main-content">

            {/* Card 1: Product Information */}
            <div className="pf-card">
              <CardHeader icon={Icon.Info}>Product Information</CardHeader>
              <div className="pf-grid-2">
                {/* Product Name */}
                <div>
                  <Label req>Product Name</Label>
                  <TextField name="name" value={form.name} onChange={e => field('name', e.target.value)} hasError={!!errors.name} placeholder="Product Name-ETC.." />
                  <ErrMsg message={errors.name} />
                </div>
                
                {/* SKU */}
                <div>
                  <Label req>Sku / Product code</Label>
                  <TextField name="sku" value={form.sku} onChange={e => field('sku', e.target.value)} hasError={!!errors.sku} placeholder="HK-8565852352" />
                  <ErrMsg message={errors.sku} />
                </div>

                {/* Category */}
                <div>
                  <Label req>Category</Label>
                  <SearchableSelect
                    options={categoryOptions}
                    value={form.categoryId}
                    onChange={val => field('categoryId', val)}
                    placeholder="Select Category"
                    loading={catLoading}
                    error={errors.categoryId}
                  />
                </div>

                {/* Product By */}
                <div>
                  <Label>Product by</Label>
                  <TextField name="productBy" value={form.productBy} onChange={e => field('productBy', e.target.value)} hasError={false} placeholder="Manufacturer / Brand" />
                </div>

                {/* Weight */}
                <div>
                  <Label hint="(kg) Optional">Weight</Label>
                  <TextField name="weight" value={form.weight} onChange={e => field('weight', e.target.value)} hasError={false} placeholder="e.g. 0.5" type="number" min="0" step="0.001" />
                </div>

                {/* Unit */}
                <div>
                  <Label>Unit</Label>
                  <select value={form.unit} onChange={e => field('unit', e.target.value)} className="pf-input" style={{ width: '100%', padding: '11px 14px' }}>
                    <option value="piece">Peice</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="litre">Litre</option>
                    <option value="box">Box</option>
                    <option value="set">Set</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>

                {/* Description (full-width) */}
                <div className="pf-full">
                  <Label>Description</Label>
                  <textarea
                    value={form.description}
                    onChange={e => field('description', e.target.value)}
                    placeholder="Describe the product details, features, etc..."
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)',
                      background: 'var(--color-surface)', outline: 'none',
                      resize: 'vertical', minHeight: 120, lineHeight: 1.6,
                    }}
                    className="pf-input"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Pricing & Taxation */}
            <div className="pf-card">
              <CardHeader icon={Icon.Dollar}>Pricing &amp; Taxation</CardHeader>
              <div className="pf-grid-2">
                {/* Selling Price */}
                <div>
                  <Label req>Selling Price</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>₹</span>
                    <TextField name="price" value={form.price} onChange={e => field('price', e.target.value)} hasError={!!errors.price} placeholder="0.00" type="number" min="0" step="0.01" style={{ paddingLeft: 28 }} />
                  </div>
                  <ErrMsg message={errors.price} />
                </div>

                {/* Purchase Price */}
                <div>
                  <Label>Purchase Price</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>₹</span>
                    <TextField name="costPrice" value={form.costPrice} onChange={e => field('costPrice', e.target.value)} hasError={false} placeholder="0.00" type="number" min="0" step="0.01" style={{ paddingLeft: 28 }} />
                  </div>
                </div>

                {/* GST */}
                <div>
                  <Label hint="Optional">GST (%)</Label>
                  <TextField name="gstPercent" value={form.gstPercent} onChange={e => field('gstPercent', e.target.value)} hasError={false} placeholder="e.g. 18" type="number" min="0" max="100" step="0.01" />
                </div>

                {/* HNS Code */}
                <div>
                  <Label hint="Optional">HNS Code</Label>
                  <TextField name="hsnCode" value={form.hsnCode} onChange={e => field('hsnCode', e.target.value)} hasError={false} placeholder="e.g. 8471" />
                </div>
              </div>
            </div>

            {/* Card 3: Inventory Logistics */}
            <div className="pf-card">
              <CardHeader icon={Icon.Box}>Inventory Logistics</CardHeader>
              <div className="pf-grid-2">
                {/* Warehouse */}
                <div>
                  <Label>Select Warehouse</Label>
                  <SearchableSelect
                    options={warehouseOptions}
                    value={form.warehouseId}
                    onChange={val => field('warehouseId', val)}
                    placeholder="Select Warehouse"
                    loading={whLoading}
                  />
                </div>

                {/* Minimum Stock Alert */}
                <div>
                  <Label>Minimum Stock Alert</Label>
                  <TextField name="stockAlert" value={form.stockAlert} onChange={e => field('stockAlert', e.target.value)} hasError={false} placeholder="e.g. 10" type="number" min="0" />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sidebar (Status & Media) */}
          <div className="pf-sidebar">

            {/* Card 4: Status & Actions */}
            <div className="pf-card">
              <CardHeader icon={Icon.Settings}>Status &amp; Visibility</CardHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Active Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Product Status</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Visibility in catalogs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={form.isActive} onChange={e => field('isActive', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: 12,
                        background: form.isActive ? 'var(--color-success)' : 'var(--color-border-strong)',
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
                      : <><Icon.Check />Save Product</>
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
                        ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(37,99,235,0.4)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Saving…</>
                        : 'Save & Create New'
                      }
                    </button>
                  )}

                  <button
                    type="button"
                    className="pf-btn pf-btn-outline"
                    style={{ width: '100%' }}
                    disabled={saving}
                    onClick={() => navigate('/inventory/products')}
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Product Media */}
            <div className="pf-card">
              <CardHeader icon={Icon.Image}>Product Images</CardHeader>
              
              {totalImgCount < MAX_IMAGES && (
                <div
                  className="pf-drop"
                  style={{
                    border: `2px dashed ${dragging ? 'var(--color-primary)' : errors.images ? 'var(--color-danger)' : 'var(--color-border-strong)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '24px 16px',
                    background: dragging ? 'var(--color-primary-50)' : 'var(--color-surface)',
                    textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => fileRef.current.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
                >
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                    <Icon.Upload />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>Upload Files</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>PNG or JPG (Max {MAX_FILE_SIZE_MB}MB)</div>
                  <input ref={fileRef} type="file" multiple accept={ALLOWED_TYPES.join(',')} style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
                </div>
              )}
              <ErrMsg message={errors.images} />

              {/* Image thumbnails */}
              {(visibleExisting.length > 0 || newImageFiles.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginTop: 16 }}>
                  {visibleExisting.map(img => (
                    <div key={img.id} className="img-card" onClick={() => setPrimaryExisting(img.id)}
                      style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: img.isPrimary ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', aspectRatio: '1', cursor: 'pointer' }}>
                      <img src={getImageUrl(img.imageUrl) || defaultImg} alt="" onError={e => { e.target.onerror = null; e.target.src = defaultImg }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="img-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(37,99,235,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
                        <div style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Set Primary</div>
                      </div>
                      {img.isPrimary && (
                        <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-primary)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Icon.Star /> Primary
                        </div>
                      )}
                      <button type="button" onClick={e => { e.stopPropagation(); removeExistingImage(img.id) }}
                        style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'var(--color-danger)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon.X />
                      </button>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', padding: '2px 4px', fontSize: 9, color: '#fff', textAlign: 'center' }}>Saved</div>
                    </div>
                  ))}
                  {newImageFiles.map(img => (
                    <div key={img.id} className="img-card" onClick={() => setPrimaryNew(img.id)}
                      style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: img._isPrimary ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', aspectRatio: '1', cursor: 'pointer' }}>
                      <img src={img.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="img-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(37,99,235,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
                        <div style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Set Primary</div>
                      </div>
                      {img._isPrimary && (
                        <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-primary)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Icon.Star /> Primary
                        </div>
                      )}
                      <button type="button" onClick={e => { e.stopPropagation(); removeNewImage(img.id) }}
                        style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'var(--color-danger)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon.X />
                      </button>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', padding: '2px 4px', fontSize: 9, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {img.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </>
  )
}