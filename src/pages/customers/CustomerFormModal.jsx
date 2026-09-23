// src/pages/customers/CustomerFormModal.jsx
import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, FileText, Calendar, Save, Link, Star, Building2 } from 'lucide-react';
import { customerService } from '@/services/customerService';
import { useToast } from '@/components/shared/toast/ToastProvider';
import Button from '@/components/shared/Button';

// ── Constants ──────────────────────────────────────────────────────────────
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const today = () => new Date().toISOString().split('T')[0];

function validate(form) {
  const errors = {};
  if (!form.name?.trim())  errors.name   = 'Customer name is required.';
  if (form.name?.length > 100) errors.name = 'Name must not exceed 100 characters.';
  if (form.firmName?.length > 150) errors.firmName = 'Firm name must not exceed 150 characters.';
  if (!form.mobile?.trim()) errors.mobile = 'Mobile number is required.';
  else if (!MOBILE_REGEX.test(form.mobile)) errors.mobile = 'Must be a valid 10-digit Indian mobile number.';
  if (form.alternateMobile && !MOBILE_REGEX.test(form.alternateMobile))
    errors.alternateMobile = 'Must be a valid 10-digit Indian mobile number.';
  if (form.telephoneNumber?.trim() && !/^[0-9+\-\s()]{6,20}$/.test(form.telephoneNumber.trim()))
    errors.telephoneNumber = 'Enter a valid telephone number (6-20 characters).';
  if (form.email && !EMAIL_REGEX.test(form.email)) errors.email = 'Must be a valid email address.';
  if (form.address?.length > 500) errors.address = 'Address must not exceed 500 characters.';
  if (form.addressLocationLink?.length > 500) errors.addressLocationLink = 'Link must not exceed 500 characters.';
  return errors;
}

// ── Field Component ────────────────────────────────────────────────────────
function Field({ label, required, icon: Icon, error, hint, children }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      <div className="relative w-full">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-[13px] text-[var(--color-text-subtle)] pointer-events-none z-10" />
        )}
        {children}
      </div>
      {hint  && !error && <p className="mt-1 text-[11px] text-[var(--color-text-subtle)]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

const inputCls = (hasIcon, error) =>
  [
    'w-full py-2.5 pr-3 text-sm rounded-[var(--radius-md)] border transition',
    hasIcon ? 'pl-9' : 'pl-3',
    error
      ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
      : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]',
    'bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]',
    'focus:outline-none focus:ring-2 min-h-[40px]',
  ].join(' ');

const selectCls = (error) =>
  [
    'w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)] border transition',
    error
      ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
      : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]',
    'bg-[var(--color-bg)] text-[var(--color-text)]',
    'focus:outline-none focus:ring-2 min-h-[40px]',
  ].join(' ');

// ── Section Divider ────────────────────────────────────────────────────────
function Section({ title }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <span className="text-[11px] sm:text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider whitespace-nowrap">{title}</span>
      <hr className="flex-1 border-[var(--color-border)]" />
    </div>
  );
}

// ── Regular Toggle ─────────────────────────────────────────────────────────
function RegularToggle({ value, onChange }) {
  return (
    <div
      className={[
        'flex items-center gap-3 p-3 rounded-[var(--radius-md)] border cursor-pointer select-none transition-all',
        value
          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
          : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-amber-300',
      ].join(' ')}
      onClick={() => onChange(!value)}
    >
      <div className={[
        'w-10 h-6 rounded-full relative transition-all shrink-0',
        value ? 'bg-amber-400' : 'bg-[var(--color-border)]',
      ].join(' ')}>
        <span className={[
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          value ? 'translate-x-4' : 'translate-x-0.5',
        ].join(' ')} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${value ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text-muted)]'}`}>
          {value ? '⭐ Regular Customer' : 'Mark as Regular Customer'}
        </p>
        <p className="text-[11px] text-[var(--color-text-subtle)]">
          {value ? 'This customer is flagged as a regular.' : 'Toggle to mark this customer as regular.'}
        </p>
      </div>
    </div>
  );
}

// ── CustomerFormModal ──────────────────────────────────────────────────────
export default function CustomerFormModal({ customer, onSuccess, onClose }) {
  const toast  = useToast();
  const isEdit = Boolean(customer?.id);

  const [form, setForm] = useState({
    name:                customer?.name                ?? '',
    firmName:            customer?.firmName            ?? '',
    mobile:              customer?.mobile              ?? '',
    alternateMobile:     customer?.alternateMobile     ?? '',
    telephoneNumber:     customer?.telephoneNumber     ?? '',
    email:               customer?.email               ?? '',
    address:             customer?.address             ?? '',
    addressLocationLink: customer?.addressLocationLink ?? '',
    customerStatus:      customer?.customerStatus      ?? 'ACTIVE',
    remarks:             customer?.remarks             ?? '',
    isRegular:           customer?.isRegular           ?? false,
    dateJoined:          customer?.dateJoined          ?? today(),
  });

  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        name:                form.name.trim(),
        firmName:            form.firmName?.trim()            || undefined,
        mobile:              form.mobile.trim(),
        alternateMobile:     form.alternateMobile?.trim()     || undefined,
        telephoneNumber:     form.telephoneNumber?.trim()     || undefined,
        email:               form.email?.trim()               || undefined,
        address:             form.address?.trim()             || undefined,
        addressLocationLink: form.addressLocationLink?.trim() || undefined,
        remarks:             form.remarks?.trim()             || undefined,
        isRegular:           form.isRegular,
        customerStatus:      isEdit ? form.customerStatus : undefined,
        dateJoined:          form.dateJoined                  || undefined,
      };

      if (isEdit) {
        await customerService.update(customer.id, payload);
        toast({ type: 'success', message: `${form.name} updated successfully.` });
      } else {
        await customerService.create(payload);
        toast({ type: 'success', message: `${form.name} added successfully.` });
      }
      onSuccess();
    } catch (err) {
      const msg = err?.data?.message ?? err?.message ?? (isEdit ? 'Update failed.' : 'Create failed.');
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div
        className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] w-full max-w-2xl max-h-[96vh] sm:max-h-[90vh] flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB18, #0EA5E918)' }}
            >
              <User size={18} className="text-[var(--color-primary)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text)] truncate">
                {isEdit ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] truncate">
                {isEdit ? `Editing: ${customer.name}` : 'Fill in the details to register customer.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-[var(--radius-md)] text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

          {/* ── Contact Information ── */}
          <Section title="Contact Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Full Name" required icon={User} error={errors.name}>
              <input
                type="text" placeholder="e.g. Rajesh Kumar"
                value={form.name} onChange={set('name')}
                className={inputCls(true, errors.name)}
                maxLength={100}
              />
            </Field>

            <Field label="Firm / Company Name" icon={Building2} error={errors.firmName} hint="Optional business name">
              <input
                type="text" placeholder="e.g. Kumar Enterprises"
                value={form.firmName} onChange={set('firmName')}
                className={inputCls(true, errors.firmName)}
                maxLength={150}
              />
            </Field>

            <Field label="Mobile Number" required icon={Phone} error={errors.mobile}>
              <input
                type="tel" placeholder="10-digit Indian mobile"
                value={form.mobile} onChange={set('mobile')}
                className={inputCls(true, errors.mobile)}
                maxLength={10}
              />
            </Field>

            <Field label="Alternate Mobile" icon={Phone} error={errors.alternateMobile}>
              <input
                type="tel" placeholder="Optional 10-digit"
                value={form.alternateMobile} onChange={set('alternateMobile')}
                className={inputCls(true, errors.alternateMobile)}
                maxLength={10}
              />
            </Field>

            <Field label="Telephone Number" icon={Phone} error={errors.telephoneNumber} hint="Optional landline / office phone">
              <input
                type="tel" placeholder="e.g. 022-28765432 or Landline"
                value={form.telephoneNumber} onChange={set('telephoneNumber')}
                className={inputCls(true, errors.telephoneNumber)}
                maxLength={20}
              />
            </Field>

            <Field label="Email Address" icon={Mail} error={errors.email}>
              <input
                type="email" placeholder="e.g. rajesh@example.com"
                value={form.email} onChange={set('email')}
                className={inputCls(true, errors.email)}
                maxLength={100}
              />
            </Field>

            <Field label="Date Joined" icon={Calendar}>
              <input
                type="date" value={form.dateJoined} onChange={set('dateJoined')}
                className={inputCls(true, errors.dateJoined)}
              />
            </Field>
          </div>

          {/* ── Site Address ── */}
          <Section title="Site Address" />
          <div className="space-y-3 sm:space-y-4">
            <Field label="Site Address" error={errors.address} hint="Generator installation / service location">
              <textarea
                placeholder="Plot No., Street, Building, Landmark…"
                value={form.address} onChange={set('address')}
                rows={2}
                className={[inputCls(false, errors.address), 'resize-none pt-2.5'].join(' ')}
                maxLength={500}
              />
            </Field>
            <Field label="Site Address Location Link" icon={Link} error={errors.addressLocationLink} hint="Paste Google Maps or any location URL">
              <input
                type="url" placeholder="https://maps.google.com/..."
                value={form.addressLocationLink} onChange={set('addressLocationLink')}
                className={inputCls(true, errors.addressLocationLink)}
                maxLength={500}
              />
            </Field>
          </div>

          {/* ── Administrative ── */}
          <Section title="Administrative" />
          <div className={isEdit ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" : "space-y-3 sm:space-y-4"}>
            {isEdit && (
              <Field label="Status">
                <select value={form.customerStatus} onChange={set('customerStatus')} className={selectCls()}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </Field>
            )}
            <Field label="Remarks" error={errors.remarks} hint="Special notes or instructions">
              <textarea
                placeholder="Any remarks about this customer…"
                value={form.remarks} onChange={set('remarks')}
                rows={2}
                className={[inputCls(false, errors.remarks), 'resize-none pt-2.5'].join(' ')}
              />
            </Field>
          </div>

          {/* ── Regular Customer Toggle ── */}
          <RegularToggle
            value={form.isRegular}
            onChange={(val) => setForm(prev => ({ ...prev, isRegular: val }))}
          />

        </form>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-surface-2)] sm:bg-transparent">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">Cancel</Button>
          <Button
            icon={<Save size={15} />}
            loading={loading}
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {isEdit ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
