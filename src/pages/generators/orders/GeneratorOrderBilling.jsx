// src/pages/generators/orders/GeneratorOrderBilling.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { mockOrders, MOCK_BILLS, calcDuration } from './mockData';

/* ─── Global Mock Bills State ────────────────────────────────────────────── */
let LOCAL_ORDERS = [...mockOrders];

/* ─── Inline SVGs for Icons ──────────────────────────────────────────────── */
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
  DollarSign: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
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
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const STYLES = `
  .gb2-page { padding:24px; max-width:1200px; margin:0 auto; animation:gb2-fadein .3s ease; }
  @keyframes gb2-fadein { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);} }

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

  /* Section open card */
  .gb2-card {
    background: transparent;
    border: none;
    border-radius: 0;
    margin-bottom: 32px;
    box-shadow: none;
  }
  .gb2-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0 16px 0;
    background: transparent;
    border-bottom: 1.5px solid var(--color-border);
    margin-bottom: 20px;
  }
  .gb2-card-icon { display: flex; color: var(--color-primary); }
  .gb2-card-title { font-size: 15px; font-weight: 700; color: var(--color-text); margin: 0; }
  .gb2-card-body { padding: 0; }

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
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  /* Table styling */
  .gb2-table-wrap {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
  }
  .gb2-table { width:100%; border-collapse:collapse; text-align:left; }
  .gb2-th {
    padding:12px 16px; font-size:11.5px; font-weight:700;
    color:var(--color-text-muted); text-transform:uppercase;
    letter-spacing:.6px; border-bottom:1.5px solid var(--color-border);
    background:var(--color-surface-2);
  }
  .gb2-td { padding:14px 16px; font-size:13.5px; border-bottom:1px solid var(--color-border); color:var(--color-text); }
  .gb2-input-price {
    width: 110px; padding: 6px 10px; border: 1.5px solid var(--color-border);
    border-radius: 6px; font-family: inherit; font-size: 13.5px; outline: none;
    transition: all .2s; font-weight: 600; text-align: right;
  }
  .gb2-input-price:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(37,99,235,.1); }

  /* Summary Section */
  .gb2-summary-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-top: 24px;
    box-shadow: var(--shadow-sm);
    display: flex;
    justify-content: flex-end;
  }
  .gb2-summary-box { width: 300px; display: flex; flex-direction: column; gap: 12px; }
  .gb2-summary-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--color-text-muted); }
  .gb2-summary-row.total {
    font-size: 18px; font-weight: 800; color: var(--color-primary-dark);
    border-top: 1.5px solid var(--color-border); padding-top: 12px; margin-top: 4px;
  }

  /* Bottom action bar card */
  .gb2-action-bar-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-top: 28px;
  }
  .gb2-action-bar {
    display:flex; justify-content:flex-end; gap:10px;
    padding:18px 24px; background:var(--color-surface-2);
    flex-wrap:wrap;
  }
  .gb2-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 20px; border-radius:var(--radius-md);
    font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit;
    transition:all .2s; border:none; white-space:nowrap;
  }
  .gb2-btn-cancel { background:var(--color-surface); color:var(--color-danger); border:1.5px solid #fca5a5; }
  .gb2-btn-cancel:hover { background:#fee2e2; }
  .gb2-btn-save   {
    background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark));
    color:#fff; box-shadow:var(--shadow-md);
  }
  .gb2-btn-save:hover   { transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,.35); }
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
  @keyframes gb2-toast { from{opacity:0; transform:translateY(-10px);} to{opacity:1; transform:translateY(0);} }

  .gb2-skel { border-radius:8px; background:var(--color-border); animation:gb2-pulse 1.5s ease-in-out infinite; }
  @keyframes gb2-pulse { 0%,100%{opacity:.6;} 50%{opacity:1;} }
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

function Label({ children }) {
  return <label className="gb2-label">{children}</label>;
}

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
      <div style={{ height:140, background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, marginBottom:28 }} />
      <div style={{ height:120, background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12 }} />
    </div>
  );
}

const parseDurationToHours = (durStr) => {
  if (!durStr) return 0;
  const [h, m] = durStr.split(':').map(Number);
  return h + (m / 60);
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function GeneratorOrderBilling() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [order, setOrder]         = useState(null);
  const [billNo, setBillNo]       = useState('');
  const [isEditBill, setIsEditBill] = useState(false);
  
  // local rents & times mapping states
  const [rentPrices, setRentPrices] = useState({});
  const [generatorTimes, setGeneratorTimes] = useState({});

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  // Load order data and existing bill settings
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const foundOrder = LOCAL_ORDERS.find(o => o.id === id);
      if (foundOrder) {
        setOrder(foundOrder);

        const initialTimes = {};
        const initialPrices = {};
        (foundOrder.generators || []).forEach(g => {
          initialTimes[g._id] = {
            startTime: g.startTime || '09:00',
            endTime: g.endTime || '18:00'
          };
          initialPrices[g._id] = 1000;
        });

        // Check if there is an existing bill generated
        const existingBill = MOCK_BILLS.find(b => b.orderId === id);
        if (existingBill) {
          setBillNo(existingBill.billNo);
          setRentPrices(existingBill.rentPrices || {});
          setGeneratorTimes(existingBill.generatorTimes || initialTimes);
          setIsEditBill(true);
        } else {
          // pregenerate next bill number
          const nextBillNo = String(MOCK_BILLS.length + 1).padStart(5, '0');
          setBillNo(nextBillNo);
          setIsEditBill(false);
          setRentPrices(initialPrices);
          setGeneratorTimes(initialTimes);
        }
      }
      setLoading(false);
    }, 600);
  }, [id]);

  const handlePriceChange = (genId, val) => {
    const numeric = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setRentPrices(prev => ({ ...prev, [genId]: numeric }));
  };

  const handleTimeChange = (genId, field, val) => {
    setGeneratorTimes(prev => {
      const current = prev[genId] || { startTime: '09:00', endTime: '18:00' };
      return {
        ...prev,
        [genId]: { ...current, [field]: val }
      };
    });
  };

  /* ─── Dynamic Rent Calculations ────────────────────────────────────────── */
  const calculations = useMemo(() => {
    if (!order) return { items: [], subtotal: 0 };
    let subtotal = 0;
    const items = (order.generators || []).map(g => {
      const times = generatorTimes[g._id] || { startTime: g.startTime || '09:00', endTime: g.endTime || '18:00' };
      const durationStr = calcDuration(times.startTime, times.endTime);
      const hours = parseDurationToHours(durationStr);
      const price = rentPrices[g._id] ?? 0;
      const amount = parseFloat((hours * price).toFixed(2));
      subtotal += amount;
      return {
        ...g,
        startTime: times.startTime,
        endTime: times.endTime,
        duration: durationStr,
        hours,
        price,
        amount
      };
    });
    return { items, subtotal: parseFloat(subtotal.toFixed(2)) };
  }, [order, rentPrices, generatorTimes]);

  const grandTotal = calculations.subtotal;

  /* ─── Actions ──────────────────────────────────────────────────────────── */
  const handleSaveBill = () => {
    setSaving(true);
    setTimeout(() => {
      if (isEditBill) {
        // update existing bill in-place without reference reassignment
        const idx = MOCK_BILLS.findIndex(b => b.orderId === id);
        if (idx !== -1) {
          MOCK_BILLS[idx] = { ...MOCK_BILLS[idx], rentPrices, generatorTimes };
        }
        setToast({ title: 'Bill Updated!', msg: `Bill #${billNo} updated successfully.` });
      } else {
        // save new bill
        MOCK_BILLS.push({
          orderId: id,
          billNo: billNo,
          rentPrices: rentPrices,
          generatorTimes: generatorTimes
        });
        setToast({ title: 'Bill Generated!', msg: `New bill #${billNo} saved successfully.` });
        setIsEditBill(true);
      }
      setSaving(false);
      setTimeout(() => { setToast(null); }, 2000);
    }, 800);
  };

  /* ─── PDF Export Template ──────────────────────────────────────────────── */
  const handlePrintPDF = (e) => {
    e.preventDefault();
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      alert("Please allow popups to print invoices.");
      return;
    }

    const gensRows = calculations.items.map((g, idx) => {
      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-size: 13px;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 13px; font-weight: 600;">${g.generatorName}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-size: 13px; font-family: monospace;">${g.startTime}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-size: 13px; font-family: monospace;">${g.endTime}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">${g.duration} hrs</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; font-family: monospace;">₹${g.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; font-weight: 700; color: #1e40af; font-family: monospace;">₹${g.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - Bill #${billNo}</title>
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
            margin-bottom: 25px;
          }
          .inv-table th {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 10px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
          }
          .summary-table {
            width: 260px;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .summary-table td {
            padding: 8px 10px;
            font-size: 14.5px;
          }
          .summary-table tr.total-row td {
            font-size: 17px;
            font-weight: 800;
            color: #1e40af;
            border-top: 1.5px solid #cbd5e1;
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
              <h2>TAX INVOICE</h2>
              <p><strong>Bill Number:</strong> #${billNo}</p>
              <p><strong>Order Number:</strong> ${order.id}</p>
              <p><strong>Billing Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
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
              <p class="info-p"><strong>Cable Required:</strong> ${order.cableRequired ? 'Yes' : 'No'}</p>
              <p class="info-p"><strong>Diesel Type:</strong> ${order.dieselType === 'WITH_OWNER' ? 'With Owner' : 'Party Diesel'}</p>
            </div>
            <div style="grid-column: 1 / -1; margin-top: 10px;">
              <div class="section-title">Site Address</div>
              <p class="info-p">${order.siteAddress || '—'}</p>
            </div>
          </div>

          <div class="section-title">Generator Rent Calculation</div>
          <table class="inv-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="text-align: left;">Generator</th>
                <th style="width: 80px; text-align: center;">Start</th>
                <th style="width: 80px; text-align: center;">End</th>
                <th style="width: 100px; text-align: center;">Duration</th>
                <th style="width: 110px; text-align: right;">Rent Price</th>
                <th style="width: 130px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${gensRows}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td style="color: #64748b; font-weight: 500;">Subtotal:</td>
              <td style="text-align: right; font-weight: 700; font-family: monospace;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Grand Total:</td>
              <td style="text-align: right; font-family: monospace;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>

          ${order.remarks ? `
            <div class="section-title">Remarks / Notes</div>
            <div class="remarks-area">${order.remarks.replace(/\n/g, '<br>')}</div>
          ` : ''}

          <div class="footer-section">
            <p>Thank you for your business. Please make payments before due date.</p>
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
    alert("Preparing invoice PDF for sharing... Please click OK to open the share document (you can Save as PDF).");
    handlePrintPDF(e);
  };

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <SkeletonForm />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="gb2-page">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-subtle)' }}>
            <h3>Order not found.</h3>
            <button className="gb2-btn gb2-btn-cancel" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}>
              Back to Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="gb2-page">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="gb2-header">
          <button className="gb2-back-btn" id="btn-back" onClick={() => navigate(ROUTES.GENERATOR_ORDERS)} title="Back to Orders">
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="gb2-page-title">Generate Order Invoice</h1>
            <p className="gb2-breadcrumb">
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATORS); }}>Generator</a>
              {' › '}
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATOR_ORDERS); }}>Orders</a>
              {' › '}
              <a href="#" onClick={e => { e.preventDefault(); navigate(ROUTES.GENERATOR_ORDER_DETAIL.replace(':id', order.id)); }}>{order.id}</a>
              {' › Billing'}
            </p>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 1 — ORDER DETAILS (READ-ONLY)
        ────────────────────────────────────────────────────── */}
        <CardSection icon={Icon.User} title="Order Reference Details (Read-Only)">
          <div className="gb2-grid-3" style={{ marginBottom: 20 }}>
            <div className="gb2-field">
              <Label>Order Number</Label>
              <input className="gb2-input" value={order.id} disabled readOnly />
            </div>
            <div className="gb2-field">
              <Label>Client Name</Label>
              <input className="gb2-input" value={order.clientName} disabled readOnly />
            </div>
            <div className="gb2-field">
              <Label>Contact Number</Label>
              <input className="gb2-input" value={order.contactNumber} disabled readOnly />
            </div>
          </div>

          <div className="gb2-grid-3" style={{ marginBottom: 20 }}>
            <div className="gb2-field">
              <Label>Function Date</Label>
              <input className="gb2-input" value={order.functionDate || '—'} disabled readOnly />
            </div>
            <div className="gb2-field">
              <Label>Operator Name</Label>
              <input className="gb2-input" value={order.operatorName || '—'} disabled readOnly />
            </div>
            <div className="gb2-field">
              <Label>Cable Required</Label>
              <input className="gb2-input" value={order.cableRequired ? 'Yes' : 'No'} disabled readOnly />
            </div>
          </div>

          <div className="gb2-grid-3" style={{ marginBottom: 20 }}>
            <div className="gb2-field">
              <Label>Diesel Type</Label>
              <input className="gb2-input" value={order.dieselType === 'WITH_OWNER' ? 'With Owner' : 'Party Diesel'} disabled readOnly />
            </div>
          </div>

          <div className="gb2-field" style={{ marginBottom: 20 }}>
            <Label>Site Address</Label>
            <textarea className="gb2-textarea" value={order.siteAddress} rows={2} disabled readOnly />
          </div>

          <div className="gb2-field">
            <Label>Remarks</Label>
            <textarea className="gb2-textarea" value={order.remarks || 'No remarks added.'} rows={2} disabled readOnly />
          </div>
        </CardSection>

        {/* ──────────────────────────────────────────────────────
            SECTION 2 — BILL INFORMATION
        ────────────────────────────────────────────────────── */}
        <CardSection icon={Icon.Receipt} title="Bill Information">
          <div className="gb2-grid-3">
            <div className="gb2-field">
              <Label>Bill Number</Label>
              <input
                className="gb2-input"
                style={{ background: 'var(--color-surface-2)', fontStyle: 'italic', fontWeight: 600 }}
                value={billNo}
                disabled
                readOnly
              />
            </div>
            <div className="gb2-field">
              <Label>Billing Date</Label>
              <input
                className="gb2-input"
                style={{ background: 'var(--color-surface-2)' }}
                value={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                disabled
                readOnly
              />
            </div>
          </div>
        </CardSection>

        {/* ──────────────────────────────────────────────────────
            SECTION 3 — RENT CALCULATION TABLE
        ────────────────────────────────────────────────────── */}
        <CardSection icon={Icon.Zap} title="Generator Rent Calculation">
          <div className="gb2-table-wrap">
            <table className="gb2-table">
              <thead>
                <tr>
                  <th className="gb2-th" style={{ width: 44 }}>#</th>
                  <th className="gb2-th">Generator</th>
                  <th className="gb2-th" style={{ textAlign: 'center', width: 90 }}>Start Time</th>
                  <th className="gb2-th" style={{ textAlign: 'center', width: 90 }}>End Time</th>
                  <th className="gb2-th" style={{ textAlign: 'center', width: 120 }}>Total Duration</th>
                  <th className="gb2-th" style={{ textAlign: 'right', width: 140 }}>Rent Price</th>
                  <th className="gb2-th" style={{ textAlign: 'right', width: 160 }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {calculations.items.map((g, idx) => (
                  <tr key={g._id || idx}>
                    <td className="gb2-td" style={{ color: 'var(--color-text-subtle)', width: 44 }}>{idx + 1}</td>
                    <td className="gb2-td" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{g.generatorName}</td>
                    <td className="gb2-td" style={{ textAlign: 'center' }}>
                      <input
                        type="time"
                        className="gb2-input"
                        style={{ padding: '4px 8px', fontSize: 13, width: 100, textAlign: 'center' }}
                        value={g.startTime || '09:00'}
                        onChange={e => handleTimeChange(g._id, 'startTime', e.target.value)}
                      />
                    </td>
                    <td className="gb2-td" style={{ textAlign: 'center' }}>
                      <input
                        type="time"
                        className="gb2-input"
                        style={{ padding: '4px 8px', fontSize: 13, width: 100, textAlign: 'center' }}
                        value={g.endTime || '18:00'}
                        onChange={e => handleTimeChange(g._id, 'endTime', e.target.value)}
                      />
                    </td>
                    <td className="gb2-td" style={{ textAlign: 'center', fontWeight: 600 }}>{g.duration} hrs</td>
                    <td className="gb2-td" style={{ textAlign: 'right' }}>
                      <input
                        id={`inp-rent-price-${idx}`}
                        type="number"
                        min="0"
                        className="gb2-input-price"
                        value={rentPrices[g._id] ?? ''}
                        onChange={e => handlePriceChange(g._id, e.target.value)}
                      />
                    </td>
                    <td className="gb2-td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-dark)', fontFamily: 'monospace' }}>
                      ₹{g.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Billing Summary display */}
          <div className="gb2-summary-card">
            <div className="gb2-summary-box">
              <div className="gb2-summary-row">
                <span>Subtotal:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="gb2-summary-row total">
                <span>Grand Total:</span>
                <span style={{ fontFamily: 'monospace' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </CardSection>

        {/* ──────────────────────────────────────────────────────
            ACTION BUTTONS CARD
        ────────────────────────────────────────────────────── */}
        <div className="gb2-action-bar-card" style={{ marginBottom: 0 }}>
          <div className="gb2-action-bar">
            <button
              id="btn-cancel"
              className="gb2-btn gb2-btn-cancel"
              type="button"
              onClick={() => navigate(ROUTES.GENERATOR_ORDERS)}
            >
              Cancel
            </button>
            <button
              id="btn-print"
              className="gb2-btn gb2-btn-print"
              type="button"
              onClick={handlePrintPDF}
            >
              <Icon.Printer /> Print Invoice
            </button>
            <button
              id="btn-share"
              className="gb2-btn gb2-btn-share"
              type="button"
              onClick={handleSharePDF}
            >
              <Icon.Share /> Share Invoice
            </button>
            <button
              id="btn-save-bill"
              className="gb2-btn gb2-btn-save"
              type="button"
              onClick={handleSaveBill}
              disabled={saving}
            >
              <Icon.Save />
              {saving ? 'Saving…' : isEditBill ? 'Update Bill' : 'Save Bill'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="gb2-toast">
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{toast.title}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{toast.msg}</div>
          </div>
        </div>
      )}
    </>
  );
}
