// src/pages/generators/orders/GeneratorOrderBilling.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  calcDuration,
  formatDurationDisplay,
  getCableRate,
  numberToWords,
  formatToDMY,
  formatRangeToDMY,
  parseDateStr,
} from './mockData';
import { generatorOrderService } from '@/services/generatorOrderService';
import { ChevronDown, AlertCircle, Trash2 } from 'lucide-react';
import { generatorService } from '@/services/generatorService';
import InvoiceShareModal from '@/components/shared/InvoiceShareModal';

/* ─── Global Mock Bills State ────────────────────────────────────────────── */

/* ─── Mock generator pricing (pre-loaded for demo, replaced by API data) ─── */
const MOCK_GEN_PRICING = {
  'GEN-001': { rentPerDay: 2000,  dieselPerHour: 800  },
  'GEN-002': { rentPerDay: 3000,  dieselPerHour: 1000 },
  'GEN-003': { rentPerDay: 4000,  dieselPerHour: 1500 },
  'GEN-004': { rentPerDay: 6000,  dieselPerHour: 2000 },
  'GEN-005': { rentPerDay: 3200,  dieselPerHour: 1200 },
  'GEN-006': { rentPerDay: 4500,  dieselPerHour: 1500 },
  'GEN-007': { rentPerDay: 5000,  dieselPerHour: 1800 },
  'GEN-008': { rentPerDay: 6500,  dieselPerHour: 2200 },
  'GEN-009': { rentPerDay: 10000, dieselPerHour: 3500 },
  'GEN-010': { rentPerDay: 4200,  dieselPerHour: 1500 },
  'GEN-011': { rentPerDay: 5200,  dieselPerHour: 1800 },
  'GEN-012': { rentPerDay: 6000,  dieselPerHour: 2000 },
  'GEN-013': { rentPerDay: 9500,  dieselPerHour: 3000 },
  'GEN-014': { rentPerDay: 18000, dieselPerHour: 5500 },
};

/* ─── Calculation helpers ─────────────────────────────────────────────────── */

/** Parse "2026-07-01 to 2026-07-03" or "01-07-2026 to 03-07-2026" → 3 (inclusive days) */
const parseRentalDays = (functionDate) => {
  if (!functionDate) return 1;
  const parts = functionDate.split(' to ');
  if (parts.length !== 2) return 1;
  try {
    const from = parseDateStr(parts[0].trim());
    const to   = parseDateStr(parts[1].trim());
    if (!from || !to) return 1;
    const diffMs = to - from;
    if (diffMs < 0) return 1;
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1); // inclusive
  } catch { return 1; }
};

/** HH:MM duration string → decimal hours */
const parseDurationToHours = (durStr) => {
  if (!durStr) return 0;
  const [h, m] = durStr.split(':').map(Number);
  return (h || 0) + ((m || 0) / 60);
};

const today = () => new Date().toISOString().split('T')[0];

const numOnly = (val) =>
  val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Receipt: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
      <path d="M16 8H8m8 4H8"/>
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Printer: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Share: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
};

/* ─── Global styles ───────────────────────────────────────────────────────── */
const STYLES = `
  .gb2-page { padding:24px; max-width:1280px; margin:0 auto; animation:gb2-fadein .3s ease; }
  @keyframes gb2-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .gb2-header { display:flex; align-items:flex-start; gap:14px; margin-bottom:28px; }
  .gb2-back-btn {
    display:flex; align-items:center; justify-content:center;
    width:38px; height:38px; border-radius:10px;
    border:1.5px solid var(--color-border); background:var(--color-surface);
    cursor:pointer; color:var(--color-text-muted); transition:all .2s; flex-shrink:0; margin-top:2px;
  }
  .gb2-back-btn:hover { border-color:var(--color-primary); color:var(--color-primary); background:var(--color-primary-50); }
  .gb2-page-title { font-size:clamp(18px,3vw,22px); font-weight:700; color:var(--color-text); letter-spacing:-.4px; margin:0 0 3px; }
  .gb2-breadcrumb { font-size:13px; color:var(--color-text-subtle); }
  .gb2-breadcrumb a { color:var(--color-primary); text-decoration:none; }

  .gb2-card { background:transparent; border:none; border-radius:0; margin-bottom:32px; box-shadow:none; }
  .gb2-card-header {
    display:flex; align-items:center; gap:10px;
    padding:12px 0 16px; background:transparent;
    border-bottom:1.5px solid var(--color-border); margin-bottom:20px;
  }
  .gb2-card-icon { display:flex; color:var(--color-primary); }
  .gb2-card-title { font-size:15px; font-weight:700; color:var(--color-text); margin:0; }
  .gb2-card-body { padding:0; }

  .gb2-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; }
  .gb2-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px 24px; }

  .gb2-field { display:flex; flex-direction:column; gap:6px; }
  .gb2-label { font-size:12.5px; font-weight:600; color:var(--color-text); display:block; }
  .gb2-input, .gb2-textarea {
    width:100%; padding:10px 13px;
    border:1.5px solid var(--color-border); border-radius:var(--radius-md);
    font-size:13.5px; color:var(--color-text); background:var(--color-surface);
    outline:none; transition:border-color .2s; font-family:inherit;
  }
  .gb2-input:focus, .gb2-textarea:focus { border-color:var(--color-primary); }
  .gb2-input:disabled, .gb2-textarea:disabled {
    background:var(--color-surface-2); color:var(--color-text-muted); cursor:not-allowed;
  }

  /* ── Calculation table ── */
  .gb2-table-wrap {
    border:1px solid var(--color-border); border-radius:var(--radius-lg);
    background:var(--color-surface); overflow-x:auto; margin-bottom:24px;
    box-shadow:var(--shadow-sm);
    -webkit-overflow-scrolling: touch;
  }
  .gb2-table { width:100%; min-width:850px; border-collapse:collapse; text-align:left; font-size:13px; }
  .gb2-th {
    padding:11px 12px; font-size:10.5px; font-weight:700;
    color:var(--color-text-muted); text-transform:uppercase;
    letter-spacing:.5px; border-bottom:1.5px solid var(--color-border);
    background:var(--color-surface-2); white-space:nowrap;
  }
  .gb2-td { padding:11px 12px; border-bottom:1px solid var(--color-border); color:var(--color-text); vertical-align:middle; }
  /* Sub-row tinting */
  .gb2-tr-diesel td { background:rgba(251,191,36,.04); border-bottom:none; }
  .gb2-tr-cable  td { background:rgba(37,99,235,.025); border-bottom:none; }
  .gb2-tr-gen:last-of-type td { border-bottom:none; }

  /* Editable price inline inputs */
  .gb2-inp-inline {
    padding:5px 8px; border:1.5px solid var(--color-border); border-radius:6px;
    font-family:inherit; font-size:13px; outline:none; transition:all .2s;
    font-weight:600; text-align:right; background:var(--color-surface);
    color:var(--color-text);
  }
  .gb2-inp-inline:focus { border-color:var(--color-primary); box-shadow:0 0 0 2px rgba(37,99,235,.1); }
  .gb2-inp-inline.err { border-color:#ef4444; box-shadow:0 0 0 2px rgba(239,68,68,.1); }
  .gb2-inp-time {
    padding:5px 7px; border:1.5px solid var(--color-border); border-radius:6px;
    font-family:inherit; font-size:12px; outline:none; transition:all .2s;
    background:var(--color-surface); color:var(--color-text); width:90px;
  }
  .gb2-inp-time:focus { border-color:var(--color-primary); }
  .gb2-inp-date {
    padding:5px 7px; border:1.5px solid var(--color-border); border-radius:6px;
    font-family:inherit; font-size:12px; outline:none; transition:all .2s;
    background:var(--color-surface); color:var(--color-text); width:130px;
  }
  .gb2-inp-date:focus { border-color:var(--color-primary); }
  .gb2-err-text { font-size:10.5px; color:#ef4444; font-weight:600; margin-top:2px; display:block; }

  /* Diesel slot add/remove buttons */
  .gb2-slot-btn {
    display:inline-flex; align-items:center; justify-content:center;
    width:22px; height:22px; border-radius:50%; border:1.5px solid;
    cursor:pointer; font-size:15px; line-height:1; font-weight:700;
    transition:all .15s; padding:0; font-family:inherit; flex-shrink:0;
  }
  .gb2-slot-btn-add { color:#16a34a; border-color:#86efac; background:#f0fdf4; }
  .gb2-slot-btn-add:hover { background:#dcfce7; border-color:#16a34a; transform:scale(1.1); }
  .gb2-slot-btn-remove { color:#dc2626; border-color:#fca5a5; background:#fff5f5; }
  .gb2-slot-btn-remove:hover { background:#fee2e2; border-color:#dc2626; transform:scale(1.1); }

  /* Tag badge */
  .gb2-badge {
    display:inline-flex; align-items:center; gap:4px;
    padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;
  }
  .gb2-badge-diesel { background:#fef3c7; color:#92400e; border:1px solid #fde68a; }
  .gb2-badge-cable  { background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; }

  /* Summary */
  .gb2-summary-card {
    background:var(--color-surface); border:1px solid var(--color-border);
    border-radius:var(--radius-lg); padding:20px; box-shadow:var(--shadow-sm);
    display:flex; justify-content:flex-end;
  }
  .gb2-summary-box { width:340px; display:flex; flex-direction:column; gap:10px; }
  .gb2-summary-row { display:flex; justify-content:space-between; align-items:center; font-size:14px; color:var(--color-text-muted); }
  .gb2-summary-row.net-total {
    font-size:19px; font-weight:800; color:var(--color-primary-dark);
    border-top:1.5px solid var(--color-border); padding-top:12px; margin-top:4px;
  }
  .gb2-discount-inp {
    width:130px; padding:5px 10px;
    border:1.5px solid var(--color-border); border-radius:6px;
    font-family:inherit; font-size:14px; font-weight:600;
    text-align:right; outline:none; transition:all .2s;
  }
  .gb2-discount-inp:focus { border-color:#ef4444; box-shadow:0 0 0 2px rgba(239,68,68,.08); }
  .gb2-discount-inp.err { border-color:#ef4444; }
  .gb2-amount-words {
    margin-top:8px; padding:10px 14px;
    background:linear-gradient(135deg,#eff6ff,#dbeafe);
    border:1px solid #bfdbfe; border-radius:8px;
    font-size:11.5px; font-weight:700; color:#1e40af;
    font-style:italic; text-align:right; line-height:1.5;
  }

  /* Action bar */
  .gb2-action-bar-card {
    background:var(--color-surface); border:1px solid var(--color-border);
    border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); overflow:hidden; margin-top:28px; margin-bottom:50px;
  }
  .gb2-action-bar {
    display:flex; justify-content:flex-end; gap:10px;
    padding:18px 24px; background:var(--color-surface-2); flex-wrap:wrap;
  }
  .gb2-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 20px; border-radius:var(--radius-md);
    font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit;
    transition:all .2s; border:none; white-space:nowrap;
  }
  .gb2-btn-cancel { background:var(--color-surface); color:var(--color-danger); border:1.5px solid #fca5a5; }
  .gb2-btn-cancel:hover { background:#fee2e2; }
  .gb2-btn-save   { background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark)); color:#fff; box-shadow:var(--shadow-md); }
  .gb2-btn-save:hover   { transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,.35); }
  .gb2-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; pointer-events:none; }
  .gb2-btn-print  { background:#1e293b; color:#fff; border:1.5px solid #334155; }
  .gb2-btn-print:hover  { background:#0f172a; }
  .gb2-btn-share  { background:#0d9488; color:#fff; }
  .gb2-btn-share:hover  { background:#0f766e; }

  /* Toast */
  .gb2-toast {
    position:fixed; top:20px; right:20px; z-index:9999;
    background:#fff; border-radius:var(--radius-lg); padding:14px 20px;
    box-shadow:0 8px 32px rgba(0,0,0,.18); border-left:4px solid #059669;
    display:flex; align-items:center; gap:10px; font-family:inherit;
    animation:gb2-toast .3s ease; min-width:260px; max-width:380px;
  }
  @keyframes gb2-toast { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }

  /* Info banner */
  .gb2-info-banner {
    display:flex; gap:10px; padding:12px 16px;
    background:linear-gradient(135deg,#eff6ff,#dbeafe);
    border:1px solid #bfdbfe; border-radius:10px;
    font-size:13px; color:#1e40af; font-weight:600; margin-bottom:16px;
  }

  @media (max-width: 768px) {
    .gb2-grid-2, .gb2-grid-3 { grid-template-columns: 1fr; gap: 16px; }
    .gb2-summary-card { justify-content: stretch; }
    .gb2-summary-box { width: 100%; }
    .gb2-page { padding: 16px; }
  }
`;

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function CardSection({ icon: Ic, title, children }) {
  return (
    <div className="gb2-card">
      <div className="gb2-card-header">
        <span className="gb2-card-icon"><Ic /></span>
        <h3 className="gb2-card-title">{title}</h3>
      </div>
      <div className="gb2-card-body">{children}</div>
    </div>
  );
}
function Label({ children }) { return <label className="gb2-label">{children}</label>; }
function SkeletonForm() {
  return (
    <div className="gb2-page">
      <div className="gb2-header">
        <div className="gb2-back-btn" style={{ pointerEvents:'none' }}><Icon.ArrowLeft /></div>
        <div style={{ flex:1 }}>
          <div style={{ width:220, height:24, background:'var(--color-surface-2)', borderRadius:4, marginBottom:8 }} />
          <div style={{ width:160, height:13, background:'var(--color-surface-2)', borderRadius:4 }} />
        </div>
      </div>
      {[140,120,300].map((h,i) => (
        <div key={i} style={{ height:h, background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, marginBottom:24 }} />
      ))}
    </div>
  );
}

/* ─── Inline editable number input ──────────────────────────────────────── */
function NumInput({ id, value, onChange, onBlur, width = 110, placeholder = '0', error, disabled }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className={`gb2-inp-inline${error ? ' err' : ''}`}
        style={{ width }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(numOnly(e.target.value))}
        onBlur={onBlur}
        disabled={disabled}
        onKeyDown={e => {
          const ok = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','.'];
          if (!ok.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
        }}
      />
      {error && <span className="gb2-err-text">{error}</span>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function GeneratorOrderBilling() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [order, setOrder]           = useState(null);
  const [billNo, setBillNo]         = useState('');
  const [isEditBill, setIsEditBill] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatorsList, setGeneratorsList] = useState([]);
  const [paymentDueDate, setPaymentDueDate] = useState('');

  /* ── Disable Browser Inspect (F12, Right-Click, Ctrl+Shift+I, etc.) ── */
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // F12
      if (e.keyCode === 123) e.preventDefault();
      // Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) e.preventDefault();
      // Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) e.preventDefault();
      // Ctrl+U
      if (e.ctrlKey && e.keyCode === 85) e.preventDefault();
      // Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /* ── Load generators catalog for fallback rates ── */
  useEffect(() => {
    generatorService.getForDropdown()
      .then(list => setGeneratorsList(list || []))
      .catch(err => console.error('Failed to load generators dropdown:', err));
  }, []);

  /* ── Per-generator editable billing fields ── */
  const [rentPerDay,       setRentPerDay]       = useState({});
  const [dieselPerHour,    setDieselPerHour]    = useState({});
  const [cableRatePerDay,  setCableRatePerDay]  = useState({});
  const [dieselEntries,    setDieselEntries]    = useState({}); // { [gId]: [{ date, startTime, endTime, duration }] }

  /* ── Other Charges (miscellaneous) ── */
  const [otherCharges, setOtherCharges] = useState([]); // [{ name: '', amount: '' }]

  /* ── Errors ── */
  const [rentErrors,    setRentErrors]    = useState({});
  const [dieselErrors,  setDieselErrors]  = useState({});
  const [discount,      setDiscount]      = useState(0);
  const [discountError, setDiscountError] = useState('');

  /* ── Load order ── */
  useEffect(() => {
    setLoading(true);
    generatorOrderService.getById(id)
      .then(foundOrder => {
        setOrder(foundOrder);

        // Try to pre-fill pricing from backend; fall back to mock table
        const initRentPerDay    = {};
        const initDieselPerHour = {};
        const initCableRate     = {};
        const initDieselStart   = {};
        const initDieselEnd     = {};
        const initDate          = {};

        const fillPricing = (genData) => {
          (foundOrder.generators || []).forEach(g => {
            const gPricing = genData.find
              ? genData.find(d => d.name === g.generatorName || d.id === g.generatorId)
              : null;
            // Rent/day = partyDieselRentPrice (base generator rent, no diesel component)
            initRentPerDay[g.id || g._id] = gPricing?.partyDieselRentPrice ?? '';
            // Diesel/hr = withDieselRentPrice (diesel charge rate, only applied with WITH_OWNER diesel)
            initDieselPerHour[g.id || g._id] = gPricing?.withDieselRentPrice ?? '';
            initCableRate[g.id || g._id]     = gPricing?.cableRate ?? '';
            initDieselStart[g.id || g._id]   = '00:00';
            initDieselEnd[g.id || g._id]     = '00:00';
            initDate[g.id || g._id]          = today();
          });
        };

        const isComp = foundOrder.billingStatus === 'COMPLETED';
        setIsCompleted(isComp);
        
        let existingRent = {};
        let existingDiesel = {};
        let existingCable = {};
        let existingEntries = {};

        // Generate dates from functionDate
        const dates = [];
        if (foundOrder.functionDateFrom && foundOrder.functionDateTo) {
           let curr = new Date(foundOrder.functionDateFrom);
           const end = new Date(foundOrder.functionDateTo);
           while(curr <= end) {
              dates.push(curr.toISOString().split('T')[0]);
              curr.setDate(curr.getDate() + 1);
           }
        } else {
           dates.push(today());
        }

        if (foundOrder.generators) {
            foundOrder.generators.forEach(g => {
                const gId = g.id || g._id;
                // Keep as the API value (may be null for new orders — auto-populate will fill it)
                existingRent[gId] = g.rate != null ? g.rate : '';
                existingDiesel[gId] = g.dieselRate != null ? g.dieselRate : null;
                existingCable[gId] = g.cableRate != null ? g.cableRate : (g.cableSize ? getCableRate(g.cableSize) : 0);
                
                if (g.dieselEntries && g.dieselEntries.length > 0) {
                    existingEntries[gId] = g.dieselEntries.map(e => ({
                        date: e.entryDate,
                        startTime: e.startTime,
                        endTime: e.endTime,
                        duration: e.duration || parseDurationToHours(calcDuration(e.startTime, e.endTime))
                    }));
                } else {
                    existingEntries[gId] = dates.map(d => ({
                        date: d,
                        startTime: '00:00',
                        endTime: '00:00',
                        duration: 0
                    }));
                }
            });
        }
        
        setRentPerDay(existingRent);
        setDieselPerHour(existingDiesel);
        setCableRatePerDay(existingCable);
        setDieselEntries(existingEntries);
        // Load saved otherCharges from order if available
        if (foundOrder.otherCharges && foundOrder.otherCharges.length > 0) {
          setOtherCharges(foundOrder.otherCharges.map(oc => ({ name: oc.name || '', amount: oc.amount != null ? String(oc.amount) : '' })));
        } else {
          setOtherCharges([]);
        }
        setDiscount(foundOrder.discountAmount || 0);
        setBillNo(foundOrder.billNumber || '—');
        // Load paymentDueDate: if saved use it, else default to today + 7 days
        if (foundOrder.paymentDueDate) {
          setPaymentDueDate(foundOrder.paymentDueDate);
        } else {
          const d = new Date(); d.setDate(d.getDate() + 7);
          setPaymentDueDate(d.toISOString().split('T')[0]);
        }
        setIsEditBill(true); // Always edit existing order in DB
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch order', err);
        setLoading(false);
      });
  }, [id]);

  /* ── Auto-fetch and populate default rates from catalog when both order and generators are ready ── */
  useEffect(() => {
    if (!order || !generatorsList.length) return;

    let updated = false;
    const nextRent = { ...rentPerDay };
    const nextDiesel = { ...dieselPerHour };

    (order.generators || []).forEach(g => {
      const gId = g.id || g._id;
      const isWithDiesel = order.withDiesel || (order.dieselType && order.dieselType !== 'PARTY');

      // 1. Rent price per day = partyDieselRentPrice (base generator rent WITHOUT diesel component)
      //    This is always the base rent regardless of which party provides diesel.
      if (!nextRent[gId]) {
        const genObj = generatorsList.find(item => String(item.id) === String(g.generatorId));
        

        const isLikelyBugged = isWithDiesel && genObj && g.rate === genObj.withDieselRentPrice && g.rate !== genObj.partyDieselRentPrice;

        if (g.rate && !isLikelyBugged) {
          nextRent[gId] = g.rate;
        } else {
          if (genObj && genObj.partyDieselRentPrice != null) {
            nextRent[gId] = genObj.partyDieselRentPrice;
          } else {
            nextRent[gId] = '';
          }
        }
        updated = true;
      }

      // 2. Diesel price per hour — use the saved dieselRate from the order item.
      //    For new orders (dieselRate not yet saved), fall back to the generator's
      //    withDieselRentPrice from the inventory catalog as a sensible default.
      //    Check falsy (covers: null, undefined, '', 0) to decide whether to auto-fill.
      if (!nextDiesel[gId] && nextDiesel[gId] !== 0) {
        if (g.dieselRate) {
          nextDiesel[gId] = g.dieselRate;
        } else {
          const genObj = generatorsList.find(item => String(item.id) === String(g.generatorId));
          if (genObj && genObj.withDieselRentPrice != null) {
            // withDieselRentPrice is the per-day rent WITH diesel — use it as the diesel charge default
            nextDiesel[gId] = genObj.withDieselRentPrice;
          } else {
            // No catalog data available; leave blank so user can enter manually
            nextDiesel[gId] = '';
          }
        }
        updated = true;
      }
    });

    if (updated) {
      setRentPerDay(nextRent);
      setDieselPerHour(nextDiesel);
    }
  }, [order, generatorsList]);

  /* ── Field handlers ── */
  const setField = (setter, id, val) => setter(prev => ({ ...prev, [id]: val }));

  const handleRentChange = (gId, val) => {
    setField(setRentPerDay, gId, val);
    if (rentErrors[gId]) setRentErrors(p => ({ ...p, [gId]: '' }));
  };
  const handleRentBlur = (gId, val) => {
    if (val === '' || val === undefined) setRentErrors(p => ({ ...p, [gId]: 'Rent per day is required' }));
    else setRentErrors(p => ({ ...p, [gId]: '' }));
  };
  const handleDieselPriceChange = (gId, val) => {
    setField(setDieselPerHour, gId, val);
    if (dieselErrors[gId]) setDieselErrors(p => ({ ...p, [gId]: '' }));
  };
  const handleCableRateChange = (gId, val) => {
    setField(setCableRatePerDay, gId, val);
  };
  const handleDieselEntryChange = (gId, idx, field, val) => {
    setDieselEntries(prev => {
       const next = {...prev};
       if (!next[gId]) return prev;
       const arr = [...next[gId]];
       arr[idx] = { ...arr[idx], [field]: val };
       arr[idx].duration = parseDurationToHours(calcDuration(arr[idx].startTime, arr[idx].endTime));
       next[gId] = arr;
       return next;
    });
  };

  /** Add a new time slot for the given date (inserted right after the last existing slot for that date) */
  const handleAddSlotForDate = (gId, date) => {
    setDieselEntries(prev => {
      const arr = [...(prev[gId] || [])];
      const lastIdx = arr.reduce((acc, e, i) => (e.date === date ? i : acc), -1);
      const newSlot = { date, startTime: '00:00', endTime: '00:00', duration: 0 };
      if (lastIdx === -1) {
        arr.push(newSlot);
      } else {
        arr.splice(lastIdx + 1, 0, newSlot);
      }
      return { ...prev, [gId]: arr };
    });
  };

  /** Remove the time slot at absolute index idx for the given generator */
  const handleRemoveSlot = (gId, idx) => {
    setDieselEntries(prev => {
      const arr = [...(prev[gId] || [])];
      arr.splice(idx, 1);
      return { ...prev, [gId]: arr };
    });
  };

  const handleDiscountChange = (val, totalAmt) => {
    const cleaned = numOnly(val);
    const numeric = cleaned === '' ? 0 : Math.max(0, parseFloat(cleaned) || 0);
    setDiscount(numeric);
    if (numeric > totalAmt) {
      setDiscountError(`Discount cannot exceed Total Amount (₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`);
    } else {
      setDiscountError('');
    }
  };

  /* ── Core calculations ── */
  const rentalDays = useMemo(() => parseRentalDays(order?.functionDate), [order]);
  const withDiesel = order?.dieselType !== 'PARTY'; // true = company diesel = charges apply
  const cableRequired = order?.cableRequired ?? true;

  const calculations = useMemo(() => {
    if (!order) return { items: [], totalAmount: 0 };

    let totalAmount = 0;

    const items = (order.generators || []).map(g => {
      // Use g.id (backend numeric) or g._id (mock/frontend) as the stable key
      const gKey = g.id ?? g._id;

      // ── Generator Rent ──────────────────────────────────────────────────
      const rentDay     = parseFloat(rentPerDay[gKey]) || 0;
      const genAmount   = parseFloat((rentDay * rentalDays).toFixed(2));

      // ── Diesel Charge (only when withDiesel = true) ─────────────────────
      const dPrice = parseFloat(dieselPerHour[gKey]) || 0;
      let dieselAmount = 0;
      let totalDieselHours = 0;
      const entries = dieselEntries[gKey] || [];
      if (withDiesel) {
          entries.forEach(e => {
             totalDieselHours += e.duration;
          });
          dieselAmount = parseFloat((dPrice * totalDieselHours).toFixed(2));
      }

      // ── Cable Charge (only when cableRequired AND cable selected) ────────
      const cableSize   = g.cableSize || '';
      const rawCableRate = cableRatePerDay[gKey];
      const cableRate   = (cableRequired && cableSize)
        ? (rawCableRate !== undefined && rawCableRate !== '' ? (parseFloat(rawCableRate) || 0) : getCableRate(cableSize))
        : 0;
      const cableAmount = parseFloat((cableRate * rentalDays).toFixed(2));

      // ── Row Total ────────────────────────────────────────────────────────
      const rowTotal = genAmount + dieselAmount + cableAmount;
      totalAmount += rowTotal;

      // Build per-date group map: { dateStr -> [indices into entries array] }
      const dateGroupMap = {};
      entries.forEach((e, i) => {
        if (!dateGroupMap[e.date]) dateGroupMap[e.date] = [];
        dateGroupMap[e.date].push(i);
      });

      return {
        ...g,
        _key: gKey, // stable key for state lookups
        rentDay, genAmount,
        entries, totalDieselHours, dPrice, dieselAmount,
        dateGroupMap,
        cableSize, cableRate, cableAmount,
        rowTotal,
      };
    });

    return { items, totalAmount: parseFloat(totalAmount.toFixed(2)) };
  }, [order, rentPerDay, dieselPerHour, cableRatePerDay, dieselEntries, rentalDays, withDiesel, cableRequired]);

  const discountVal = parseFloat(discount) || 0;
  const otherChargesTotal = otherCharges.reduce((sum, oc) => sum + (parseFloat(oc.amount) || 0), 0);
  const netTotal    = Math.max(0, parseFloat((calculations.totalAmount + otherChargesTotal - discountVal).toFixed(2)));
  const amountWords = numberToWords(netTotal);

  /* ── Other Charges handlers ── */
  const handleAddOtherCharge = () => setOtherCharges(prev => [...prev, { name: '', amount: '' }]);
  const handleRemoveOtherCharge = (idx) => setOtherCharges(prev => prev.filter((_, i) => i !== idx));
  const handleOtherChargeChange = (idx, field, val) => {
    setOtherCharges(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === 'amount' ? numOnly(val) : val };
      return next;
    });
  };

  /**
   * Detect overlapping or identical time slots within the same date for each generator.
   * Returns: { [gId]: { [slotIdx]: 'error message' } }
   */
  const dieselConflicts = useMemo(() => {
    const toMin = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const result = {};
    Object.entries(dieselEntries).forEach(([gId, entries]) => {
      // Group indices by date
      const byDate = {};
      entries.forEach((e, i) => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(i);
      });
      const gConflicts = {};
      Object.values(byDate).forEach(idxGroup => {
        if (idxGroup.length < 2) return;
        for (let a = 0; a < idxGroup.length; a++) {
          for (let b = a + 1; b < idxGroup.length; b++) {
            const slotA = entries[idxGroup[a]];
            const slotB = entries[idxGroup[b]];
            const aS = toMin(slotA.startTime), aE = toMin(slotA.endTime);
            const bS = toMin(slotB.startTime), bE = toMin(slotB.endTime);
            // Two slots overlap when one starts before the other ends
            if (aS < bE && bS < aE) {
              const msg = (aS === bS && aE === bE)
                ? 'Identical time as another slot on this date'
                : 'Overlaps with another slot on this date';
              gConflicts[idxGroup[a]] = msg;
              gConflicts[idxGroup[b]] = msg;
            }
          }
        }
      });
      if (Object.keys(gConflicts).length > 0) result[gId] = gConflicts;
    });
    return result;
  }, [dieselEntries]);

  const hasDieselConflicts = Object.keys(dieselConflicts).length > 0;

  const handleSaveBill = (isCompleteCall = false) => {
    // Validate rent prices
    const newRentErrors = {};
    let hasError = false;
    (order?.generators || []).forEach(g => {
      const gKey = g.id ?? g._id;
      const p = rentPerDay[gKey];
      if (p === '' || p === null || p === undefined) {
        newRentErrors[gKey] = 'Rent per day is required';
        hasError = true;
      }
    });
    setRentErrors(newRentErrors);
    if (discountError) hasError = true;
    // Block save if any diesel slots overlap on the same date
    if (hasDieselConflicts) hasError = true;
    if (hasError) return;

    setSaving(true);
    const req = {
       discountAmount: discountVal,
       paymentDueDate: paymentDueDate || null,
       generators: (order?.generators || []).map(g => {
           const gKey = g.id || g._id;
           const rawCableRate = cableRatePerDay[gKey];
           const cRate = (cableRequired && g.cableSize)
             ? (rawCableRate !== undefined && rawCableRate !== '' ? (parseFloat(rawCableRate) || 0) : getCableRate(g.cableSize))
             : 0;
           return {
               orderItemId: g.id,
               rentPerDay: parseFloat(rentPerDay[gKey]) || 0,
               dieselPerHour: parseFloat(dieselPerHour[gKey]) || 0,
               cableRate: cRate,
               dieselEntries: (dieselEntries[gKey] || []).map(e => {
                   const parsed = parseDateStr(e.date);
                   const ymd = parsed ? `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}` : e.date;
                   return {
                       entryDate: ymd,
                       startTime: e.startTime,
                       endTime: e.endTime,
                       duration: e.duration
                   };
               })
           };
       }),
       // Include valid other charges only (must have at least an amount)
       otherCharges: otherCharges
         .filter(oc => parseFloat(oc.amount) > 0)
         .map(oc => ({ name: oc.name.trim() || 'Other Charge', amount: parseFloat(oc.amount) || 0 }))
    };
    
    generatorOrderService.updateBilling(id, req)
       .then((res) => {
           setOrder(res);
           // Bill number is only assigned after completeBilling — keep whatever is already shown
           if (res.billNumber) setBillNo(res.billNumber);
           setToast({ title: 'Bill Saved!', msg: `Billing data saved successfully.` });
           if (showCompleteModal) {
               generatorOrderService.completeBilling(id).then((completeRes) => {
                   setOrder(completeRes);
                   // Bill number is now assigned — update state
                   setBillNo(completeRes.billNumber || '—');
                   setIsCompleted(true);
                   setShowCompleteModal(false);
                   setToast({ title: 'Bill Completed!', msg: `Bill No: ${completeRes.billNumber || '—'} has been locked.` });
               }).catch(e => {
                   console.error('completeBilling failed', e);
                   alert('Failed to complete bill. Please try again.');
               });
           }
       })
       .catch(e => {
           alert("Failed to save bill");
           console.error(e);
       })
       .finally(() => setSaving(false));
  };

  /* ── PDF Invoice ── */
  const handlePrintPDF = (e) => {
    e.preventDefault();
    const printWin = window.open('', '_blank', 'width=920,height=1060');
    if (!printWin) { alert('Please allow popups to print invoices.'); return; }

    const billingDate = formatToDMY(new Date());
    const fmtCurrency = (n) => `₹${(parseFloat(n)||0).toLocaleString('en-IN', { minimumFractionDigits:2 })}`;
    const fmtDate = (d) => formatToDMY(d);
    const fmtFuncDate = (str) => formatRangeToDMY(str);

    const rows = calculations.items.map((g, idx) => `
      <tr>
        <td rowspan="${(g.cableSize && cableRequired ? 1 : 0) + (withDiesel && g.entries ? g.entries.length : 0) + 1}" style="border:1px solid #cbd5e1;padding:9px 10px;text-align:center;font-size:13px;vertical-align:top;">${idx+1}</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;font-size:13px;font-weight:700;">${g.generatorName}</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:right;font-size:12px;font-family:monospace;">${fmtCurrency(g.rentDay)}/day</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:center;font-size:12px;">${rentalDays} day${rentalDays!==1?'s':''}</td>
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:center;font-size:12px;">—</td>
        ${withDiesel ? `<td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td>` : ''}
        <td style="border:1px solid #cbd5e1;padding:9px 10px;text-align:right;font-size:13px;font-weight:800;color:#1e40af;font-family:monospace;">${fmtCurrency(g.genAmount)}</td>
      </tr>
      ${withDiesel && g.entries ? g.entries.map((de, dIdx) => {
        const isFirstForDate = dIdx === 0 || g.entries[dIdx - 1].date !== de.date;
        return `<tr style="background:#fffbeb;">
        ${dIdx === 0 ? `<td rowspan="${g.entries.length}" style="border:1px solid #cbd5e1;padding:8px 10px;font-size:12.5px;color:#92400e;padding-left:18px;">⛽ Diesel Charge</td>` : ''}
        ${dIdx === 0 ? `<td rowspan="${g.entries.length}" style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:12px;font-family:monospace;color:#92400e;">${fmtCurrency(g.dPrice)}/hr</td>` : ''}
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">—</td>
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:${isFirstForDate ? '#92400e' : '#b45309'};font-weight:${isFirstForDate ? '600' : '400'}">${isFirstForDate ? fmtDate(de.date) : '&#8627;'}</td>
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">${de.startTime}</td>
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">${de.endTime}</td>
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#92400e;">${formatDurationDisplay(de.duration)}</td>
        ${dIdx === 0 ? `<td rowspan="${g.entries.length}" style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:13px;font-weight:700;color:#92400e;font-family:monospace;">${fmtCurrency(g.dieselAmount)}</td>` : ''}
      </tr>`;
      }).join('') : ''}
      ${(g.cableSize && cableRequired) ? `<tr style="background:#eff6ff;">
        <td style="border:1px solid #cbd5e1;padding:8px 10px;font-size:12.5px;color:#1e40af;padding-left:18px;">🔌 Cable ${g.cableSize}${g.cableSize!=='Earth Rod'?' mm²':''}</td>
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:12px;font-family:monospace;color:#1e40af;">${fmtCurrency(g.cableRate)}/day</td>
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#1e40af;">${rentalDays} day${rentalDays!==1?'s':''}</td>
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:12px;color:#1e40af;">—</td>
        ${withDiesel ? `<td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td>` : ''}
        <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:13px;font-weight:700;color:#1e40af;font-family:monospace;">${fmtCurrency(g.cableAmount)}</td>
      </tr>` : ''}
    `).join('');

    const html = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Invoice</title>
      <style>
        @page{margin:0;size:A4} @media print{body{padding:10mm !important} html{-webkit-print-color-adjust:exact}}
        *{box-sizing:border-box} body{font-family:Arial,sans-serif;color:#1e293b;margin:0;padding:24px;background:#fff;font-size:13px}
        .box{max-width:860px;margin:auto}
        .hdr{border-bottom:2px solid #1e40af;padding-bottom:14px;margin-bottom:18px}
        .hdr-title{text-align:center;font-size:24px;font-weight:900;color:#0f172a;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
        .hdr-row{display:flex;justify-content:space-between;align-items:center;gap:15px}
        .hdr-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
        .meta{flex-shrink:0} .meta table{border-collapse:collapse} .meta table td{padding:3px 6px;font-size:12.5px;white-space:nowrap} .meta table td:first-child{color:#64748b;min-width:95px;font-weight:600} .meta table td:last-child{font-weight:700}
        .sec{display:flex;border:1px solid #e2e8f0;margin-bottom:12px}
        .half{flex:1;padding:12px 14px} .half:first-child{border-right:1px solid #e2e8f0}
        .slabel{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:1px solid #f1f5f9;padding-bottom:3px;margin-bottom:6px}
        .dr{display:flex;margin:4px 0;font-size:13px} .dk{min-width:130px;color:#64748b} .dv{font-weight:600;color:#0f172a}
        .site{padding:10px 14px;border:1px solid #e2e8f0;border-top:none;margin-bottom:14px}
        .inv-table{width:100%;border-collapse:collapse;margin-bottom:0}
        .inv-table th{background:#f8fafc;border:1px solid #cbd5e1;padding:8px 10px;font-size:10.5px;font-weight:700;text-transform:uppercase;color:#475569}
        .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#475569}
        .summary{display:flex;justify-content:flex-end;margin:16px 0 6px}
        .stbl{width:300px} .stbl td{padding:6px 0;font-size:14px} .stbl td:last-child{text-align:right;font-family:monospace;font-weight:600}
        .net-row td{font-size:18px;font-weight:800;color:#1e40af;border-top:2px solid #cbd5e1;padding-top:10px}
        .words{font-style:italic;font-size:11.5px;color:#1e40af;font-weight:700;text-align:right;margin-bottom:24px}
        .footer{border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;font-size:11px;color:#94a3b8}
        @media print{body{padding:0}}
      </style></head><body>
      <div class="box">
        <div class="hdr">
          <div class="hdr-title">TAX INVOICE</div>
          <div class="hdr-row">
            <div class="hdr-left" style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;">
              <img src="/images/avadhut-logo.png" alt="Avadhut" style="height:90px;object-fit:contain;display:block;flex-shrink:0;" onerror="this.style.display='none'"/>
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;flex:1;min-width:0;">
                <div style="font-size:20px;font-weight:800;color:#cc0000;line-height:1.2;white-space:nowrap;margin-bottom:3px;">Avadhut Light Decoration &amp; Sound</div>
                <div style="font-size:12px;color:#475569;font-weight:500;line-height:1.3;margin-bottom:2px;white-space:nowrap;">Main Market Road, Sector 12, Navi Mumbai, Maharashtra - 400701</div>
                <div style="font-size:12px;color:#475569;font-weight:600;line-height:1.3;white-space:nowrap;">Mo. No.: +91 98765 43210 / +91 91112 22333</div>
              </div>
            </div>
            <div class="meta">
              <table><tr><td>Bill Number</td><td>: #${billNo}</td></tr><tr><td>Order Number</td><td>: ${order.orderNumber || order.id}</td></tr><tr><td>Billing Date</td><td>: ${billingDate}</td></tr></table>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="half"><div class="slabel">Client Details</div>
            <div class="dr"><span class="dk">Name</span><span class="dv">: ${order.clientName||'—'}</span></div>
            <div class="dr"><span class="dk">Contact</span><span class="dv">: ${order.contactNumber||'—'}</span></div>
            ${order.alternateMobile?`<div class="dr"><span class="dk">Alt. Mobile</span><span class="dv">: ${order.alternateMobile}</span></div>`:''}
          </div>
          <div class="half"><div class="slabel">Service Details</div>
            <div class="dr"><span class="dk">Function Date</span><span class="dv">: ${fmtFuncDate(order.functionDate)}</span></div>
          </div>
        </div>
        <div class="site">
          <div class="slabel">Site Address</div>
          <div style="font-size:13px;font-weight:600;margin-top:4px;">${order.siteAddress||'—'}</div>
          ${order.siteAddressLink?`<div style="font-size:12px;margin-top:3px;"><a href="${order.siteAddressLink}" style="color:#2563eb;">${order.siteAddressLink}</a></div>`:''}
        </div>

        <div class="info-box">
          <strong>Calculation Summary:</strong> &nbsp;
          Rental = <strong>${rentalDays} day${rentalDays!==1?'s':''}</strong> &nbsp;|&nbsp;
          ${withDiesel ? 'Diesel charges calculated from Diesel Start → End time' : 'No diesel charges (Party Diesel)'} &nbsp;|&nbsp;
          ${order.cableRequired ? 'Cable charges added per rental day' : 'No cable charges'}
        </div>

        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#475569;margin-bottom:6px;">Generator Rent Calculation</div>
        <table class="inv-table">
          <thead><tr>
            <th style="width:36px;text-align:center;">#</th>
            <th style="text-align:left;">Description</th>
            <th style="text-align:right;">Rate</th>
            <th style="text-align:center;">Days</th>
            <th style="text-align:center;">Date</th>
            ${withDiesel ? '<th style="text-align:center;">Start Time</th><th style="text-align:center;">End Time</th><th style="text-align:center;">Diesel Hrs</th>' : ''}
            <th style="text-align:right;color:#1e40af;">Amount</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>

        ${otherCharges.filter(oc => parseFloat(oc.amount) > 0).length > 0 ? `
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6366f1;margin-bottom:6px;margin-top:14px;">Other Charges</div>
        <table class="inv-table">
          <thead><tr>
            <th style="width:36px;text-align:center;">#</th>
            <th style="text-align:left;">Description</th>
            <th style="text-align:right;color:#6366f1;">Amount</th>
          </tr></thead>
          <tbody>
            ${otherCharges.filter(oc => parseFloat(oc.amount) > 0).map((oc, i) => `
              <tr style="background:#f5f3ff;">
                <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;font-size:13px;">${i + 1}</td>
                <td style="border:1px solid #cbd5e1;padding:8px 10px;font-size:13px;font-weight:600;color:#4338ca;">${oc.name || 'Other Charge'}</td>
                <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:13px;font-weight:700;color:#4338ca;font-family:monospace;">${fmtCurrency(parseFloat(oc.amount) || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="summary">
          <table class="stbl">
            <tr><td style="color:#64748b;font-weight:500;">Generator Total :</td><td>${fmtCurrency(calculations.totalAmount)}</td></tr>
            ${otherChargesTotal > 0 ? `<tr><td style="color:#6366f1;font-weight:500;">Other Charges :</td><td style="color:#6366f1;">+ ${fmtCurrency(otherChargesTotal)}</td></tr>` : ''}
            <tr><td style="color:#dc2626;font-weight:500;">Discount :</td><td style="color:#dc2626;">- ${fmtCurrency(discountVal)}</td></tr>
            <tr class="net-row"><td>Net Total:</td><td>${fmtCurrency(netTotal)}</td></tr>
          </table>
        </div>
        <div class="words">(${amountWords})</div>

        <div class="footer">
          <p>Thank you for your business. Please make payments before due date.</p>
          <p>© ${new Date().getFullYear()} Avadhut ERP Systems. All rights reserved.</p>
        </div>
      </div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`;
    printWin.document.write(html);
    printWin.document.close();
  };

  const getWhatsAppShareUrl = () => {
    if (!order) return '';
    const formattedPhone = order.contactNumber 
      ? (order.contactNumber.startsWith('91') || order.contactNumber.startsWith('+91') 
          ? order.contactNumber 
          : '91' + order.contactNumber) 
      : '';
    const cleanPhone = formattedPhone.replace(/\D/g, '');
    
    const message = `Hello *${order.clientName || 'Valued Client'}*,\n\nYour invoice for generator order *${order.orderNumber || ''}* (Bill No: *${billNo}*) has been completed.\n\n*Net Total:* ₹${netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nPlease find the attached invoice PDF.\n\nThank you for choosing Avadhut Lights & Decoration!\n\nBest regards,\n*Avadhut Lights & Decoration*`;
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  const getEmailShareUrl = () => {
    if (!order) return '';
    const subject = `Invoice from Avadhut Lights & Decoration - Bill #${billNo}`;
    
    const message = `Dear ${order.clientName || 'Client'},\n\nYour invoice for generator order ${order.orderNumber} (Bill No: ${billNo}) has been completed.\n\nHere are the billing details:\n- Invoice Number: #${billNo}\n- Order Number: ${order.orderNumber}\n- Net Total Amount: Rs. ${netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nPlease find the attached invoice PDF for your records.\n\nThank you for choosing Avadhut Lights & Decoration!\n\nBest regards,\nAvadhut Lights & Decoration`;
    
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  const handleSharePDF = (e) => {
    e.preventDefault();
    setShowShareModal(true);
  };

  /* ── Build share-compatible order object for InvoiceShareModal ── */
  const shareOrderData = order ? {
    ...order,
    orderNumber: order.orderNumber || order.id,
    contactNumber: order.contactNumber,
  } : null;

  /* ── Render ── */
  if (loading) return <><style>{STYLES}</style><SkeletonForm /></>;
  if (!order) return (
    <><style>{STYLES}</style>
      <div className="gb2-page" style={{ textAlign:'center', paddingTop:80 }}>
        <h3>Order not found.</h3>
        <button className="gb2-btn gb2-btn-cancel" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>Back to Orders</button>
      </div>
    </>
  );

  const fmtCurrency = (n) => `₹${(parseFloat(n)||0).toLocaleString('en-IN', { minimumFractionDigits:2 })}`;

  return (
    <>
      <style>{STYLES}</style>
      <div className="gb2-page">

        {/* ── Header ── */}
        <div className="gb2-header">
          <button className="gb2-back-btn" id="btn-back" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="gb2-page-title">Generate Order Invoice</h1>
            <p className="gb2-breadcrumb">
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS); }}>Generator</a>
              {' › '}
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATOR_ORDERS); }}>Orders</a>
              {' › '}
              <a href="#" onClick={e => { e.preventDefault(); }}>{order.id}</a>
              {' › Billing'}
            </p>
          </div>
        </div>

        {/* ── SECTION 1: ORDER REFERENCE ── */}
        <CardSection icon={Icon.User} title="Order Reference (Read-Only)">
          <div className="gb2-grid-3" style={{ marginBottom:18 }}>
            <div className="gb2-field"><Label>Order Number</Label><input className="gb2-input" value={order.orderNumber || order.id} disabled readOnly /></div>
            <div className="gb2-field"><Label>Client Name</Label><input className="gb2-input" value={order.clientName} disabled readOnly /></div>
            <div className="gb2-field"><Label>Contact Number</Label><input className="gb2-input" value={order.contactNumber} disabled readOnly /></div>
          </div>
          <div className="gb2-grid-3" style={{ marginBottom:18 }}>
            <div className="gb2-field"><Label>Alternate Mobile</Label><input className="gb2-input" value={order.alternateMobile || '—'} disabled readOnly /></div>
            <div className="gb2-field"><Label>Function Date</Label>
              <input className="gb2-input" value={formatRangeToDMY(order.functionDate || (order.functionDateFrom && order.functionDateTo ? `${order.functionDateFrom} to ${order.functionDateTo}` : ''))} disabled readOnly />
            </div>
            <div className="gb2-field"><Label>Rental Days</Label>
              <input className="gb2-input" style={{ fontWeight:700, color:'var(--color-primary-dark)' }}
                value={`${rentalDays} day${rentalDays!==1?'s':''}`} disabled readOnly />
            </div>
          </div>
          <div className="gb2-grid-3" style={{ marginBottom:18 }}>
            <div className="gb2-field"><Label>Operator Name</Label><input className="gb2-input" value={order.operatorName || '—'} disabled readOnly /></div>
            <div className="gb2-field"><Label>Cable Required</Label>
              <input className="gb2-input" style={{ fontWeight:700, color: order.cableRequired ? '#065F46' : '#991B1B' }}
                value={order.cableRequired ? '✓ Yes - Cable charges apply' : '✗ No - No cable charges'} disabled readOnly />
            </div>
            <div className="gb2-field"><Label>Diesel</Label>
              <input className="gb2-input" style={{ fontWeight:700, color: withDiesel ? '#92400e' : '#475569' }}
                value={withDiesel ? 'With Diesel - Diesel charges apply' : 'Party Diesel — No diesel charges'} disabled readOnly />
            </div>
          </div>
          <div className="gb2-field" style={{ marginBottom:18 }}>
            <Label>Site Address</Label>
            <textarea className="gb2-textarea" value={order.siteAddress} rows={2} disabled readOnly />
          </div>
          {order.siteAddressLink && (
            <div className="gb2-field">
              <Label>Site Address Link</Label>
              <a href={order.siteAddressLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:13.5, color:'var(--color-primary)', fontWeight:600, wordBreak:'break-all' }}>
                🗺 {order.siteAddressLink}
              </a>
            </div>
          )}
        </CardSection>

        {/* ── SECTION 2: BILL INFO ── */}
        <CardSection icon={Icon.Receipt} title="Bill Information">
          <div className="gb2-grid-3">
            <div className="gb2-field"><Label>Bill Number</Label>
              <input className="gb2-input" style={{ background:'var(--color-surface-2)', fontStyle:'italic', fontWeight:600 }}
                value={billNo} disabled readOnly />
            </div>
            <div className="gb2-field"><Label>Billing Date</Label>
              <input className="gb2-input" style={{ background:'var(--color-surface-2)' }}
                value={formatToDMY(new Date())}
                disabled readOnly />
            </div>
            <div className="gb2-field">
              <Label>Due Date</Label>
              <input
                className="gb2-input"
                type="date"
                value={paymentDueDate}
                disabled={isCompleted}
                onChange={e => setPaymentDueDate(e.target.value)}
                style={{ fontWeight:600 }}
              />
            </div>
          </div>
          {/* Payment Status badge */}
          {order?.paymentStatus && (
            <div style={{ marginTop:10 }}>
              <Label>Payment Status</Label>
              <span style={{
                display:'inline-block', marginTop:4, padding:'4px 14px', borderRadius:20, fontWeight:700, fontSize:12,
                background: order.paymentStatus === 'PAID' ? '#dcfce7' : order.paymentStatus === 'OVERDUE' ? '#fee2e2' : '#fef9c3',
                color: order.paymentStatus === 'PAID' ? '#166534' : order.paymentStatus === 'OVERDUE' ? '#991b1b' : '#854d0e',
              }}>
                {order.paymentStatus === 'PAID' ? '✓ Paid' : order.paymentStatus === 'OVERDUE' ? '⚠ Overdue' : '⏳ Pending'}
              </span>
            </div>
          )}
        </CardSection>

        {/* ── SECTION 3: RENT CALCULATION ── */}
        <CardSection icon={Icon.Zap} title="Generator Rent Calculation">

          {/* Info banner */}
          <div className="gb2-info-banner">
            <span>📋</span>
            <span>
              <strong>Billing for {rentalDays} day{rentalDays!==1?'s':''}</strong>
              {' — '}Generator Rent = Rent/Day × Days
              {withDiesel && <> · <strong>Diesel</strong> = ₹/Hr × Diesel Hours</>}
              {cableRequired && <> · <strong>Cable</strong> = Rate/Day × Days (only if cable selected)</>}
            </span>
          </div>

          {/* ── Conflict warning banner ── */}
          {hasDieselConflicts && withDiesel && (
            <div style={{
              display:'flex', gap:10, alignItems:'flex-start', padding:'11px 16px',
              background:'linear-gradient(135deg,#fff5f5,#fee2e2)',
              border:'1.5px solid #fca5a5', borderRadius:10, marginBottom:16,
              fontSize:13, color:'#991b1b', fontWeight:600,
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
              <span>
                <strong>Time slot conflict detected.</strong>{' '}
                Two or more diesel slots on the same date have identical or overlapping times.
                Please fix the highlighted rows before saving.
              </span>
            </div>
          )}

          <div className="gb2-table-wrap">
            <table className="gb2-table">
              <colgroup>
                <col style={{ width:44 }} />
                <col style={{ minWidth:160 }} />
                <col style={{ width:120 }} />   {/* Rate input */}
                <col style={{ width:80 }} />    {/* Days/Qty */}
                <col style={{ width:110 }} />   {/* Date */}
                {withDiesel && <col style={{ width:90 }} />}  {/* Diesel Start */}
                {withDiesel && <col style={{ width:90 }} />}  {/* Diesel End */}
                {withDiesel && <col style={{ minWidth:105, width:115 }} />}  {/* Diesel Hrs */}
                {withDiesel && <col style={{ width:60 }} />}  {/* Slot Actions */}
                <col style={{ width:140 }} />   {/* Amount */}
              </colgroup>
              <thead>
                <tr>
                  <th className="gb2-th">#</th>
                  <th className="gb2-th">Description</th>
                  <th className="gb2-th" style={{ textAlign:'right' }}>Rate</th>
                  <th className="gb2-th" style={{ textAlign:'center' }}>Days</th>
                  <th className="gb2-th" style={{ textAlign:'center' }}>Date</th>
                  {withDiesel && <th className="gb2-th" style={{ textAlign:'center' }}>Start Time</th>}
                  {withDiesel && <th className="gb2-th" style={{ textAlign:'center' }}>End Time</th>}
                  {withDiesel && <th className="gb2-th" style={{ textAlign:'center' }}>Diesel Hrs</th>}
                  {withDiesel && <th className="gb2-th" style={{ textAlign:'center', width:60 }}></th>}
                  <th className="gb2-th" style={{ textAlign:'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {calculations.items.map((g, idx) => (
                  <React.Fragment key={g._key || g.id || g._id || idx}>

                    {/* ── Generator Rent Row ── */}
                    <tr className="gb2-tr-gen">
                      <td className="gb2-td" rowSpan={1 + (withDiesel ? (g.entries?.length || 0) : 0) + (g.cableSize && cableRequired ? 1 : 0)}
                        style={{ verticalAlign:'top', color:'var(--color-text-subtle)', fontWeight:700, paddingTop:14 }}>
                        {idx+1}
                      </td>
                      <td className="gb2-td" style={{ fontWeight:700, color:'var(--color-primary-dark)' }}>
                        {g.generatorName}
                        <div style={{ fontSize:11, color:'var(--color-text-subtle)', fontWeight:400, marginTop:2 }}>
                          Generator Rent × {rentalDays} day{rentalDays!==1?'s':''}
                        </div>
                      </td>
                      <td className="gb2-td" style={{ textAlign:'right' }}>
                        <NumInput
                          id={`inp-rent-${idx}`}
                          value={rentPerDay[g._key] ?? ''}
                          onChange={val => handleRentChange(g._key, val)}
                          onBlur={() => handleRentBlur(g._key, rentPerDay[g._key])}
                          placeholder="₹/day"
                          error={rentErrors[g._key]}
                          disabled={isCompleted}
                        />
                        <div style={{ fontSize:10.5, color:'var(--color-text-subtle)', marginTop:3, textAlign:'right' }}>₹/day</div>
                      </td>
                      <td className="gb2-td" style={{ textAlign:'center', fontWeight:700, color:'var(--color-text)' }}>
                        {rentalDays}
                      </td>
                      <td className="gb2-td" style={{ textAlign:'center', fontWeight:700, color:'var(--color-text)' }}>
                        —
                      </td>
                      {withDiesel && <td className="gb2-td" />}
                      {withDiesel && <td className="gb2-td" />}
                      {withDiesel && <td className="gb2-td" />}
                      {withDiesel && <td className="gb2-td" />}  {/* Actions placeholder */}
                      <td className="gb2-td" style={{ textAlign:'right', fontWeight:700, fontFamily:'monospace', color:'var(--color-primary-dark)' }}>
                        {fmtCurrency(g.genAmount)}
                      </td>
                    </tr>

                    {/* ── Diesel Rows (only when withDiesel) — supports multiple slots per date ── */}
                    {withDiesel && g.entries && g.entries.map((de, dIdx) => {
                      const slotsForDate = (g.dateGroupMap && g.dateGroupMap[de.date]) || [];
                      const isFirstForDate = slotsForDate.length === 0 || slotsForDate[0] === dIdx;
                      const isLastForDate  = slotsForDate.length === 0 || slotsForDate[slotsForDate.length - 1] === dIdx;
                      const slotCount = slotsForDate.length;
                      return (
                        <tr className="gb2-tr-diesel" key={`diesel-${g._key}-${dIdx}`}>
                          {dIdx === 0 ? (
                            <td className="gb2-td" style={{ paddingLeft:20 }} rowSpan={g.entries.length}>
                              <span className="gb2-badge gb2-badge-diesel">⛽ Diesel</span>
                              <div style={{ fontSize:11, color:'var(--color-text-subtle)', marginTop:2 }}>
                                ₹/hr × {formatDurationDisplay(g.totalDieselHours)}
                              </div>
                            </td>
                          ) : null}
                          {dIdx === 0 ? (
                            <td className="gb2-td" style={{ textAlign:'right' }} rowSpan={g.entries.length}>
                              <NumInput
                                id={`inp-diesel-price-${idx}`}
                                value={dieselPerHour[g._key] ?? ''}
                                onChange={val => handleDieselPriceChange(g._key, val)}
                                placeholder="₹/hr"
                                error={dieselErrors[g.id || g._id]}
                                disabled={isCompleted}
                              />
                              <div style={{ fontSize:10.5, color:'var(--color-text-subtle)', marginTop:3, textAlign:'right' }}>₹/hr</div>
                            </td>
                          ) : null}
                          {/* Days column */}
                          <td className="gb2-td" style={{ textAlign:'center', color:'#92400e', fontWeight:600 }}>—</td>
                          {/* Date column — show date on first slot, continuation marker on subsequent slots */}
                          <td className="gb2-td" style={{ textAlign:'center', color: isFirstForDate ? '#92400e' : '#b45309', fontWeight: isFirstForDate ? 600 : 400 }}>
                            {isFirstForDate
                              ? formatToDMY(de.date)
                              : <span style={{ fontSize:11, color:'#d97706', fontStyle:'italic' }}>↳ same day</span>
                            }
                          </td>
                          {/* Diesel Start */}
                          <td className="gb2-td" style={{ textAlign:'center' }}>
                            <input type="time" className="gb2-inp-time" disabled={isCompleted}
                              style={{ borderColor: dieselConflicts[g._key]?.[dIdx] ? '#ef4444' : undefined }}
                              value={de.startTime || '00:00'}
                              onChange={e => handleDieselEntryChange(g._key, dIdx, 'startTime', e.target.value)} />
                          </td>
                          {/* Diesel End */}
                          <td className="gb2-td" style={{ textAlign:'center' }}>
                            <input type="time" className="gb2-inp-time" disabled={isCompleted}
                              style={{ borderColor: dieselConflicts[g._key]?.[dIdx] ? '#ef4444' : undefined }}
                              value={de.endTime || '00:00'}
                              onChange={e => handleDieselEntryChange(g._key, dIdx, 'endTime', e.target.value)} />
                          </td>
                          {/* Diesel Hours — shows conflict warning inline when there's an overlap */}
                          <td className="gb2-td" style={{ textAlign:'center' }}>
                            <div style={{ fontWeight:700, color: dieselConflicts[g._key]?.[dIdx] ? '#dc2626' : '#92400e', whiteSpace:'nowrap' }}>
                              {formatDurationDisplay(de.duration)}
                            </div>
                            {dieselConflicts[g._key]?.[dIdx] && (
                              <div style={{ fontSize:10, color:'#dc2626', marginTop:2, whiteSpace:'nowrap', fontWeight:600 }}>
                                ⚠ {dieselConflicts[g._key][dIdx]}
                              </div>
                            )}
                          </td>
                          {/* Actions: remove slot (×) and/or add slot (+) */}
                          <td className="gb2-td" style={{ textAlign:'center', padding:'6px 8px' }}>
                            {!isCompleted && (
                              <div style={{ display:'flex', gap:4, justifyContent:'center', alignItems:'center' }}>
                                {slotCount > 1 && (
                                  <button
                                    className="gb2-slot-btn gb2-slot-btn-remove"
                                    type="button"
                                    onClick={() => handleRemoveSlot(g._key, dIdx)}
                                    title="Remove this time slot"
                                  >×</button>
                                )}
                                {isLastForDate && (
                                  <button
                                    className="gb2-slot-btn gb2-slot-btn-add"
                                    type="button"
                                    onClick={() => handleAddSlotForDate(g._key, de.date)}
                                    title="Add another time slot for this date"
                                  >+</button>
                                )}
                              </div>
                            )}
                          </td>
                          {dIdx === 0 ? (
                            <td className="gb2-td" style={{ textAlign:'right', fontWeight:700, fontFamily:'monospace', color:'#92400e' }} rowSpan={g.entries.length}>
                              {fmtCurrency(g.dieselAmount)}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}

                    {/* ── Cable Row (only when cableRequired AND cableSize selected) ── */}
                    {g.cableSize && cableRequired && (
                      <tr className="gb2-tr-cable">
                        <td className="gb2-td" style={{ paddingLeft:20 }}>
                          <span className="gb2-badge gb2-badge-cable">🔌 Cable {g.cableSize}{g.cableSize!=='Earth Rod'?' mm²':''}</span>
                          <div style={{ fontSize:11, color:'var(--color-text-subtle)', marginTop:2 }}>
                            {fmtCurrency(g.cableRate)}/day × {rentalDays} day{rentalDays!==1?'s':''}
                          </div>
                        </td>
                        <td className="gb2-td" style={{ textAlign:'right' }}>
                          <NumInput
                            id={`inp-cable-rate-${idx}`}
                            value={cableRatePerDay[g._key] ?? (g.cableSize ? getCableRate(g.cableSize) : '')}
                            onChange={val => handleCableRateChange(g._key, val)}
                            placeholder="₹/day"
                            disabled={isCompleted}
                          />
                          <div style={{ fontSize:10.5, color:'var(--color-text-subtle)', marginTop:3, textAlign:'right' }}>₹/day</div>
                        </td>
                        <td className="gb2-td" style={{ textAlign:'center', fontWeight:700, color:'#1e40af' }}>
                          {rentalDays}
                        </td>
                        <td className="gb2-td" style={{ textAlign:'center', color:'#94a3b8' }}>—</td>
                        {withDiesel && <td className="gb2-td" />}
                        {withDiesel && <td className="gb2-td" />}
                        {withDiesel && <td className="gb2-td" />}
                        {withDiesel && <td className="gb2-td" />}  {/* Actions placeholder */}
                        <td className="gb2-td" style={{ textAlign:'right', fontWeight:700, fontFamily:'monospace', color:'#1e40af' }}>
                          {fmtCurrency(g.cableAmount)}
                        </td>
                      </tr>
                    )}

                    {/* ── Generator subtotal row ── */}
                    <tr>
                      <td colSpan={withDiesel ? 10 : 6}
                        style={{ padding:'6px 12px', background:'var(--color-surface-2)', textAlign:'right', fontSize:12, borderBottom:'2px solid var(--color-border)' }}>
                        <span style={{ color:'var(--color-text-muted)' }}>{g.generatorName} Sub-total: </span>
                        <strong style={{ color:'var(--color-primary-dark)', fontFamily:'monospace', fontSize:13 }}>
                          {fmtCurrency(g.rowTotal)}
                        </strong>
                        {withDiesel && (
                          <span style={{ marginLeft:16, color:'var(--color-text-subtle)', fontWeight:400 }}>
                            (Rent {fmtCurrency(g.genAmount)} + Diesel {fmtCurrency(g.dieselAmount)}
                            {g.cableSize && cableRequired ? ` + Cable ${fmtCurrency(g.cableAmount)}` : ''})
                          </span>
                        )}
                      </td>
                    </tr>

                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─────── Other Charges Section ─────── */}
          <div style={{ marginTop: 18, marginBottom: 4 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform:'uppercase', letterSpacing: '0.5px' }}>Other Charges</span>
                <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional — e.g. catering, maintenance)</span>
              </div>
              {!isCompleted && (
                <button
                  type="button"
                  id="btn-add-other-charge"
                  onClick={handleAddOtherCharge}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(99,102,241,0.35)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 8px rgba(99,102,241,0.25)'; }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Charge
                </button>
              )}
            </div>

            {otherCharges.length === 0 && !isCompleted && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--color-surface-2)', border: '1.5px dashed var(--color-border)',
                color: 'var(--color-text-muted)', fontSize: 12.5,
              }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <span>No other charges added. Click <strong>+ Add Charge</strong> to add miscellaneous items like catering, maintenance, etc.</span>
              </div>
            )}

            {otherCharges.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {otherCharges.map((oc, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, minWidth: 22 }}>{idx + 1}.</span>
                    <input
                      id={`inp-oc-name-${idx}`}
                      type="text"
                      className="gb2-input"
                      placeholder="Charge name (e.g. Catering)"
                      value={oc.name}
                      onChange={e => handleOtherChargeChange(idx, 'name', e.target.value)}
                      disabled={isCompleted}
                      style={{ flex: 2, minWidth: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 110, position: 'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)', fontWeight:700, fontSize:13, pointerEvents:'none' }}>₹</span>
                      <input
                        id={`inp-oc-amount-${idx}`}
                        type="text"
                        inputMode="decimal"
                        className="gb2-input"
                        placeholder="Amount"
                        value={oc.amount}
                        onChange={e => handleOtherChargeChange(idx, 'amount', e.target.value)}
                        disabled={isCompleted}
                        style={{ paddingLeft: 26 }}
                        onKeyDown={e => {
                          const ok = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','.'];
                          if (!ok.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
                        }}
                      />
                    </div>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOtherCharge(idx)}
                        title="Remove this charge"
                        style={{
                          background: '#FEF2F2', color: '#DC2626',
                          border: '1px solid #FECACA', borderRadius: 7,
                          width: 32, height: 32, display:'flex', alignItems:'center', justifyContent:'center',
                          cursor: 'pointer', fontWeight: 700, fontSize: 16, flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    )}
                    <div style={{ fontFamily:'monospace', fontWeight:700, color:'var(--color-primary-dark)', minWidth: 90, textAlign:'right', fontSize: 13.5, flexShrink:0 }}>
                      {fmtCurrency(parseFloat(oc.amount) || 0)}
                    </div>
                  </div>
                ))}
                {/* Other Charges subtotal */}
                <div style={{ display:'flex', justifyContent:'flex-end', padding:'6px 14px', fontSize:13, fontWeight:700, color:'var(--color-primary-dark)', borderTop: '1px dashed var(--color-border)', marginTop:2 }}>
                  Other Charges Sub-total: <span style={{ fontFamily:'monospace', marginLeft:8 }}>{fmtCurrency(otherChargesTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Billing Summary */}
          <div className="gb2-summary-card">
            <div className="gb2-summary-box">
              <div className="gb2-summary-row">
                <span style={{ fontWeight:600, color:'var(--color-text)' }}>Generator Total :</span>
                <span style={{ fontFamily:'monospace', fontWeight:700 }}>{fmtCurrency(calculations.totalAmount)}</span>
              </div>
              {otherChargesTotal > 0 && (
                <div className="gb2-summary-row">
                  <span style={{ fontWeight:600, color:'#6366f1' }}>Other Charges :</span>
                  <span style={{ fontFamily:'monospace', fontWeight:700, color:'#6366f1' }}>+ {fmtCurrency(otherChargesTotal)}</span>
                </div>
              )}
              <div className="gb2-summary-row">
                <span style={{ color:'#dc2626', fontWeight:600 }}>Discount :</span>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  <input
                    id="inp-discount"
                    type="text"
                    inputMode="decimal"
                    className={`gb2-discount-inp${discountError ? ' err' : ''}`}
                    placeholder="0.00"
                    value={discount === 0 ? '' : discount}
                    onChange={e => handleDiscountChange(e.target.value, calculations.totalAmount + otherChargesTotal)}
                    disabled={isCompleted}
                    onKeyDown={e => {
                      const ok = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','.'];
                      if (!ok.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
                    }}
                  />
                  {discountError && <span className="gb2-err-text" style={{ maxWidth:200, textAlign:'right' }}>{discountError}</span>}
                </div>
              </div>
              <div className="gb2-summary-row net-total">
                <span>Net Total:</span>
                <span style={{ fontFamily:'monospace' }}>{fmtCurrency(netTotal)}</span>
              </div>
              <div className="gb2-amount-words">({amountWords})</div>
            </div>
          </div>
        </CardSection>

        {/* ── ACTION BUTTONS ── */}
        <div className="gb2-action-bar-card" style={{ marginBottom:0 }}>
          <div className="gb2-action-bar">
            <button id="btn-cancel" className="gb2-btn gb2-btn-cancel" type="button" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>
              Cancel
            </button>
            <button id="btn-print" className="gb2-btn gb2-btn-print" type="button" onClick={handlePrintPDF} disabled={!isCompleted}>
              <Icon.Printer /> Print Invoice
            </button>
            <button id="btn-share" className="gb2-btn gb2-btn-share" type="button" onClick={handleSharePDF} disabled={!isCompleted}>
              <Icon.Share /> Share Invoice
            </button>
            {!isCompleted && <button id="btn-save-bill" className="gb2-btn gb2-btn-save" type="button" style={{ background: '#475569', boxShadow: 'none' }} onClick={() => handleSaveBill(false)} disabled={saving}>
              <Icon.Save />{saving ? 'Saving…' : 'Save Draft'}
            </button>}
            {!isCompleted && <button id="btn-complete-bill" className="gb2-btn gb2-btn-save" type="button" onClick={() => setShowCompleteModal(true)} disabled={saving}>
              <Icon.Save /> Complete Bill
            </button>}
            {isCompleted && <div style={{ display:'flex', alignItems:'center', gap:8, color:'#16a34a', fontWeight:700, padding:'0 10px' }}>
              ✅ Bill Completed
            </div>}
          </div>
        </div>

      </div>

      {/* ── Invoice Share Modal (replaces inline share modal) ── */}
      <InvoiceShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="billing"
        order={shareOrderData}
        billNo={billNo}
        netTotal={netTotal}
        onPrintPdf={handlePrintPDF}
      />


      {showCompleteModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:24, borderRadius:12, width:400, maxWidth:'90%' }}>
            <h3 style={{ margin:'0 0 16px 0', color:'#0f172a' }}>Complete Bill?</h3>
            <p style={{ margin:'0 0 20px 0', color:'#475569', fontSize:14, lineHeight:1.5 }}>
              Are you sure you want to complete this bill? Once completed, the order and bill will be locked and cannot be edited.
            </p>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
              <button className="gb2-btn gb2-btn-cancel" onClick={() => setShowCompleteModal(false)}>Cancel</button>
              <button className="gb2-btn gb2-btn-save" onClick={() => handleSaveBill(true)}>Yes, Complete</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className="gb2-toast">
          <span style={{ fontSize:20 }}>✅</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--color-text)' }}>{toast.title}</div>
            <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:2 }}>{toast.msg}</div>
          </div>
        </div>
      )}
    </>
  );
}
