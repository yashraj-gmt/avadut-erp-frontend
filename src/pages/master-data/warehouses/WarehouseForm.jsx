// src/pages/master-data/warehouses/WarehouseForm.jsx
import { useState, useEffect } from 'react';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import Spinner from '@/components/shared/Spinner';

/* ── Icons ─────────────────────────────────────────────────────────────── */
function WarehouseIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
      <path d="M6 18h12M6 14h12M6 10h12"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/* ── Section heading inside the form ───────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <span
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <label
      style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}
    >
      <input type="checkbox" checked={checked} onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 12,
        background: checked ? 'var(--color-primary)' : 'var(--color-border-strong)',
        transition: 'background 0.2s',
      }} />
      <span style={{
        position: 'absolute',
        top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: 'var(--color-surface)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.2s',
      }} />
    </label>
  );
}

/* ── Validation ─────────────────────────────────────────────────────────── */
function validate(form) {
  const e = {};
  if (!form.name.trim())                  e.name = 'Warehouse name is required.';
  else if (form.name.trim().length < 2)   e.name = 'Name must be at least 2 characters.';
  else if (form.name.trim().length > 150) e.name = 'Name cannot exceed 150 characters.';

  if (!form.code.trim())                  e.code = 'Warehouse code is required.';
  else if (!/^[A-Z0-9_-]{2,30}$/i.test(form.code.trim()))
    e.code = 'Code must be 2–30 alphanumeric characters (-, _ allowed).';

  if (form.pincode && !/^\d{4,10}$/.test(form.pincode.trim()))
    e.pincode = 'Enter a valid pincode (4–10 digits).';

  if (form.contactPhone && !/^[\d\s+()-]{7,20}$/.test(form.contactPhone.trim()))
    e.contactPhone = 'Enter a valid phone number.';

  if (form.totalCapacity && (isNaN(Number(form.totalCapacity)) || Number(form.totalCapacity) < 0))
    e.totalCapacity = 'Capacity must be a positive number.';

  return e;
}

/* ═══════════════════════════════════════════════════════════════════════════
   WarehouseForm
   Props:
     item    — existing warehouse object (edit mode) or null (create mode)
     onSave  — (data) => void
     onClose — () => void
═══════════════════════════════════════════════════════════════════════════ */
const EMPTY = {
  name: '', code: '', location: '', address: '',
  city: '', state: '', pincode: '',
  contactPerson: '', contactPhone: '',
  totalCapacity: '', isActive: true,
};

export default function WarehouseForm({ item, onSave, onClose }) {
  const isEdit = Boolean(item);

  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name:          item.name          ?? '',
        code:          item.code          ?? '',
        location:      item.location      ?? '',
        address:       item.address       ?? '',
        city:          item.city          ?? '',
        state:         item.state         ?? '',
        pincode:       item.pincode       ?? '',
        contactPerson: item.contactPerson ?? '',
        contactPhone:  item.contactPhone  ?? '',
        totalCapacity: item.totalCapacity != null ? String(item.totalCapacity) : '',
        isActive:      item.isActive      ?? true,
      });
    }
  }, [item]);

  const field = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((err) => ({ ...err, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate API
    onSave({
      ...(item || {}),
      ...form,
      name:          form.name.trim(),
      code:          form.code.trim().toUpperCase(),
      totalCapacity: form.totalCapacity ? Number(form.totalCapacity) : null,
    });
    setSaving(false);
  };

  /* backdrop click closes modal */
  const handleBackdrop = (e) => { if (e.target === e.currentTarget && !saving) onClose(); };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16, overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%', maxWidth: 620,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'wf-slideUp 0.22s ease',
          margin: 'auto',
        }}
      >
        <style>{`
          @keyframes wf-slideUp {
            from { opacity:0; transform:translateY(18px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>

        {/* ── Header ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'var(--color-primary)',
            borderBottom: '1px solid var(--color-primary-dark)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.18)', color: 'var(--color-text-inverse)' }}
            >
              <WarehouseIcon />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--color-text-inverse)' }}>
                {isEdit ? 'Edit Warehouse' : 'New Warehouse'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {isEdit ? `Editing: ${item.name}` : 'Fill in details to add a warehouse location'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.18)', color: 'var(--color-text-inverse)', border: 'none', cursor: 'pointer' }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* ── Basic Info ─────────────────────────────────── */}
          <SectionLabel>Basic Information</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Warehouse Name"
              placeholder="e.g. Central Delhi Hub"
              value={form.name}
              onChange={field('name')}
              error={errors.name}
              maxLength={150}
              required
              hint={`${form.name.length}/150`}
            />
            <Input
              label="Warehouse Code"
              placeholder="e.g. WH-DEL-01"
              value={form.code}
              onChange={field('code')}
              error={errors.code}
              maxLength={30}
              required
              hint="Unique identifier, auto-uppercased"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          {/* ── Location ───────────────────────────────────── */}
          <SectionLabel>Location Details</SectionLabel>

          <Input
            label="Location / Area"
            placeholder="e.g. Industrial Zone, Phase 2"
            value={form.location}
            onChange={field('location')}
            maxLength={255}
          />

          <Input
            label="Full Address"
            placeholder="Street address, building, floor…"
            value={form.address}
            onChange={field('address')}
            multiline
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={field('city')}
              maxLength={100}
            />
            <Input
              label="State"
              placeholder="e.g. Maharashtra"
              value={form.state}
              onChange={field('state')}
              maxLength={100}
            />
            <Input
              label="Pincode"
              placeholder="e.g. 400001"
              value={form.pincode}
              onChange={field('pincode')}
              error={errors.pincode}
              maxLength={10}
              inputMode="numeric"
            />
          </div>

          {/* ── Contact & Capacity ─────────────────────────── */}
          <SectionLabel>Contact & Capacity</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              placeholder="e.g. Ramesh Sharma"
              value={form.contactPerson}
              onChange={field('contactPerson')}
              maxLength={100}
            />
            <Input
              label="Contact Phone"
              placeholder="e.g. +91 98765 43210"
              value={form.contactPhone}
              onChange={field('contactPhone')}
              error={errors.contactPhone}
              maxLength={20}
              type="tel"
            />
          </div>

          <Input
            label="Total Storage Capacity"
            placeholder="e.g. 5000  (units / sq. ft)"
            value={form.totalCapacity}
            onChange={field('totalCapacity')}
            error={errors.totalCapacity}
            type="number"
            min="0"
            hint="Leave blank if unknown"
          />

          {/* ── Active Status toggle ────────────────────────── */}
          <div
            className="flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius-md)]"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Active Status
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {form.isActive
                  ? 'Warehouse is operational and available for stock'
                  : 'Warehouse is currently inactive'}
              </p>
            </div>
            <Toggle
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
          </div>

          {/* ── Actions ─────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="flex-[2]"
              loading={saving}
              icon={!saving ? <CheckIcon /> : undefined}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Warehouse'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}