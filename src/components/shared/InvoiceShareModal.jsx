// src/components/shared/InvoiceShareModal.jsx
//
// Reusable modal for sharing invoices via WhatsApp, Email, or downloading the PDF.
// Props:
//   isOpen            : boolean
//   onClose           : () => void
//   type              : 'order-sheet' | 'billing'
//   order             : order object from API
//   billNo            : string (bill number, for billing type)
//   netTotal          : number (net total amount)
//   onPrintPdf        : () => void  — triggers the print/PDF window
//
// The WhatsApp & Email message content differs per type.
// A "Download / Print PDF" button is also provided.

import React from 'react'
import { formatRangeToDMY } from '@/utils/helpers'

const STYLES = `
  .ism-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    z-index: 9999; display: flex; align-items: center; justify-content: center;
    padding: 16px; backdrop-filter: blur(2px);
    animation: ism-overlay-in .2s ease;
  }
  @keyframes ism-overlay-in { from{opacity:0} to{opacity:1} }
  .ism-card {
    background: #fff; border-radius: 16px; width: 460px; max-width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,.18);
    animation: ism-card-in .25s ease;
    overflow: hidden;
  }
  @keyframes ism-card-in { from{opacity:0;transform:scale(.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .ism-header {
    padding: 20px 24px 16px;
    border-bottom: 1.5px solid #f1f5f9;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ism-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0; }
  .ism-subtitle { font-size: 13px; color: #64748b; margin: 3px 0 0; }
  .ism-close {
    width: 34px; height: 34px; border-radius: 8px;
    background: #f1f5f9; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #64748b; transition: all .15s;
  }
  .ism-close:hover { background: #e2e8f0; color: #0f172a; }
  .ism-body { padding: 20px 24px; }
  .ism-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .ism-option {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: 10px;
    border: 1.5px solid #e2e8f0; text-decoration: none; color: #1e293b;
    background: #fff; cursor: pointer; font-family: inherit;
    transition: all .15s; width: 100%;
  }
  .ism-option:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
  .ism-option-wa:hover  { border-color: #22c55e; background: #f0fdf4; }
  .ism-option-em:hover  { border-color: #3b82f6; background: #eff6ff; }
  .ism-option-pdf:hover { border-color: #8b5cf6; background: #f5f3ff; }
  .ism-opt-icon { font-size: 24px; flex-shrink: 0; }
  .ism-opt-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .ism-opt-desc { font-size: 12px; color: #64748b; margin-top: 1px; }
  .ism-divider { border: none; border-top: 1px solid #f1f5f9; margin: 12px 0; }
  .ism-footer { display: flex; justify-content: flex-end; }
  .ism-cancel {
    padding: 9px 20px; border-radius: 8px;
    border: 1.5px solid #e2e8f0; background: #f8fafc;
    color: #64748b; font-family: inherit; font-size: 13px;
    font-weight: 600; cursor: pointer; transition: all .15s;
  }
  .ism-cancel:hover { background: #e2e8f0; color: #475569; }
  .ism-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
    background: #dbeafe; color: #1e40af; margin-left: auto; flex-shrink: 0;
  }
`

function fmtCur(n) {
  return `₹${(parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function InvoiceShareModal({ isOpen, onClose, type, order, billNo, netTotal, onPrintPdf }) {
  if (!isOpen || !order) return null

  /* ── WhatsApp message ── */
  const buildWhatsAppUrl = () => {
    const phone = order.contactNumber
      ? (order.contactNumber.startsWith('91') || order.contactNumber.startsWith('+91')
          ? order.contactNumber.replace(/\D/g, '')
          : '91' + order.contactNumber.replace(/\D/g, ''))
      : ''

    let message = ''
    if (type === 'billing') {
      message =
        `Hello *${order.clientName || 'Valued Client'}*,\n\n` +
        `Your generator rental invoice has been generated.\n\n` +
        `📋 *Invoice Details:*\n` +
        `• Order No: *${order.orderNumber || order.id}*\n` +
        `• Bill No: *${billNo || '—'}*\n` +
        `• Function Date: ${formatRangeToDMY(order.functionDate) || '—'}\n` +
        `• Net Payable: *${fmtCur(netTotal)}*\n\n` +
        `Please find the attached invoice PDF for your records.\n\n` +
        `Thank you for choosing *Avadhut Lights & Decoration*! 🙏`
    } else {
      // order-sheet
      message =
        `Hello *${order.clientName || 'Valued Client'}*,\n\n` +
        `Your generator order has been confirmed.\n\n` +
        `📋 *Order Details:*\n` +
        `• Order No: *${order.orderNumber || order.id}*\n` +
        `• Function Date: ${formatRangeToDMY(order.functionDate) || '—'}\n` +
        `• Site: ${order.siteAddress || '—'}\n` +
        `• Generators: ${order.generators?.length || 0}\n\n` +
        `The order sheet PDF is attached for your reference.\n\n` +
        `Thank you for choosing *Avadhut Lights & Decoration*! 🙏`
    }

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
  }

  /* ── Email message ── */
  const buildEmailUrl = () => {
    let subject = ''
    let body = ''

    if (type === 'billing') {
      subject = `Invoice from Avadhut Lights & Decoration – Bill #${billNo} | Order ${order.orderNumber || order.id}`
      body =
        `Dear ${order.clientName || 'Client'},\n\n` +
        `Please find below the billing details for your generator rental:\n\n` +
        `Invoice No    : ${billNo || '—'}\n` +
        `Order No      : ${order.orderNumber || order.id}\n` +
        `Function Date : ${formatRangeToDMY(order.functionDate) || '—'}\n` +
        `Net Amount    : ${fmtCur(netTotal)}\n\n` +
        `The invoice PDF is attached for your records.\n\n` +
        `Thank you for choosing Avadhut Lights & Decoration!\n\n` +
        `Best regards,\nAvadhut Lights & Decoration`
    } else {
      subject = `Order Sheet – Avadhut Lights & Decoration | Order ${order.orderNumber || order.id}`
      body =
        `Dear ${order.clientName || 'Client'},\n\n` +
        `Please find the details for your generator order:\n\n` +
        `Order No      : ${order.orderNumber || order.id}\n` +
        `Function Date : ${formatRangeToDMY(order.functionDate) || '—'}\n` +
        `Site Address  : ${order.siteAddress || '—'}\n` +
        `Generators    : ${order.generators?.length || 0}\n\n` +
        `The order sheet PDF is attached for your reference.\n\n` +
        `Thank you for choosing Avadhut Lights & Decoration!\n\n` +
        `Best regards,\nAvadhut Lights & Decoration`
    }

    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handlePdf = () => {
    onClose()
    if (onPrintPdf) onPrintPdf()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const isOrderSheet = type === 'order-sheet'
  const typeLabel = isOrderSheet ? 'Order Sheet' : 'Tax Invoice'

  return (
    <>
      <style>{STYLES}</style>
      <div className="ism-overlay" onClick={handleOverlayClick}>
        <div className="ism-card">
          {/* Header */}
          <div className="ism-header">
            <div>
              <h3 className="ism-title">Share {typeLabel}</h3>
              <p className="ism-subtitle">
                {isOrderSheet
                  ? `Order: ${order.orderNumber || order.id} • ${order.clientName || ''}`
                  : `Bill: ${billNo || '—'} • ${order.clientName || ''} • ${fmtCur(netTotal)}`}
              </p>
            </div>
            <button className="ism-close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="ism-body">
            <div className="ism-options">
              {/* WhatsApp */}
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="ism-option ism-option-wa"
                onClick={onClose}
              >
                <span className="ism-opt-icon">💬</span>
                <div>
                  <div className="ism-opt-name">Share via WhatsApp</div>
                  <div className="ism-opt-desc">
                    Send message to {order.contactNumber || 'client'}
                  </div>
                </div>
                <span className="ism-badge">+ PDF prompt</span>
              </a>

              {/* Email */}
              <a
                href={buildEmailUrl()}
                className="ism-option ism-option-em"
                onClick={onClose}
              >
                <span className="ism-opt-icon">✉️</span>
                <div>
                  <div className="ism-opt-name">Share via Email</div>
                  <div className="ism-opt-desc">Open mail client with pre-filled draft</div>
                </div>
                <span className="ism-badge">+ PDF prompt</span>
              </a>

              <hr className="ism-divider" />

              {/* Download/Print PDF */}
              <button
                className="ism-option ism-option-pdf"
                onClick={handlePdf}
              >
                <span className="ism-opt-icon">📄</span>
                <div>
                  <div className="ism-opt-name">Download / Print PDF</div>
                  <div className="ism-opt-desc">Opens the {typeLabel} as a printable PDF</div>
                </div>
              </button>
            </div>

            <div className="ism-footer">
              <button className="ism-cancel" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
