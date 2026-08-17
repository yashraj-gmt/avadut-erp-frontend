// src/components/shared/ErrorBoundary.jsx
import React from 'react'

function isChunkError(err) {
  const msg = err?.message || String(err)
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError')
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  .eb-page {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg, #f8fafc);
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    padding: 32px 24px;
  }
  .eb-card {
    background: var(--color-surface, #fff);
    border-radius: 20px;
    padding: 44px 36px;
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--color-border, #e2e8f0);
  }
  .eb-icon {
    width: 68px; height: 68px; border-radius: 50%;
    background: linear-gradient(135deg,#fee2e2,#fecaca);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .eb-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
  .eb-desc { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.6; }
  .eb-hint {
    background: linear-gradient(135deg,#eff6ff,#dbeafe);
    border: 1px solid #bfdbfe; border-radius: 10px;
    padding: 12px 16px; margin: 0 0 24px;
    font-size: 13px; color: #1e40af; font-weight: 600; text-align: left; line-height: 1.5;
  }
  .eb-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 24px; border-radius: 10px;
    background: linear-gradient(135deg,#2563eb,#1d4ed8);
    color: #fff; border: none; cursor: pointer;
    font-family: inherit; font-size: 14px; font-weight: 600;
    box-shadow: 0 4px 12px rgba(37,99,235,.3);
    transition: all .2s;
  }
  .eb-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37,99,235,.35); }
`

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const err      = this.state.error
    const isChunk  = isChunkError(err)

    return (
      <>
        <style>{styles}</style>
        <div className="eb-page">
          <div className="eb-card">
            <div className="eb-icon">
              <svg width="30" height="30" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>

            <h2 className="eb-title">
              {isChunk ? 'App Updated' : 'Something Went Wrong'}
            </h2>

            <p className="eb-desc">
              {isChunk
                ? 'A new version of this app was deployed. Reload the page to get the latest version.'
                : 'An unexpected error occurred. Reloading the page usually fixes this.'}
            </p>

            {isChunk && (
              <div className="eb-hint">
                💡 This is normal after a new deployment — your browser was using old cached files.
              </div>
            )}

            <button className="eb-btn" onClick={() => window.location.reload()}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Reload Page
            </button>
          </div>
        </div>
      </>
    )
  }
}
