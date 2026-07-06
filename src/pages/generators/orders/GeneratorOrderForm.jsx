// src/pages/generators/orders/GeneratorOrderForm.jsx
import React, { useState, useEffect, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DateRangePicker from './DateRangePicker';
import {
  mockOrders,
  ORDER_STATUSES,
  DIESEL_TYPES,
  MOCK_GENERATORS,
  MOCK_OPERATORS,
  calcDuration,
  createOrder,
  newGeneratorEntry,
} from './mockData';

/* ─── Shared in-memory store (survives HMR) ─────────────────────────────── */
let LOCAL_ORDERS = [...mockOrders];

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  ),
  User: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Zap: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Trash2: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Clock: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Save: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  RotateCcw: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  Printer: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Share: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
};

/* ─── Global Styles ──────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes gf2-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gf2-pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes gf2-slide-down { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gf2-toast  { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }

  .gf2-page {
    min-height: 100vh;
    background: var(--color-bg);
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    padding: 28px 32px;
  }

  /* ── Header ── */
  .gf2-header { display:flex; align-items:flex-start; gap:14px; margin-bottom:28px; }
  .gf2-back-btn {
    display:flex; align-items:center; justify-content:center;
    width:38px; height:38px; border-radius:10px;
    border:1.5px solid var(--color-border); background:var(--color-surface);
    cursor:pointer; color:var(--color-text-muted); transition:all .2s; flex-shrink:0; margin-top:2px;
  }
  .gf2-back-btn:hover { border-color:var(--color-primary); color:var(--color-primary); background:var(--color-primary-50); }
  .gf2-page-title { font-size:clamp(18px,3vw,22px); font-weight:700; color:var(--color-text); letter-spacing:-.4px; margin:0 0 3px; }
  .gf2-breadcrumb { font-size:13px; color:var(--color-text-subtle); }
  .gf2-breadcrumb a { color:var(--color-primary); text-decoration:none; }

  /* ── Section card ── */
  /* ── Section card ── */
  .gf2-card {
    background: transparent;
    border: none;
    border-radius: 0;
    margin-bottom: 28px;
    box-shadow: none;
    animation: gf2-fadein .3s ease;
  }
  .gf2-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0 16px 0;
    background: transparent;
    border-bottom: 1.5px solid var(--color-border);
    margin-bottom: 20px;
  }
  .gf2-card-icon { display: flex; color: var(--color-primary); }
  .gf2-card-title { font-size: 15px; font-weight: 700; color: var(--color-text); margin: 0; }
  .gf2-card-body { padding: 0; }

  /* ── Grid layouts ── */
  .gf2-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; }
  .gf2-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px 24px; }

  /* ── Form fields ── */
  .gf2-field { display:flex; flex-direction:column; gap:6px; }
  .gf2-label { font-size:12.5px; font-weight:600; color:var(--color-text); display:block; }
  .gf2-req   { color:var(--color-danger); margin-left:2px; }
  .gf2-input, .gf2-select, .gf2-textarea {
    width:100%; padding:10px 13px;
    border:1.5px solid var(--color-border); border-radius:var(--radius-md);
    font-size:13.5px; color:var(--color-text); background:var(--color-surface);
    outline:none; transition:border-color .2s,box-shadow .2s; font-family:inherit;
  }
  .gf2-input:focus, .gf2-select:focus, .gf2-textarea:focus {
    border-color:var(--color-primary);
    box-shadow:0 0 0 3px rgba(37,99,235,.10);
  }
  .gf2-input.err, .gf2-select.err { border-color:var(--color-danger); }
  .gf2-input.err:focus { box-shadow:0 0 0 3px rgba(239,68,68,.10); }
  .gf2-select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2364748b' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }
  .gf2-textarea { min-height:90px; resize:vertical; line-height:1.6; }
  .gf2-err { font-size:12px; color:var(--color-danger); display:flex; align-items:center; gap:4px; margin-top:2px; }

  /* ── Duration display ── */
  .gf2-duration {
    display:flex; align-items:center; justify-content:center; gap:8px;
    border:1.5px solid var(--color-primary-100); border-radius:var(--radius-md);
    background:linear-gradient(135deg,var(--color-primary-50),var(--color-primary-100));
    padding:10px 14px; font-size:15px; font-weight:800; color:var(--color-primary-dark);
    letter-spacing:.4px; height:42px;
  }
  .gf2-duration span { font-size:12px; font-weight:600; color:var(--color-primary); opacity:.8; }

  /* ── Toggle Yes/No ── */
  .gf2-toggle-grp { display:flex; }
  .gf2-toggle-btn {
    padding:9px 18px; border:1.5px solid var(--color-border);
    font-size:13px; font-weight:600; cursor:pointer; font-family:inherit;
    transition:all .18s; color:var(--color-text-muted); background:var(--color-surface);
  }
  .gf2-toggle-btn:first-child { border-radius:8px 0 0 8px; border-right:none; }
  .gf2-toggle-btn:last-child  { border-radius:0 8px 8px 0; }
  .gf2-toggle-btn.on { background:var(--color-primary); color:#fff; border-color:var(--color-primary); }

  /* ── Diesel type chips ── */
  .gf2-chip-grp { display:flex; gap:8px; flex-wrap:wrap; }
  .gf2-chip {
    display:flex; align-items:center; gap:7px;
    padding:8px 14px; border:1.5px solid var(--color-border);
    border-radius:8px; cursor:pointer; font-size:13px; font-weight:500;
    background:var(--color-surface); color:var(--color-text-muted);
    transition:all .18s; white-space:nowrap; font-family:inherit;
  }
  .gf2-chip.on { border-color:var(--color-primary); background:var(--color-primary-50); color:var(--color-primary-dark); }
  .gf2-chip-box {
    width:15px; height:15px; border-radius:4px; border:2px solid var(--color-border-strong);
    display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .18s;
  }
  .gf2-chip-box.on { background:var(--color-primary); border-color:var(--color-primary); }

  /* ── Generator entry row (Single row layout) ── */
  .gf2-gen-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 12px;
    width: 100%;
  }
  .gf2-subsequent-label {
    display: none;
  }
  .gf2-remove-btn {
    display:flex; align-items:center; gap:5px;
    padding:6px 12px; border-radius:7px; border:1.5px solid #fca5a5;
    background:#fff; color:#dc2626; font-size:12px; font-weight:600;
    cursor:pointer; font-family:inherit; transition:all .18s;
  }
  .gf2-remove-btn:hover { background:#fee2e2; border-color:#dc2626; }

  /* ── Add generator button ── */
  .gf2-add-gen-btn {
    display:flex; align-items:center; gap:8px;
    width: auto; padding:10px 18px; margin-top:8px;
    border:2px dashed var(--color-border); border-radius:var(--radius-md);
    background:transparent; color:var(--color-text-muted);
    font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit;
    transition:all .2s;
  }
  .gf2-add-gen-btn:hover {
    border-color:var(--color-primary); color:var(--color-primary);
    background:var(--color-primary-50);
  }

  /* ── Combobox (datalist) wrapper ── */
  .gf2-combo-wrap { position:relative; }
  .gf2-combo-wrap input { padding-right:32px; }
  .gf2-combo-icon { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--color-text-subtle); pointer-events:none; }

  /* ── Action bar ── */
  .gf2-action-bar-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-top: 24px;
  }
  .gf2-action-bar {
    display:flex; justify-content:flex-end; gap:10px;
    padding:18px 24px; background:var(--color-surface-2);
    flex-wrap:wrap;
  }
  .gf2-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 20px; border-radius:var(--radius-md);
    font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit;
    transition:all .2s; border:none; white-space:nowrap;
  }
  .gf2-btn-cancel { background:var(--color-surface); color:var(--color-danger); border:1.5px solid #fca5a5; }
  .gf2-btn-cancel:hover { background:#fee2e2; }
  .gf2-btn-reset  { background:var(--color-surface); color:var(--color-text-muted); border:1.5px solid var(--color-border); }
  .gf2-btn-reset:hover  { background:var(--color-surface-2); }
  .gf2-btn-save   {
    background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark));
    color:#fff; box-shadow:var(--shadow-md);
  }
  .gf2-btn-save:hover   { transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,.35); }
  .gf2-btn-save:disabled { opacity:.6; cursor:not-allowed; transform:none !important; }
  .gf2-btn-print  { background:#1e293b; color:#fff; border:1.5px solid #334155; }
  .gf2-btn-print:hover  { background:#0f172a; }
  .gf2-btn-share  { background:#0d9488; color:#fff; }
  .gf2-btn-share:hover  { background:#0f766e; }

  @media (max-width: 768px) {
    .gf2-gen-row {
      grid-template-columns: 1fr !important;
      gap: 12px;
      border-bottom: 1.5px solid var(--color-border);
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .gf2-subsequent-label {
      display: block;
    }
    .gf2-remove-wrap {
      height: auto !important;
      padding-bottom: 0 !important;
      justify-content: flex-end;
      margin-top: 4px;
    }
  }

  /* ── Responsive ── */
  @media (max-width:1023px) {
    .gf2-page { padding:20px 24px; }
    .gf2-grid-3 { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:639px) {
    .gf2-page { padding:16px; }
    .gf2-grid-2, .gf2-grid-3 { grid-template-columns:1fr; }
    .gf2-card-body { padding:16px; }
    .gf2-gen-body { padding:14px 12px; }
    .gf2-action-bar { justify-content:stretch; }
    .gf2-btn { flex:1 1 auto; justify-content:center; }
  }
`;

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function Label({ children, required }) {
  return (
    <label className="gf2-label">
      {children}
      {required && <span className="gf2-req">*</span>}
    </label>
  );
}

function ErrMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="gf2-err">
      <Icon.AlertCircle />{msg}
    </div>
  );
}

function CardSection({ icon: Ic, title, children }) {
  return (
    <div className="gf2-card">
      <div className="gf2-card-header">
        <span className="gf2-card-icon"><Ic /></span>
        <h3 className="gf2-card-title">{title}</h3>
      </div>
      <div className="gf2-card-body">{children}</div>
    </div>
  );
}

/* ─── Single Generator Entry Row ─────────────────────────────────────────── */
function GeneratorEntry({ entry, index, total, errors, onChange, onRemove, onAdd }) {
  return (
    <div className="gf2-gen-row">
      <div className="gf2-field" style={{ flex: 1 }}>
        {index === 0 && <Label required>Generator</Label>}
        <select
          id={`sel-gen-${index}`}
          className={`gf2-select${errors?.generatorId ? ' err' : ''}`}
          value={entry.generatorId}
          onChange={e => {
            const found = MOCK_GENERATORS.find(g => g.id === e.target.value);
            onChange(index, 'generatorId', e.target.value);
            onChange(index, 'generatorName', found ? found.name : '');
          }}
        >
          <option value="">— Select Generator —</option>
          {MOCK_GENERATORS.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
          ))}
        </select>
        <ErrMsg msg={errors?.generatorId} />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Inline Add (+) button beside dropdown */}
        <button
          type="button"
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-primary-100)', background: 'var(--color-primary-50)',
            color: 'var(--color-primary)', fontSize: '20px', cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Add Generator"
        >
          +
        </button>

        {total > 1 && (
          <button
            type="button"
            className="gf2-remove-btn"
            style={{ padding: '0', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => onRemove(index)}
            id={`btn-remove-gen-${index}`}
            title="Remove Generator"
          >
            <Icon.Trash2 />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton Loader ────────────────────────────────────────────────────── */
function SkeletonForm() {
  return (
    <div className="gf2-page">
      <div className="gf2-header">
        <div className="gf2-back-btn" style={{ pointerEvents:'none' }}><Icon.ArrowLeft /></div>
        <div style={{ flex:1 }}>
          <div className="gf2-skel" style={{ width:260, height:26, marginBottom:8 }} />
          <div className="gf2-skel" style={{ width:180, height:13 }} />
        </div>
      </div>
      {[180, 300, 120].map((h, i) => (
        <div key={i} className="gf2-card" style={{ marginBottom:20 }}>
          <div style={{ height:52, background:'var(--color-surface-2)' }} />
          <div style={{ padding:24 }}>
            <div className="gf2-skel" style={{ height:h }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Initial state helpers ──────────────────────────────────────────────── */
const INITIAL_ORDER = {
  clientName: '',
  contactNumber: '',
  operatorName: '',
  cableRequired: true,
  dieselType: DIESEL_TYPES.WITH_OWNER,
  siteAddress: '',
  remarks: ''
};
const INITIAL_GENERATORS = () => [newGeneratorEntry()];

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function GeneratorOrderForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const [order, setOrder]         = useState(INITIAL_ORDER);
  const [generators, setGens]     = useState(INITIAL_GENERATORS);
  const [orderErrors, setOErr]    = useState({});
  const [genErrors, setGErr]      = useState([]);
  const [loading, setLoading]     = useState(isEdit);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [orderNumberDraft, setOrderNumberDraft] = useState('');

  // Calculate order draft number on mount
  useEffect(() => {
    if (!isEdit) {
      const allOrders = [...LOCAL_ORDERS];
      const numbers = allOrders.map(o => {
        const match = o.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      const nextNum = Math.max(0, ...numbers) + 1;
      setOrderNumberDraft(`ORD-${String(nextNum).padStart(5, '0')}`);
    }
  }, [isEdit]);

  /* ── Load existing order in edit mode ── */
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    setTimeout(() => {
      const found = LOCAL_ORDERS.find(o => o.id === id) || mockOrders.find(o => o.id === id);
      if (found) {
        setOrder({
          clientName:    found.clientName    || '',
          contactNumber: found.contactNumber || '',
          operatorName:  found.operatorName || found.generators?.[0]?.operatorName || '',
          cableRequired: found.cableRequired ?? found.generators?.[0]?.cableRequired ?? true,
          dieselType:    found.dieselType || found.generators?.[0]?.dieselType || DIESEL_TYPES.WITH_OWNER,
          siteAddress:   found.siteAddress   || '',
          remarks:       found.remarks       || '',
          functionDate:  found.functionDate  || '',
        });
        setGens(
          found.generators?.length
            ? found.generators.map(g => ({ ...g }))
            : INITIAL_GENERATORS()
        );
      }
      setLoading(false);
    }, 600);
  }, [id, isEdit]);

  /* ── Order field change ── */
  const handleOrderChange = (field, value) => {
    setOrder(prev => ({ ...prev, [field]: value }));
    if (orderErrors[field]) setOErr(prev => ({ ...prev, [field]: '' }));
  };

  /* ── Generator field change ── */
  const handleGenChange = (idx, field, value) => {
    setGens(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    if (genErrors[idx]?.[field]) {
      setGErr(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: '' };
        return next;
      });
    }
  };

  /* ── Add / remove generators ── */
  const addGenerator = () => setGens(prev => [...prev, newGeneratorEntry()]);

  const removeGenerator = (idx) => setGens(prev => prev.filter((_, i) => i !== idx));

  /* ── Validation ── */
  const validate = () => {
    let valid = true;
    const oe  = {};
    if (!order.clientName.trim())    { oe.clientName    = 'Client name is required';    valid = false; }
    if (!order.contactNumber.trim()) { oe.contactNumber = 'Contact number is required'; valid = false; }
    if (!order.operatorName.trim())  { oe.operatorName  = 'Operator name is required';  valid = false; }
    if (!order.siteAddress.trim())   { oe.siteAddress   = 'Site address is required';   valid = false; }
    if (!order.functionDate || !order.functionDate.trim()) { oe.functionDate = 'Function date range is required'; valid = false; }
    setOErr(oe);

    const ge = generators.map(g => {
      const e = {};
      if (!g.generatorId)        { e.generatorId   = 'Select a generator';    valid = false; }
      return e;
    });
    setGErr(ge);
    return valid;
  };

  /* ── Submit ── */
  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    const gensWithDuration = generators.map(g => ({
      ...g,
      startTime: g.startTime || '09:00',
      endTime: g.endTime || '18:00',
      duration: g.duration || '09:00',
    }));
    setTimeout(() => {
      if (isEdit) {
        LOCAL_ORDERS = LOCAL_ORDERS.map(o =>
          o.id === id
            ? { ...o, ...order, generators: gensWithDuration, updatedAt: new Date().toISOString() }
            : o
        );
        setToast({ title: 'Order Updated!', msg: `Order ${id} has been updated successfully.` });
      } else {
        const newOrder = createOrder({ ...order, id: orderNumberDraft, generators: gensWithDuration }, LOCAL_ORDERS);
        LOCAL_ORDERS = [newOrder, ...LOCAL_ORDERS];
        setToast({ title: 'Order Saved!', msg: 'New generator order created successfully.' });
      }
      setSaving(false);
      setTimeout(() => { setToast(null); navigate(ROUTES.GENERATOR_ORDERS); }, 1600);
    }, 900);
  };

  /* ── Print / Share PDF Invoice ── */
  const handlePrintPDF = (e) => {
    e.preventDefault();
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      alert("Please allow popups to print / save invoice.");
      return;
    }

    const gensRows = generators.map((g, idx) => {
      const genObj = MOCK_GENERATORS.find(item => item.id === g.generatorId) || { name: g.generatorName || '—', code: '—' };
      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-size: 13px;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 13px; font-weight: 600;">${genObj.name}</td>
        </tr>
      `;
    }).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Invoice - ${order.clientName || 'New Client'}</title>
        <style>
          body {
            font-family: 'DM Sans', -apple-system, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 30px;
            background: #fff;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 30px;
            background: #fff;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .company-logo h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .company-logo p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-info h2 {
            margin: 0 0 6px;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
          }
          .invoice-info p {
            margin: 3px 0;
            font-size: 13px;
            color: #475569;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 8px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
          }
          .info-p {
            margin: 5px 0;
            font-size: 13.5px;
            line-height: 1.5;
          }
          .inv-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .inv-table th {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 10px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
            text-align: left;
          }
          .remarks-area {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 35px;
            color: #475569;
          }
          .footer-section {
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header-row">
            <div class="company-logo">
              <img src="/images/avadhut-logo.png" alt="Avadhut Logo" style="height: 64px; object-fit: contain; display: block;" />
              <p style="margin-top: 6px;">Generator Management System</p>
            </div>
            <div class="invoice-info">
              <h2>ORDER SHEET</h2>
              <p><strong>Order Number:</strong> ${id || orderNumberDraft}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-title">Client Details</div>
              <p class="info-p"><strong>Name:</strong> ${order.clientName || '—'}</p>
              <p class="info-p"><strong>Contact:</strong> ${order.contactNumber || '—'}</p>
            </div>
            <div>
              <div class="section-title">Service Details</div>
              <p class="info-p"><strong>Function Date:</strong> ${order.functionDate || '—'}</p>
              <p class="info-p"><strong>Operator:</strong> ${order.operatorName || '—'}</p>
              <p class="info-p"><strong>Cable:</strong> ${order.cableRequired ? 'Yes' : 'No'}</p>
              <p class="info-p"><strong>Diesel Type:</strong> ${order.dieselType === DIESEL_TYPES.WITH_OWNER ? 'With Owner' : 'Party Diesel'}</p>
            </div>
            <div style="grid-column: 1 / -1; margin-top: 10px;">
              <div class="section-title">Site Address</div>
              <p class="info-p">${order.siteAddress || '—'}</p>
            </div>
          </div>

          <div class="section-title">Generators List</div>
          <table class="inv-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>Generator Description</th>
              </tr>
            </thead>
            <tbody>
              ${gensRows}
            </tbody>
          </table>

          ${order.remarks ? `
            <div class="section-title">Special Remarks / Instructions</div>
            <div class="remarks-area">${order.remarks.replace(/\n/g, '<br>')}</div>
          ` : ''}

          <div class="footer-section">
            <p>This is a computer-generated order document. No signature is required.</p>
            <p>© ${new Date().getFullYear()} Avadhut ERP Systems. All rights reserved.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  const handleSharePDF = (e) => {
    e.preventDefault();
    alert("Preparing order PDF for sharing... Please click OK to open the share document (you can Save as PDF).");
    handlePrintPDF(e);
  };

  /* ── Reset ── */
  const handleReset = () => {
    if (isEdit) return; // don't reset in edit mode to avoid data loss
    setOrder(INITIAL_ORDER);
    setGens(INITIAL_GENERATORS());
    setOErr({});
    setGErr([]);
  };

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <SkeletonForm />
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="gf2-page">

        {/* ── Page Header ────────────────────────────────────── */}
        <div className="gf2-header">
          <button
            className="gf2-back-btn"
            id="btn-back"
            onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
            title="Back to Orders"
          >
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="gf2-page-title">
              {isEdit ? 'Edit Generator Order' : 'Add New Generator Order'}
            </h1>
            <p className="gf2-breadcrumb">
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS); }}>Generator</a>
              {' › '}
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATOR_ORDERS); }}>Orders</a>
              {' › '}{isEdit ? id : 'New'}
            </p>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 1 — ORDER DETAILS
        ────────────────────────────────────────────────────── */}
        <CardSection icon={Icon.User} title="Order Details">
          <div className="gf2-grid-3" style={{ marginBottom: 20 }}>
            <div className="gf2-field">
              <Label required>Client Name</Label>
              <input
                id="inp-client-name"
                className={`gf2-input${orderErrors.clientName ? ' err' : ''}`}
                placeholder="e.g. Rajesh Construction Co."
                value={order.clientName}
                onChange={e => handleOrderChange('clientName', e.target.value)}
              />
              <ErrMsg msg={orderErrors.clientName} />
            </div>

            <div className="gf2-field">
              <Label>Order Number</Label>
              <input
                id="inp-order-number"
                className="gf2-input"
                style={{ background: 'var(--color-surface-2)', cursor: 'not-allowed', color: 'var(--color-text-muted)' }}
                value={isEdit ? id : orderNumberDraft}
                disabled
                readOnly
              />
            </div>

            <div className="gf2-field">
              <Label required>Function Date</Label>
              <DateRangePicker
                value={order.functionDate}
                onChange={val => handleOrderChange('functionDate', val)}
                placeholder="From Date - To Date"
                align="right"
              />
              <ErrMsg msg={orderErrors.functionDate} />
            </div>
          </div>

          <div className="gf2-grid-3">
            <div className="gf2-field">
              <Label required>Contact Number</Label>
              <input
                id="inp-contact"
                type="tel"
                maxLength={15}
                className={`gf2-input${orderErrors.contactNumber ? ' err' : ''}`}
                placeholder="e.g. 9876543210"
                value={order.contactNumber}
                onChange={e => handleOrderChange('contactNumber', e.target.value)}
              />
              <ErrMsg msg={orderErrors.contactNumber} />
            </div>

            <div className="gf2-field">
              <Label required>Operator Name</Label>
              <div className="gf2-combo-wrap">
                <input
                  id="inp-op-common"
                  list="op-list-common"
                  className={`gf2-input${orderErrors.operatorName ? ' err' : ''}`}
                  placeholder="Select or type operator name…"
                  value={order.operatorName}
                  onChange={e => handleOrderChange('operatorName', e.target.value)}
                  autoComplete="off"
                />
                <span className="gf2-combo-icon"><Icon.ChevronDown /></span>
              </div>
              <datalist id="op-list-common">
                {MOCK_OPERATORS.map(op => <option key={op} value={op} />)}
              </datalist>
              <ErrMsg msg={orderErrors.operatorName} />
            </div>

            <div className="gf2-field">
              <Label>Cable Required</Label>
              <div className="gf2-toggle-grp">
                <button
                  id="btn-cable-yes-common"
                  type="button"
                  className={`gf2-toggle-btn${order.cableRequired ? ' on' : ''}`}
                  onClick={() => handleOrderChange('cableRequired', true)}
                >
                  Yes
                </button>
                <button
                  id="btn-cable-no-common"
                  type="button"
                  className={`gf2-toggle-btn${!order.cableRequired ? ' on' : ''}`}
                  onClick={() => handleOrderChange('cableRequired', false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="gf2-grid-3" style={{ marginTop: 20 }}>
            <div className="gf2-field">
              <Label>Diesel Type</Label>
              <div className="gf2-chip-grp">
                {[
                  { value: DIESEL_TYPES.WITH_OWNER, label: 'With Owner' },
                  { value: DIESEL_TYPES.PARTY,      label: 'Party Diesel' },
                ].map(opt => {
                  const active = order.dieselType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      id={`btn-diesel-${opt.value}-common`}
                      type="button"
                      className={`gf2-chip${active ? ' on' : ''}`}
                      onClick={() => handleOrderChange('dieselType', opt.value)}
                    >
                      <span className={`gf2-chip-box${active ? ' on' : ''}`}>
                        {active && (
                          <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardSection>

        {/* ──────────────────────────────────────────────────────
            SECTION 2 — GENERATOR DETAILS
        ────────────────────────────────────────────────────── */}
        <div className="gf2-card">
          <div className="gf2-card-header" style={{ justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span className="gf2-card-icon"><Icon.Zap /></span>
              <h3 className="gf2-card-title">Generator Details</h3>
            </div>
            <span style={{
              fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20,
              background:'var(--color-primary-100)', color:'var(--color-primary-dark)',
            }}>
              {generators.length} Generator{generators.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="gf2-card-body" style={{ marginTop: '16px' }}>
            {generators.map((entry, idx) => (
              <GeneratorEntry
                key={entry._id}
                entry={entry}
                index={idx}
                total={generators.length}
                errors={genErrors[idx] || {}}
                onChange={handleGenChange}
                onRemove={removeGenerator}
                onAdd={addGenerator}
              />
            ))}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 3 — ADDITIONAL INFORMATION
        ────────────────────────────────────────────────────── */}
        <CardSection icon={Icon.MapPin} title="Additional Information">
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="gf2-field">
              <Label required>Site Address</Label>
              <textarea
                id="inp-site-address"
                className={`gf2-textarea${orderErrors.siteAddress ? ' err' : ''}`}
                placeholder="Enter the full site address…"
                value={order.siteAddress}
                onChange={e => handleOrderChange('siteAddress', e.target.value)}
                rows={3}
              />
              <ErrMsg msg={orderErrors.siteAddress} />
            </div>

            <div className="gf2-field">
              <Label>Remarks</Label>
              <textarea
                id="inp-remarks"
                className="gf2-textarea"
                placeholder="Any additional notes or special instructions…"
                value={order.remarks}
                onChange={e => handleOrderChange('remarks', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </CardSection>

        {/* ──────────────────────────────────────────────────────
            ACTION BAR
        ────────────────────────────────────────────────────── */}
        <div className="gf2-action-bar-card" style={{ marginBottom:0 }}>
          <div className="gf2-action-bar">
            <button
              id="btn-cancel"
              className="gf2-btn gf2-btn-cancel"
              type="button"
              onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
            >
              Cancel
            </button>
            {!isEdit && (
              <button
                id="btn-reset"
                className="gf2-btn gf2-btn-reset"
                type="button"
                onClick={handleReset}
              >
                <Icon.RotateCcw /> Reset
              </button>
            )}
            <button
              id="btn-print"
              className="gf2-btn gf2-btn-print"
              type="button"
              onClick={handlePrintPDF}
            >
              <Icon.Printer /> Print
            </button>
            <button
              id="btn-share"
              className="gf2-btn gf2-btn-share"
              type="button"
              onClick={handleSharePDF}
            >
              <Icon.Share /> Share
            </button>
            <button
              id="btn-save"
              className="gf2-btn gf2-btn-save"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              <Icon.Save />
              {saving ? 'Saving…' : isEdit ? 'Update Order' : 'Save Order'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="gf2-toast">
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
