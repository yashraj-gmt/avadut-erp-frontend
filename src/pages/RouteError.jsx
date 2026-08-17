// src/pages/RouteError.jsx
import { useRouteError, useNavigate } from 'react-router-dom'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  .re-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    padding: 24px;
  }
  .re-card {
    background: #fff;
    border-radius: 20px;
    padding: 48px 40px;
    max-width: 520px;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 32px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    animation: re-in .35s ease;
  }
  @keyframes re-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .re-icon-wrap {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg,#fee2e2,#fecaca);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
  }
  .re-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
  .re-subtitle { font-size: 15px; color: #64748b; margin: 0 0 8px; }
  .re-code {
    display: inline-block;
    background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 10px 16px; font-family: monospace; font-size: 12px;
    color: #ef4444; max-width: 100%; word-break: break-all;
    margin: 0 0 28px; text-align: left; line-height: 1.5;
  }
  .re-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .re-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 22px; border-radius: 10px; font-family: inherit;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all .2s; border: none;
  }
  .re-btn-primary {
    background: linear-gradient(135deg,#2563eb,#1d4ed8);
    color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,.3);
  }
  .re-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37,99,235,.35); }
  .re-btn-secondary {
    background: #f1f5f9; color: #475569;
    border: 1.5px solid #e2e8f0;
  }
  .re-btn-secondary:hover { background: #e2e8f0; }
  .re-chunk-hint {
    background: linear-gradient(135deg,#eff6ff,#dbeafe);
    border: 1px solid #bfdbfe; border-radius: 10px;
    padding: 12px 16px; margin: 0 0 24px;
    font-size: 13px; color: #1e40af; font-weight: 600;
    line-height: 1.5; text-align: left;
  }
`

function isChunkError(err) {
  const msg = err?.message || String(err)
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError')
  )
}

export default function RouteError() {
  const error   = useRouteError()
  const navigate = useNavigate()

  const isChunk = isChunkError(error)
  const errMsg  = error?.statusText || error?.message || String(error) || 'Unknown error'
  const status  = error?.status

  return (
    <>
      <style>{styles}</style>
      <div className="re-page">
        <div className="re-card">
          <div className="re-icon-wrap">
            <svg width="32" height="32" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 className="re-title">
            {status === 404 ? 'Page Not Found' : isChunk ? 'App Update Required' : 'Something Went Wrong'}
          </h1>

          <p className="re-subtitle">
            {status === 404
              ? 'The page you are looking for does not exist.'
              : isChunk
                ? 'The application was updated. Please reload the page to get the latest version.'
                : 'An unexpected error occurred while loading this page.'}
          </p>

          {isChunk && (
            <div className="re-chunk-hint">
              💡 This usually happens after a new deployment. Reloading the page will fix it automatically.
            </div>
          )}

          {!isChunk && errMsg && (
            <div className="re-code">{errMsg}</div>
          )}

          <div className="re-actions">
            {isChunk ? (
              <button className="re-btn re-btn-primary" onClick={() => window.location.reload()}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Reload Page
              </button>
            ) : (
              <>
                <button className="re-btn re-btn-secondary" onClick={() => navigate(-1)}>
                  ← Go Back
                </button>
                <button className="re-btn re-btn-primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
