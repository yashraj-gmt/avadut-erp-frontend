import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams }                          from 'react-router-dom'
import { generatorService }        from '@/services/generatorService'
import { useToast }                from '@/components/shared/toast/ToastProvider'
import { SpinnerInline }           from '@/components/shared'

/* ── Constants ─────────────────────────────────────────────────────────── */
const FUEL_TYPES    = ["DIESEL", "PETROL", "GAS", "DUAL_FUEL"];
const STATUS_OPTS   = ["AVAILABLE", "RENTED", "MAINTENANCE", "DECOMMISSIONED"];
const CONDITION_OPTS = ["NEW", "GOOD", "FAIR", "NEEDS_REPAIR"];

const FUEL_LABELS      = { DIESEL: "Diesel", PETROL: "Petrol", GAS: "Gas", DUAL_FUEL: "Dual Fuel" };
const STATUS_LABELS    = { AVAILABLE: "Available", RENTED: "Rented", MAINTENANCE: "Maintenance", DECOMMISSIONED: "Decommissioned" };
const CONDITION_LABELS = { NEW: "New", GOOD: "Good", FAIR: "Fair", NEEDS_REPAIR: "Needs Repair" };

/* ── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  Check:       () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertCircle: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Info:        () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  Dollar:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Zap:         () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Location:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Wrench:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
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
      {IconComponent && <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center' }}><IconComponent /></span>}
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

  /* ── Form State ────────────────────────────────────────────────── */
  const initialFormState = {
    name: "",
    generatorCode: "",
    brand: "",
    model: "",
    serialNumber: "",
    fuelType: "",
    ratedPowerKva: "",
    ratedPowerKw: "",
    voltage: "",
    frequency: "",
    purchaseDate: "",
    purchasePrice: "",
    rentPricePerDay: "",
    currentStatus: "AVAILABLE",
    condition: "",
    location: "",
    hoursRun: "",
    lastServiceDate: "",
    nextServiceDue: "",
    description: "",
    isActive: true,
  }

  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveAction, setSaveAction] = useState(null) // 'save' | 'saveNew'
  const [loadingPage, setLoadingPage] = useState(isEdit)

  /* ── Load Generator (Edit Mode) ────────────────────────────────── */
  const fetchGenerator = useCallback(async () => {
    if (!isEdit) return
    setLoadingPage(true)
    try {
      const res = await generatorService.getById(id)
      const g   = res.data?.data ?? res.data
      if (!g) throw new Error('Not found')
      setForm({
        name:            g.name            ?? "",
        generatorCode:   g.generatorCode   ?? "",
        brand:           g.brand           ?? "",
        model:           g.model           ?? "",
        serialNumber:    g.serialNumber    ?? "",
        fuelType:        g.fuelType        ?? "",
        ratedPowerKva:   g.ratedPowerKva   != null ? String(g.ratedPowerKva)   : "",
        ratedPowerKw:    g.ratedPowerKw    != null ? String(g.ratedPowerKw)    : "",
        voltage:         g.voltage         != null ? String(g.voltage)         : "",
        frequency:       g.frequency       != null ? String(g.frequency)       : "",
        purchaseDate:    g.purchaseDate    ?? "",
        purchasePrice:   g.purchasePrice   != null ? String(g.purchasePrice)   : "",
        rentPricePerDay: g.rentPricePerDay != null ? String(g.rentPricePerDay) : "",
        currentStatus:   g.currentStatus   ?? "AVAILABLE",
        condition:       g.condition       ?? "",
        location:        g.location        ?? "",
        hoursRun:        g.hoursRun        != null ? String(g.hoursRun)        : "",
        lastServiceDate: g.lastServiceDate ?? "",
        nextServiceDue:  g.nextServiceDue  ?? "",
        description:     g.description     ?? "",
        isActive:        g.isActive        ?? true,
      })
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

  /* ── Validation ────────────────────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!form.name.trim())                                e.name = 'Generator name is required.'
    else if (form.name.trim().length < 2)                 e.name = 'Name must be at least 2 characters.'
    if (!form.generatorCode.trim())                       e.generatorCode = 'Generator code is required.'
    if (form.ratedPowerKva && (isNaN(form.ratedPowerKva) || Number(form.ratedPowerKva) < 0)) e.ratedPowerKva = 'Enter a valid power.'
    if (form.ratedPowerKw && (isNaN(form.ratedPowerKw) || Number(form.ratedPowerKw) < 0))   e.ratedPowerKw = 'Enter a valid power.'
    if (form.voltage && (isNaN(form.voltage) || Number(form.voltage) < 0))                 e.voltage = 'Enter a valid voltage.'
    if (form.frequency && (isNaN(form.frequency) || Number(form.frequency) < 0))             e.frequency = 'Enter a valid frequency.'
    if (form.purchasePrice && (isNaN(form.purchasePrice) || Number(form.purchasePrice) < 0)) e.purchasePrice = 'Enter a valid price.'
    if (form.rentPricePerDay && (isNaN(form.rentPricePerDay) || Number(form.rentPricePerDay) < 0)) e.rentPricePerDay = 'Enter a valid rent price.'
    if (form.hoursRun && (isNaN(form.hoursRun) || Number(form.hoursRun) < 0))               e.hoursRun = 'Enter valid hours.'
    return e
  }

  /* ── Reset Form ────────────────────────────────────────────────── */
  const resetForm = () => {
    setForm(initialFormState)
    setErrors({})
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
        name:            form.name.trim(),
        generatorCode:   form.generatorCode.trim().toUpperCase(),
        brand:           form.brand.trim() || null,
        model:           form.model.trim() || null,
        serialNumber:    form.serialNumber.trim() || null,
        fuelType:        form.fuelType || null,
        ratedPowerKva:   form.ratedPowerKva ? Number(form.ratedPowerKva) : null,
        ratedPowerKw:    form.ratedPowerKw  ? Number(form.ratedPowerKw)  : null,
        voltage:         form.voltage       ? Number(form.voltage)       : null,
        frequency:       form.frequency     ? Number(form.frequency)     : null,
        purchaseDate:    form.purchaseDate  || null,
        purchasePrice:   form.purchasePrice ? Number(form.purchasePrice) : null,
        rentPricePerDay: form.rentPricePerDay ? Number(form.rentPricePerDay) : null,
        currentStatus:   form.currentStatus || "AVAILABLE",
        condition:       form.condition || null,
        location:        form.location.trim() || null,
        hoursRun:        form.hoursRun ? Number(form.hoursRun) : null,
        lastServiceDate: form.lastServiceDate || null,
        nextServiceDue:  form.nextServiceDue  || null,
        description:     form.description.trim() || null,
        isActive:        form.isActive,
      }

      if (isEdit) {
        await generatorService.update(id, payload)
        toast({ type: 'success', title: 'Generator updated', message: `"${form.name}" has been saved successfully.` })
      } else {
        await generatorService.create(payload)
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
        .pf-input:focus  { border-color: #ef4444 !important; box-shadow: 0 0 0 3.5px rgba(239,68,68,0.15) !important; }
        .pf-input.has-error { border-color: var(--color-danger) !important; }
        .pf-input.has-error:focus { border-color: var(--color-danger) !important; box-shadow: 0 0 0 3.5px rgba(239,68,68,0.12) !important; }
        
        .pf-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%2394a3b8' stroke-width='1.5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 32px; }

        .pf-btn          { padding: 11px 24px; border-radius: var(--radius-md); font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; }
        .pf-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .pf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .pf-btn-primary  { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; box-shadow: 0 4px 12px rgba(239,68,68,0.2); }
        .pf-btn-primary:hover:not(:disabled) { background: #dc2626; box-shadow: 0 6px 16px rgba(239,68,68,0.3); }
        
        .pf-btn-secondary { background: #fee2e2; color: #991b1b; border: 1.5px solid #fecaca; }
        .pf-btn-secondary:hover:not(:disabled) { background: #fecaca; }
        
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
              <a href="#" onClick={e => { e.preventDefault(); navigate('/generators') }} style={{ color: '#ef4444', textDecoration: 'none' }}>Generators</a> › {isEdit ? 'Edit' : 'Add'}
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
                  <Label req>Generator Code</Label>
                  <TextField name="generatorCode" value={form.generatorCode} onChange={e => field('generatorCode', e.target.value)} hasError={!!errors.generatorCode} placeholder="e.g. GEN-001" disabled={isEdit} />
                  <ErrMsg message={errors.generatorCode} />
                </div>
                <div>
                  <Label>Brand</Label>
                  <TextField name="brand" value={form.brand} onChange={e => field('brand', e.target.value)} placeholder="e.g. Caterpillar" />
                </div>
                <div>
                  <Label>Model</Label>
                  <TextField name="model" value={form.model} onChange={e => field('model', e.target.value)} placeholder="e.g. C15 ACERT" />
                </div>
                <div className="pf-full">
                  <Label>Serial Number</Label>
                  <TextField name="serialNumber" value={form.serialNumber} onChange={e => field('serialNumber', e.target.value)} placeholder="e.g. SN-987654321" />
                </div>
                <div className="pf-full">
                  <Label>Description</Label>
                  <textarea
                    value={form.description}
                    onChange={e => field('description', e.target.value)}
                    placeholder="Describe the generator specs, usage parameters, history..."
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

            {/* Card 2: Technical Specifications */}
            <div className="pf-card">
              <CardHeader icon={Icon.Zap}>Technical Specifications</CardHeader>
              <div className="pf-grid-2">
                <div>
                  <Label>Fuel Type</Label>
                  <select
                    value={form.fuelType}
                    onChange={e => field('fuelType', e.target.value)}
                    className="pf-input pf-select"
                    style={{ width: '100%', padding: '11px 14px' }}
                  >
                    <option value="">Select Fuel Type</option>
                    {FUEL_TYPES.map(f => (
                      <option key={f} value={f}>{FUEL_LABELS[f]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label hint="(KVA) Optional">Rated Power (KVA)</Label>
                  <TextField name="ratedPowerKva" value={form.ratedPowerKva} onChange={e => field('ratedPowerKva', e.target.value)} hasError={!!errors.ratedPowerKva} placeholder="e.g. 500" type="number" min="0" step="0.01" />
                  <ErrMsg message={errors.ratedPowerKva} />
                </div>
                <div>
                  <Label hint="(KW) Optional">Rated Power (KW)</Label>
                  <TextField name="ratedPowerKw" value={form.ratedPowerKw} onChange={e => field('ratedPowerKw', e.target.value)} hasError={!!errors.ratedPowerKw} placeholder="e.g. 400" type="number" min="0" step="0.01" />
                  <ErrMsg message={errors.ratedPowerKw} />
                </div>
                <div>
                  <Label hint="(V) Optional">Voltage</Label>
                  <TextField name="voltage" value={form.voltage} onChange={e => field('voltage', e.target.value)} hasError={!!errors.voltage} placeholder="e.g. 415" type="number" min="0" step="0.01" />
                  <ErrMsg message={errors.voltage} />
                </div>
                <div className="pf-full">
                  <Label hint="(Hz) Optional">Frequency</Label>
                  <TextField name="frequency" value={form.frequency} onChange={e => field('frequency', e.target.value)} hasError={!!errors.frequency} placeholder="e.g. 50" type="number" min="0" step="0.01" />
                  <ErrMsg message={errors.frequency} />
                </div>
              </div>
            </div>

            {/* Card 3: Status & Location */}
            <div className="pf-card">
              <CardHeader icon={Icon.Location}>Status &amp; Location</CardHeader>
              <div className="pf-grid-2">
                <div>
                  <Label>Current Status</Label>
                  <select
                    value={form.currentStatus}
                    onChange={e => field('currentStatus', e.target.value)}
                    className="pf-input pf-select"
                    style={{ width: '100%', padding: '11px 14px' }}
                  >
                    {STATUS_OPTS.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Condition</Label>
                  <select
                    value={form.condition}
                    onChange={e => field('condition', e.target.value)}
                    className="pf-input pf-select"
                    style={{ width: '100%', padding: '11px 14px' }}
                  >
                    <option value="">Select Condition</option>
                    {CONDITION_OPTS.map(c => (
                      <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div className="pf-full">
                  <Label>Current Location</Label>
                  <TextField name="location" value={form.location} onChange={e => field('location', e.target.value)} placeholder="e.g. Site B, Yard 3" />
                </div>
              </div>
            </div>

            {/* Card 4: Financial Information */}
            <div className="pf-card">
              <CardHeader icon={Icon.Dollar}>Financial Information</CardHeader>
              <div className="pf-grid-2">
                <div>
                  <Label>Purchase Date</Label>
                  <TextField name="purchaseDate" value={form.purchaseDate} onChange={e => field('purchaseDate', e.target.value)} type="date" />
                </div>
                <div>
                  <Label>Purchase Price</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>₹</span>
                    <TextField name="purchasePrice" value={form.purchasePrice} onChange={e => field('purchasePrice', e.target.value)} hasError={!!errors.purchasePrice} placeholder="0.00" type="number" min="0" step="0.01" style={{ paddingLeft: 28 }} />
                  </div>
                  <ErrMsg message={errors.purchasePrice} />
                </div>
                <div className="pf-full">
                  <Label>Rent Price / Day</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>₹</span>
                    <TextField name="rentPricePerDay" value={form.rentPricePerDay} onChange={e => field('rentPricePerDay', e.target.value)} hasError={!!errors.rentPricePerDay} placeholder="0.00" type="number" min="0" step="0.01" style={{ paddingLeft: 28 }} />
                  </div>
                  <ErrMsg message={errors.rentPricePerDay} />
                </div>
              </div>
            </div>

            {/* Card 5: Maintenance Records */}
            <div className="pf-card">
              <CardHeader icon={Icon.Wrench}>Maintenance Records</CardHeader>
              <div className="pf-grid-2">
                <div>
                  <Label>Hours Run</Label>
                  <TextField name="hoursRun" value={form.hoursRun} onChange={e => field('hoursRun', e.target.value)} hasError={!!errors.hoursRun} placeholder="e.g. 1250" type="number" min="0" />
                  <ErrMsg message={errors.hoursRun} />
                </div>
                <div>
                  <Label>Last Service Date</Label>
                  <TextField name="lastServiceDate" value={form.lastServiceDate} onChange={e => field('lastServiceDate', e.target.value)} type="date" />
                </div>
                <div className="pf-full">
                  <Label>Next Service Due</Label>
                  <TextField name="nextServiceDue" value={form.nextServiceDue} onChange={e => field('nextServiceDue', e.target.value)} type="date" />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sidebar (Status & Actions) */}
          <div className="pf-sidebar">
            <div className="pf-card">
              <CardHeader icon={Icon.Settings}>Status &amp; Visibility</CardHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Active Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Generator Status</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Visibility in operations</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={form.isActive} onChange={e => field('isActive', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: 12,
                        background: form.isActive ? '#ef4444' : 'var(--color-border-strong)',
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
          </div>

        </div>
      </div>
    </>
  )
}
