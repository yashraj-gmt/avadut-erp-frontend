// src/pages/generators/orders/GeneratorOrderForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DateRangePicker from './DateRangePicker';
import {
  DIESEL_TYPES,
  CABLE_SIZES,
  newGeneratorEntry,
  formatToDMY,
  formatRangeToDMY,
} from './mockData';
import { generatorOrderService } from '@/services/generatorOrderService';
import { generatorService } from '@/services/generatorService';
import { userService } from '@/services/userService';
import InvoiceShareModal from '@/components/shared/InvoiceShareModal';

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
  .gf2-card {
    background: transparent; border: none; border-radius: 0;
    margin-bottom: 28px; box-shadow: none; animation: gf2-fadein .3s ease;
  }
  .gf2-card-header {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 0 16px 0; background: transparent;
    border-bottom: 1.5px solid var(--color-border); margin-bottom: 20px;
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
    border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary-50);
  }
  .gf2-input.err, .gf2-select.err, .gf2-textarea.err {
    border-color:var(--color-danger); box-shadow:0 0 0 3px rgba(239,68,68,.08);
  }
  .gf2-err { display:flex; align-items:center; gap:5px; color:var(--color-danger); font-size:12px; margin-top:2px; }
  .gf2-textarea { resize:vertical; min-height:80px; }

  /* ── Toggle buttons ── */
  .gf2-toggle-grp { display:flex; gap:0; }
  .gf2-toggle-btn {
    flex:1; padding:9px 12px; font-size:13px; font-weight:600; cursor:pointer;
    border:1.5px solid var(--color-border); background:var(--color-surface); color:var(--color-text-muted);
    transition:all .2s; font-family:inherit;
  }
  .gf2-toggle-btn:first-child { border-radius:var(--radius-md) 0 0 var(--radius-md); }
  .gf2-toggle-btn:last-child  { border-radius:0 var(--radius-md) var(--radius-md) 0; border-left:none; }
  .gf2-toggle-btn.on { background:var(--color-primary); border-color:var(--color-primary); color:#fff; }

  /* ── Chip selector ── */
  .gf2-chip-grp { display:flex; flex-wrap:wrap; gap:8px; }
  .gf2-chip {
    display:inline-flex; align-items:center; gap:8px; padding:8px 14px;
    border:1.5px solid var(--color-border); border-radius:20px; cursor:pointer;
    font-size:13px; font-weight:500; background:var(--color-surface); color:var(--color-text-muted);
    transition:all .2s; font-family:inherit;
  }
  .gf2-chip.on {
    border-color:var(--color-primary); background:var(--color-primary-50);
    color:var(--color-primary-dark); font-weight:600;
  }
  .gf2-chip-box {
    width:14px; height:14px; border-radius:3px; border:1.5px solid var(--color-border);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .gf2-chip-box.on { background:var(--color-primary); border-color:var(--color-primary); }

  /* ── Combobox ── */
  .gf2-combo-wrap { position:relative; }
  .gf2-combo-icon {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    color:var(--color-text-muted); pointer-events:none;
  }
  .gf2-combo-wrap .gf2-input { padding-right:32px; }

  /* ── Generator rows ── */
  .gf2-gen-row {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 16px 0; border-bottom: 1.5px solid var(--color-border);
  }
  .gf2-gen-row:last-child { border-bottom: none; }
  .gf2-remove-btn {
    display:flex; align-items:center; justify-content:center;
    border:1.5px solid var(--color-danger-light,#fca5a5);
    background:var(--color-danger-50,#fef2f2); color:var(--color-danger);
    border-radius:var(--radius-md); cursor:pointer; transition:all .2s;
  }
  .gf2-remove-btn:hover { background:var(--color-danger); color:#fff; border-color:var(--color-danger); }

  /* ── Skeleton ── */
  .gf2-skel {
    background:linear-gradient(90deg,var(--color-surface-2) 25%,var(--color-surface) 50%,var(--color-surface-2) 75%);
    background-size:200% 100%; animation:gf2-pulse 1.5s ease-in-out infinite; border-radius:var(--radius-md);
  }

  /* ── Toast ── */
  .gf2-toast {
    position:fixed; top:24px; right:24px; z-index:9999;
    display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:12px;
    background:var(--color-surface); border:1px solid var(--color-border);
    box-shadow:0 8px 30px rgba(0,0,0,.15); animation:gf2-toast .3s ease;
  }

  /* ── Action bar ── */
  .gf2-action-bar-card {
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin-top: 24px;
  }
  .gf2-action-bar {
    display:flex; justify-content:flex-end; align-items:center; gap:10px;
    padding:18px 24px; background:var(--color-surface-2); flex-wrap:wrap; border-radius:var(--radius-lg);
  }
  .gf2-btn {
    display:inline-flex; align-items:center; gap:7px; padding:10px 18px; border:none;
    border-radius:var(--radius-md); font-size:13px; font-weight:600; cursor:pointer;
    transition:all .2s; font-family:inherit; white-space:nowrap;
  }
  .gf2-btn-cancel { background:var(--color-surface); border:1.5px solid var(--color-border); color:var(--color-text-muted); }
  .gf2-btn-cancel:hover { border-color:var(--color-text-muted); color:var(--color-text); }
  .gf2-btn-reset  { background:var(--color-surface); border:1.5px solid #f59e0b; color:#f59e0b; }
  .gf2-btn-reset:hover  { background:#f59e0b; color:#fff; }
  .gf2-btn-print  { background:#7c3aed; color:#fff; }
  .gf2-btn-print:hover  { background:#6d28d9; }
  .gf2-btn-share  { background:#0d9488; color:#fff; }
  .gf2-btn-share:hover  { background:#0f766e; }
  .gf2-btn-save   { background:var(--color-primary); color:#fff; }
  .gf2-btn-save:hover   { background:var(--color-primary-dark); }
  .gf2-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; pointer-events:none; }

  /* ── Share dropdown ── */
  .gf2-share-wrap { position: relative; display: inline-flex; }
  .gf2-share-dropdown {
    position: absolute; bottom: calc(100% + 8px); right: 0;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.13); padding: 6px; z-index: 1000; min-width: 160px;
  }
  .gf2-share-item {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 10px 14px; background: none; border: none; text-align: left;
    cursor: pointer; font-size: 13px; font-weight: 600; color: #475569;
    border-radius: 6px; font-family: inherit;
  }
  .gf2-share-item:hover { background: #f1f5f9; color: #0f172a; }

  @media (max-width: 768px) { .gf2-gen-row { flex-wrap: wrap; } }
  @media (max-width:639px) {
    .gf2-page { padding:16px; }
    .gf2-grid-2, .gf2-grid-3 { grid-template-columns:1fr; }
    .gf2-action-bar { justify-content:stretch; }
    .gf2-btn { flex:1 1 auto; justify-content:center; }
  }
`;

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function Label({ children, required }) {
  return (
    <label className="gf2-label">
      {children}{required && <span className="gf2-req">*</span>}
    </label>
  );
}

function ErrMsg({ msg }) {
  if (!msg) return null;
  return <div className="gf2-err"><Icon.AlertCircle />{msg}</div>;
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
function GeneratorEntry({ entry, index, total, errors, onChange, onRemove, onAdd, generatorOptions, showCable, disabled, allGenerators = [] }) {
  // Helper to calculate stock availability adjusted for selections in OTHER rows of the form
  const getAdjustedStock = (g) => {
    const originalStock = g.availableStock !== undefined ? g.availableStock : (g.totalStock != null ? g.totalStock : 0);
    if (typeof originalStock !== 'number') return originalStock;
    
    // Count selections of this generator in other rows of the form
    const countInOthers = allGenerators.filter((item, idx) => idx !== index && String(item.generatorId) === String(g.id)).length;
    return Math.max(0, originalStock - countInOthers);
  };

  return (
    <div className="gf2-gen-row">
      {/* Generator select */}
      <div className="gf2-field" style={{ flex: 1, minWidth: 0 }}>
        {index === 0 && <Label required>Generator</Label>}
        <select
          id={`sel-gen-${index}`}
          className={`gf2-select${errors?.generatorId ? ' err' : ''}`}
          value={entry.generatorId}
          onChange={e => {
            const found = generatorOptions.find(g => String(g.id) === e.target.value);
            onChange(index, 'generatorId', e.target.value);
            onChange(index, 'generatorName', found ? (found.name || '') : '');
          }}
          disabled={disabled}
        >
          <option value="">— Select Generator —</option>
          {generatorOptions.map(g => {
            const avail = getAdjustedStock(g);
            const isSelectable = typeof avail === 'number' ? avail > 0 : true;
            return (
              <option key={g.id} value={String(g.id)} disabled={!isSelectable && String(entry.generatorId) !== String(g.id)}>
                {g.name} (Available: {avail})
              </option>
            );
          })}
        </select>
        {entry.generatorId && (() => {
          const opt = generatorOptions.find(o => String(o.id) === String(entry.generatorId));
          if (!opt) return null;
          const avail = getAdjustedStock(opt);
          return (
            <div style={{ fontSize: '12px', color: avail > 0 ? '#10b981' : '#ef4444', marginTop: '4px', fontWeight: '500' }}>
              Available Stock: {avail}
            </div>
          );
        })()}
        <ErrMsg msg={errors?.generatorId} />
      </div>

      {/* Cable select (only when cable required) */}
      {showCable && (
        <div className="gf2-field" style={{ flex: 1, minWidth: 0 }}>
          {index === 0 && <Label required>Select Cable</Label>}
          <select
            id={`sel-cable-${index}`}
            className={`gf2-select${errors?.cableSize ? ' err' : ''}`}
            value={entry.cableSize || ''}
            onChange={e => onChange(index, 'cableSize', e.target.value)}
            disabled={disabled}
          >
            <option value="">— Select Cable —</option>
            {CABLE_SIZES.map(c => (
              <option key={c.size} value={c.size}>
                {c.size === 'Earth Rod' ? 'Earth Rod' : `${c.size} mm²`} — ₹{c.rate}/unit
              </option>
            ))}
          </select>
          <ErrMsg msg={errors?.cableSize} />
        </div>
      )}

      {/* Add / Remove buttons */}
      <div style={{
        display: 'flex', gap: 8, flexShrink: 0,
        alignSelf: index === 0 ? 'flex-end' : 'center',
        paddingBottom: index === 0 ? '2px' : 0,
      }}>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 42, height: 42, borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-primary-100)', background: 'var(--color-primary-50)',
            color: 'var(--color-primary)', fontSize: 20, cursor: 'pointer', transition: 'all 0.15s',
            ...(disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {})
          }}
          title="Add Generator"
        >+</button>

        {total > 1 && (
          <button
            type="button"
            className="gf2-remove-btn"
            style={{ width: 42, height: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...(disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}) }}
            onClick={() => onRemove(index)}
            disabled={disabled}
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
        <div className="gf2-back-btn" style={{ pointerEvents: 'none' }}><Icon.ArrowLeft /></div>
        <div style={{ flex: 1 }}>
          <div className="gf2-skel" style={{ width: 260, height: 26, marginBottom: 8 }} />
          <div className="gf2-skel" style={{ width: 180, height: 13 }} />
        </div>
      </div>
      {[180, 300, 120].map((h, i) => (
        <div key={i} className="gf2-card" style={{ marginBottom: 20 }}>
          <div style={{ height: 52, background: 'var(--color-surface-2)' }} />
          <div style={{ padding: 24 }}>
            <div className="gf2-skel" style={{ height: h }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Helper Functions ───────────────────────────────────────────────────── */
const parseFunctionDate = str => {
  if (!str) return { from: null, to: null };
  const parts = str.split(' to ');
  const toYMD = (s) => {
    if (!s) return null;
    s = s.trim();
    const dmy = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    const ymd = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
    return s;
  };
  return parts.length === 2
    ? { from: toYMD(parts[0]), to: toYMD(parts[1]) }
    : { from: toYMD(str), to: toYMD(str) };
};

/* ─── Initial state ──────────────────────────────────────────────────────── */
const INITIAL_ORDER = {
  orderNumber:            '',
  clientName:             '',
  contactNumber:          '',
  alternateContactNumber: '',
  operatorName:           '',
  operatorMobile:         '',
  cableRequired:          true,
  dieselType:             DIESEL_TYPES.WITH_OWNER,
  siteAddress:            '',
  siteAddressLink:        '',
  remarks:                '',
  functionDate:           '',
  billingStatus:          '',
};
const INITIAL_GENERATORS = () => [newGeneratorEntry()];

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function GeneratorOrderForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const [order, setOrder]                       = useState(INITIAL_ORDER);
  const [generators, setGens]                   = useState(INITIAL_GENERATORS);
  const [orderErrors, setOErr]                  = useState({});
  const [genErrors, setGErr]                    = useState([]);
  const [loading, setLoading]                   = useState(isEdit);
  const [saving, setSaving]                     = useState(false);
  const [toast, setToast]                       = useState(null);
  const [operatorOptions, setOperatorOptions]   = useState([]);
  const [generatorOptions, setGeneratorOptions] = useState([]);
  const [shareOpen, setShareOpen]               = useState(false);
  const [showShareModal, setShowShareModal]     = useState(false);
  const isDisabled = isEdit && order.billingStatus === 'COMPLETED';

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

  /* ── Load operators from Users API ── */
  useEffect(() => {
    userService.getAll()
      .then(data => {
        const list = Array.isArray(data) ? data
                   : Array.isArray(data?.content) ? data.content
                   : [];
        setOperatorOptions(
          list
            .filter(u => u.isActive !== false)
            .map(u => ({ id: u.id, name: u.name || '', mobile: u.mobile || '' }))
        );
      })
      .catch(() => { /* silent – user can type name manually */ });
  }, []);

  /* ── Load generators from Inventory API with Stock Availability ── */
  useEffect(() => {
    const { from, to } = parseFunctionDate(order.functionDate);
    generatorService.getForDropdownWithAvailability(from, to, isEdit ? id : null)
      .then(gens => setGeneratorOptions(Array.isArray(gens) ? gens : []))
      .catch(() => { /* silent fallback */ });
  }, [order.functionDate, isEdit, id]);

  /* ── Load existing order in edit mode ── */
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    generatorOrderService.getById(id)
      .then(res => {
        const o = res?.data || res || {};
        setOrder({
          orderNumber:            o.orderNumber     || '',
          clientName:             o.clientName      || '',
          contactNumber:          o.contactNumber   || '',
          alternateContactNumber: o.alternateMobile || '',
          operatorName:           o.operatorName    || '',
          operatorMobile:         o.operatorMobile  || '',
          cableRequired:          o.cableRequired   ?? true,
          dieselType:             o.withDiesel === false ? DIESEL_TYPES.PARTY : DIESEL_TYPES.WITH_OWNER,
          siteAddress:            o.siteAddress     || '',
          siteAddressLink:        o.siteAddressLink || '',
          remarks:                o.notes           || o.remarks || '',
          functionDate:           o.functionDateFrom && o.functionDateTo
            ? `${formatToDMY(o.functionDateFrom)} to ${formatToDMY(o.functionDateTo)}`
            : (formatRangeToDMY(o.functionDate) || ''),
          billingStatus:          o.billingStatus   || '',
        });
        if (o.generators?.length) {
          setGens(o.generators.map(item => ({
            _id:           `g-${item.id || Math.random()}`,
            generatorId:   String(item.generatorId || ''),
            generatorName: item.generatorName || '',
            cableSize:     item.cableSize   || '',
            startTime:     item.startTime   ? String(item.startTime).slice(0, 5) : '09:00',
            endTime:       item.endTime     ? String(item.endTime).slice(0, 5)   : '18:00',
            duration:      item.duration    ? String(item.duration) : '09:00',
          })));
        }
      })
      .catch(() => setToast({ title: '❌ Load Error', msg: 'Failed to load order. Please try again.' }))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /* ── Close share dropdown on outside click ── */
  useEffect(() => {
    if (!shareOpen) return;
    const handler = e => { if (!e.target.closest('.gf2-share-wrap')) setShareOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  /* ── Field change handlers ── */
  const handleOrderChange = (field, value) => {
    setOrder(prev => ({ ...prev, [field]: value }));
    if (orderErrors[field]) setOErr(prev => ({ ...prev, [field]: '' }));
  };

  // Digits-only for phone fields
  const handlePhoneChange = (field, value) => {
    if (/^\d*$/.test(value)) handleOrderChange(field, value);
  };

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

  const addGenerator    = () => setGens(prev => [...prev, newGeneratorEntry()]);
  const removeGenerator = idx => setGens(prev => prev.filter((_, i) => i !== idx));

  /* ── Validation ── */
  const validate = () => {
    let valid = true;
    const oe  = {};

    if (!order.clientName.trim())    { oe.clientName    = 'Client name is required';    valid = false; }
    
    if (!order.contactNumber.trim()) {
      oe.contactNumber = 'Contact number is required';
      valid = false;
    } else if (order.contactNumber.trim().length !== 10) {
      oe.contactNumber = 'Contact number must be exactly 10 digits';
      valid = false;
    }

    if (order.alternateContactNumber.trim()) {
      if (order.alternateContactNumber.trim().length !== 10) {
        oe.alternateContactNumber = 'Alternate contact number must be exactly 10 digits';
        valid = false;
      } else if (order.alternateContactNumber.trim() === order.contactNumber.trim()) {
        oe.alternateContactNumber = 'Alternate number must differ from contact number';
        valid = false;
      }
    }
    if (!order.operatorName.trim())  { oe.operatorName  = 'Operator name is required';  valid = false; }
    if (!order.siteAddress.trim())   { oe.siteAddress   = 'Site address is required';   valid = false; }
    if (!order.functionDate?.trim()) { oe.functionDate  = 'Function date range is required'; valid = false; }

    setOErr(oe);

    const ge = generators.map(g => {
      const e = {};
      if (!g.generatorId) {
        e.generatorId = 'Select a generator';
        valid = false;
      } else {
        const selectedCount = generators.filter(x => String(x.generatorId) === String(g.generatorId)).length;
        const option = generatorOptions.find(opt => String(opt.id) === String(g.generatorId));
        const avail = option ? (option.availableStock !== undefined ? option.availableStock : option.totalStock) : 0;
        if (selectedCount > avail) {
          e.generatorId = `Exceeds available stock (${avail} available)`;
          valid = false;
        }
      }
      if (order.cableRequired && !g.cableSize) {
        e.cableSize   = 'Select a cable size';
        valid = false;
      }
      return e;
    });
    setGErr(ge);

    if (!valid) {
      setTimeout(() => {
        const el = document.querySelector('.gf2-input.err, .gf2-select.err, .gf2-textarea.err');
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      }, 80);
    }
    return valid;
  };

  /* ── Save to API ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const { from: functionDateFrom, to: functionDateTo } = parseFunctionDate(order.functionDate);

    const payload = {
      clientName:      order.clientName.trim(),
      contactNumber:   order.contactNumber.trim(),
      alternateMobile: order.alternateContactNumber.trim() || null,
      operatorName:    order.operatorName.trim(),
      operatorMobile:  order.operatorMobile.trim() || null,
      cableRequired:   order.cableRequired,
      dieselType:      order.dieselType,
      siteAddress:     order.siteAddress.trim(),
      siteAddressLink: order.siteAddressLink.trim() || null,
      remarks:         order.remarks.trim() || null,
      functionDate:    order.functionDate.trim(),
      functionDateFrom,
      functionDateTo,
      generators: generators.map(g => ({
        generatorId: g.generatorId,
        cableSize:   order.cableRequired ? (g.cableSize || null) : null,
      })),
    };

    try {
      if (isEdit) {
        await generatorOrderService.update(id, payload);
        setToast({ title: 'Order Updated!', msg: `Order ${id} updated successfully.` });
      } else {
        await generatorOrderService.create(payload);
        setToast({ title: 'Order Saved!', msg: 'New generator order created successfully.' });
      }
      setTimeout(() => { setToast(null); navigate(ROUTES.GENERATOR_ORDERS); }, 1800);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save. Please try again.';
      setToast({ title: '❌ Error', msg });
      setSaving(false);
    }
  };

  /* ── Print Order Sheet PDF ── */
  const handlePrintPDF = e => {
    if (e) e.preventDefault();
    const printWindow = window.open('', '_blank', 'width=860,height=900');
    if (!printWindow) { alert('Please allow popups to print the order sheet.'); return; }

    // Use the real order number (e.g. GO20261) — fall back to id only as last resort
    const orderRef = order.orderNumber || id || 'New Order';
    const dateStr  = formatToDMY(new Date());

    const gensRows = generators.map((g, idx) => {
      const found = generatorOptions.find(item => String(item.id) === String(g.generatorId));
      const name  = found ? found.name : (g.generatorName || '—');
      const cable = order.cableRequired && g.cableSize
        ? (g.cableSize === 'Earth Rod' ? ' | Cable: Earth Rod' : ` | Cable: ${g.cableSize} mm²`)
        : '';
      return `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:10px;text-align:center;font-size:13px;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:10px;font-size:13px;font-weight:600;">${name}${cable}</td>
        </tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html><html>
      <head>
        <meta charset="utf-8">
        <title>Order Sheet</title>
        <style>
          @page{margin:0;size:A4} @media print{body{padding:10mm !important} html{-webkit-print-color-adjust:exact}}
          body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; background: #fff; font-size:13px; }
          .box { max-width: 800px; margin: auto; }
          .hdr { border-bottom: 2.5px solid #1e40af; padding-bottom: 14px; margin-bottom: 24px; }
          .hdr-title { text-align: center; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
          .hdr-row { display: flex; justify-content: space-between; align-items: center; gap: 15px; }
          .hdr-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
          .meta { flex-shrink: 0; } .meta table { border-collapse: collapse; } .meta table td { padding: 3px 6px; font-size: 12.5px; white-space: nowrap; } .meta table td:first-child { color: #64748b; min-width: 95px; font-weight: 600; } .meta table td:last-child { font-weight: 700; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 22px; }
          .section-label {
            font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
            color: #64748b; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px;
          }
          .info-row { display: flex; margin: 7px 0; font-size: 13px; line-height: 1.5; }
          .info-key { font-weight: 700; min-width: 115px; color: #334155; flex-shrink: 0; }
          .info-val { color: #1e293b; }
          .site-val { font-size: 13px; color: #1e293b; margin-top: 6px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0 24px; }
          th { background:#f8fafc; border:1px solid #cbd5e1; padding:10px; font-size:11px;
               font-weight:700; text-transform:uppercase; color:#475569; text-align:left; }
          .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="hdr">
            <div class="hdr-title">ORDER SHEET</div>
            <div class="hdr-row">
              <div class="hdr-left">
                <img src="/images/avadhut-logo.png" alt="Avadhut" style="height:100px;object-fit:contain;display:block;flex-shrink:0;" onerror="this.style.display='none'"/>
                <div style="font-size:22px;font-weight:800;color:#cc0000;line-height:1.3;white-space:nowrap;">Avadhut Light Decoration &amp; Sound</div>
              </div>
              <div class="meta">
                <table>
                  <tr><td>Order Number</td><td>: ${orderRef}</td></tr>
                  <tr><td>Date</td><td>: ${dateStr}</td></tr>
                </table>
              </div>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-label">Client Details</div>
              <div class="info-row"><span class="info-key">Name</span><span class="info-val">: ${order.clientName || '—'}</span></div>
              <div class="info-row"><span class="info-key">Contact</span><span class="info-val">: ${order.contactNumber || '—'}</span></div>
              ${order.alternateContactNumber ? `<div class="info-row"><span class="info-key">Alt. Contact</span><span class="info-val">: ${order.alternateContactNumber}</span></div>` : ''}
            </div>
            <div>
              <div class="section-label">Service Details</div>
              <div class="info-row"><span class="info-key">Function Date</span><span class="info-val">: ${formatRangeToDMY(order.functionDate)}</span></div>
              <div class="info-row"><span class="info-key">Operator</span><span class="info-val">: ${order.operatorName || '—'}</span></div>
              ${order.operatorMobile ? `<div class="info-row"><span class="info-key">Operator Mo. No.</span><span class="info-val">: ${order.operatorMobile}</span></div>` : ''}
              <div class="info-row"><span class="info-key">Cable Required</span><span class="info-val">: ${order.cableRequired ? 'Yes' : 'No'}</span></div>
              <div class="info-row"><span class="info-key">Diesel Type</span><span class="info-val">: ${order.dieselType === DIESEL_TYPES.WITH_OWNER ? 'With Owner' : 'Party Diesel'}</span></div>
            </div>
          </div>

          <div style="margin-bottom:22px;">
            <div class="section-label">Site Address</div>
            <div class="site-val">${order.siteAddress || '—'}${order.siteAddressLink ? `<br><a href="${order.siteAddressLink}" style="color:#2563eb;font-size:12px;">📍 View Location</a>` : ''}</div>
          </div>

          <div class="section-label">Generator Details</div>
          <table>
            <thead>
              <tr>
                <th style="width:40px;text-align:center;">#</th>
                <th>Generator Description</th>
              </tr>
            </thead>
            <tbody>${gensRows}</tbody>
          </table>

          <div class="footer">
            <p>This is a computer-generated order document. No signature required.</p>
            <p>© ${new Date().getFullYear()} Avadhut ERP Systems. All rights reserved.</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); };<\/script>
      </body></html>`);
    printWindow.document.close();
  };

  /* ── Share via WhatsApp / Email ── */
  const handleShareOption = channel => {
    const orderRef   = id || 'New Order';
    const clientName = order.clientName || 'Client';
    const funcDate   = formatRangeToDMY(order.functionDate) || '—';
    const rawMsg =
      `Generator Order Details:\nOrder Ref: ${orderRef}\nClient: ${clientName}\n` +
      `Function Date: ${funcDate}\nFor full order sheet, use the Print option.`;

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(rawMsg)}`, '_blank');
    } else if (channel === 'email') {
      const subject = encodeURIComponent(`Generator Order ${orderRef} – ${clientName}`);
      const body    = encodeURIComponent(rawMsg);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
    setShareOpen(false);
  };

  /* ── Build order object compatible with InvoiceShareModal ── */
  const shareOrderData = {
    ...order,
    orderNumber: order.orderNumber || id,
    contactNumber: order.contactNumber,
    generators,
  };

  /* ── Reset form ── */
  const handleReset = () => {
    if (isEdit) return;
    setOrder(INITIAL_ORDER);
    setGens(INITIAL_GENERATORS());
    setOErr({});
    setGErr([]);
  };

  /* ── Render ── */
  if (loading) {
    return (<><style>{STYLES}</style><SkeletonForm /></>);
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="gf2-page">

        {/* ── Page Header ── */}
        <div className="gf2-header">
          <button className="gf2-back-btn" id="btn-back"
            onClick={() => navigate(ROUTES.GENERATOR_ORDERS)} title="Back to Orders">
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

        {isDisabled && (
          <div style={{
            background: '#FEF3C7',
            border: '1.5px solid #FCD34D',
            color: '#92400E',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            This order's billing is completed. All fields are read-only and cannot be modified.
          </div>
        )}

        {/* ── SECTION 1: ORDER DETAILS ── */}
        <CardSection icon={Icon.User} title="Order Details">

          {/* Row 1: Client Name | Order Number | Function Date */}
          <div className="gf2-grid-3" style={{ marginBottom: 20 }}>
            <div className="gf2-field">
              <Label required>Client Name</Label>
              <input
                id="inp-client-name"
                className={`gf2-input${orderErrors.clientName ? ' err' : ''}`}
                placeholder="e.g. Rajesh Construction Co."
                value={order.clientName}
                onChange={e => handleOrderChange('clientName', e.target.value)}
                disabled={isDisabled}
              />
              <ErrMsg msg={orderErrors.clientName} />
            </div>

            <div className="gf2-field">
              <Label>Order Number</Label>
              <input
                id="inp-order-number"
                className="gf2-input"
                style={{ background: 'var(--color-surface-2)', cursor: 'not-allowed', color: 'var(--color-text-muted)' }}
                value={isEdit ? (order.orderNumber || id) : 'Auto-generated'}
                disabled readOnly
              />
            </div>

            <div className="gf2-field">
              <Label required>Function Date</Label>
              <DateRangePicker
                value={order.functionDate}
                onChange={val => handleOrderChange('functionDate', val)}
                placeholder="From Date - To Date"
                align="right"
                minDate={null}
                disabled={isDisabled}
              />
              <ErrMsg msg={orderErrors.functionDate} />
            </div>
          </div>

          {/* Row 2: Contact | Alternate Contact | Operator */}
          <div className="gf2-grid-3" style={{ marginBottom: 20 }}>
            <div className="gf2-field">
              <Label required>Contact Number</Label>
              <input
                id="inp-contact"
                type="tel"
                maxLength={10}
                inputMode="numeric"
                className={`gf2-input${orderErrors.contactNumber ? ' err' : ''}`}
                placeholder="e.g. 9876543210"
                value={order.contactNumber}
                onChange={e => handlePhoneChange('contactNumber', e.target.value)}
                disabled={isDisabled}
              />
              <ErrMsg msg={orderErrors.contactNumber} />
            </div>

            <div className="gf2-field">
              <Label>Alternate Contact Number</Label>
              <input
                id="inp-alt-contact"
                type="tel"
                maxLength={10}
                inputMode="numeric"
                className={`gf2-input${orderErrors.alternateContactNumber ? ' err' : ''}`}
                placeholder="e.g. 9876543210"
                value={order.alternateContactNumber}
                onChange={e => handlePhoneChange('alternateContactNumber', e.target.value)}
                disabled={isDisabled}
              />
              <ErrMsg msg={orderErrors.alternateContactNumber} />
            </div>

            <div className="gf2-field">
              <Label required>Operator Name</Label>
              <div className="gf2-combo-wrap">
                <input
                  id="inp-operator"
                  list="op-datalist"
                  className={`gf2-input${orderErrors.operatorName ? ' err' : ''}`}
                  placeholder="Select or type operator name…"
                  value={order.operatorName}
                  onChange={e => {
                    const val   = e.target.value;
                    const found = operatorOptions.find(op => op.name === val);
                    handleOrderChange('operatorName', val);
                    if (found) handleOrderChange('operatorMobile', found.mobile || '');
                  }}
                  autoComplete="off"
                  disabled={isDisabled}
                />
                <span className="gf2-combo-icon"><Icon.ChevronDown /></span>
              </div>
              <datalist id="op-datalist">
                {operatorOptions.map(op => <option key={op.id || op.name} value={op.name} />)}
              </datalist>
              <ErrMsg msg={orderErrors.operatorName} />
            </div>
          </div>

          {/* Row 3: Cable Required | Diesel Type */}
          <div className="gf2-grid-3">
            <div className="gf2-field">
              <Label>Cable Required</Label>
              <div className="gf2-toggle-grp">
                <button id="btn-cable-yes" type="button"
                  className={`gf2-toggle-btn${order.cableRequired ? ' on' : ''}`}
                  onClick={() => !isDisabled && handleOrderChange('cableRequired', true)}
                  disabled={isDisabled}
                  style={isDisabled ? { cursor: 'not-allowed', opacity: 0.7 } : {}}>Yes</button>
                <button id="btn-cable-no" type="button"
                  className={`gf2-toggle-btn${!order.cableRequired ? ' on' : ''}`}
                  onClick={() => !isDisabled && handleOrderChange('cableRequired', false)}
                  disabled={isDisabled}
                  style={isDisabled ? { cursor: 'not-allowed', opacity: 0.7 } : {}}>No</button>
              </div>
            </div>

            <div className="gf2-field">
              <Label>Diesel Type</Label>
              <div className="gf2-chip-grp">
                {[
                  { value: DIESEL_TYPES.WITH_OWNER, label: 'With Owner' },
                  { value: DIESEL_TYPES.PARTY,      label: 'Party Diesel' },
                ].map(opt => {
                  const active = order.dieselType === opt.value;
                  return (
                    <button key={opt.value} id={`btn-diesel-${opt.value}`} type="button"
                      className={`gf2-chip${active ? ' on' : ''}`}
                      onClick={() => !isDisabled && handleOrderChange('dieselType', opt.value)}
                      disabled={isDisabled}
                      style={isDisabled ? { cursor: 'not-allowed', opacity: 0.7 } : {}}>
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

        {/* ── SECTION 2: GENERATOR DETAILS ── */}
        <div className="gf2-card">
          <div className="gf2-card-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="gf2-card-icon"><Icon.Zap /></span>
              <h3 className="gf2-card-title">Generator Details</h3>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: 'var(--color-primary-100)', color: 'var(--color-primary-dark)',
            }}>
              {generators.length} Generator{generators.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="gf2-card-body" style={{ marginTop: 16 }}>
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
                generatorOptions={generatorOptions}
                showCable={order.cableRequired}
                disabled={isDisabled}
                allGenerators={generators}
              />
            ))}
          </div>
        </div>

        {/* ── SECTION 3: ADDITIONAL INFORMATION ── */}
        <CardSection icon={Icon.MapPin} title="Additional Information">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="gf2-field">
              <Label required>Site Address</Label>
              <textarea
                id="inp-site-address"
                className={`gf2-textarea${orderErrors.siteAddress ? ' err' : ''}`}
                placeholder="Enter the full site address…"
                value={order.siteAddress}
                onChange={e => handleOrderChange('siteAddress', e.target.value)}
                rows={3}
                disabled={isDisabled}
              />
              <ErrMsg msg={orderErrors.siteAddress} />
            </div>

            <div className="gf2-field">
              <Label>Site Address Location Link</Label>
              <input
                id="inp-site-link"
                type="url"
                className="gf2-input"
                placeholder="e.g. https://maps.google.com/..."
                value={order.siteAddressLink}
                onChange={e => handleOrderChange('siteAddressLink', e.target.value)}
                disabled={isDisabled}
              />
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
                disabled={isDisabled}
              />
            </div>
          </div>
        </CardSection>

        {/* ── ACTION BAR ── */}
        <div className="gf2-action-bar-card" style={{ marginBottom: 0 }}>
          <div className="gf2-action-bar">
            <button id="btn-cancel" className="gf2-btn gf2-btn-cancel" type="button"
              onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>Cancel</button>

            {!isEdit && (
              <button id="btn-reset" className="gf2-btn gf2-btn-reset" type="button" onClick={handleReset}>
                <Icon.RotateCcw /> Reset
              </button>
            )}

            <button id="btn-print" className="gf2-btn gf2-btn-print" type="button" onClick={handlePrintPDF} disabled={!isEdit}>
              <Icon.Printer /> Print
            </button>

            {/* Share button — opens InvoiceShareModal */}
            <button id="btn-share" className="gf2-btn gf2-btn-share" type="button"
              onClick={() => setShowShareModal(true)} disabled={!isEdit}>
              <Icon.Share /> Share
            </button>

            <button id="btn-save" className="gf2-btn gf2-btn-save" type="button"
              onClick={handleSave} disabled={saving || isDisabled}>
              <Icon.Save />
              {saving ? 'Saving…' : isEdit ? 'Update Order' : 'Save Order'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Invoice Share Modal ── */}
      <InvoiceShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="order-sheet"
        order={shareOrderData}
        onPrintPdf={handlePrintPDF}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className="gf2-toast">
          <span style={{ fontSize: 20 }}>{toast.title.includes('❌') ? '❌' : '✅'}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              {toast.title.replace('❌ ', '')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{toast.msg}</div>
          </div>
        </div>
      )}
    </>
  );
}
