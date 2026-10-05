import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const Icon = {
  ArrowLeft: ({ size = 24, ...props }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" {...props}>
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  ),
  Calendar: ({ size = 24, ...props }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Zap: ({ size = 24, ...props }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  CheckCircle: ({ size = 24, ...props }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Search: ({ size = 20, ...props }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
};
import { generatorService } from '@/services/generatorService';

// Format currency
const fmtCurrency = (val) => {
  if (val == null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val);
};

export default function GeneratorAvailability() {
  const navigate = useNavigate();

  // Initialize with today's date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchAvailability = async (date) => {
    setLoading(true);
    setError('');
    try {
      const result = await generatorService.getDailyAvailabilityAll(date);
      setData(result || []);
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      setError("Failed to fetch availability for the selected date.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter(row => {
      const name = (row.generatorName || '').toLowerCase();
      const code = (row.generatorCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [data, search]);

  // Overall Stock Counters
  const totalStockCount = React.useMemo(() => {
    return data.reduce((sum, row) => sum + (Number(row.totalStock) || 0), 0);
  }, [data]);

  const totalAvailableCount = React.useMemo(() => {
    return data.reduce((sum, row) => sum + (Number(row.availableQty) || 0), 0);
  }, [data]);

  const totalBookedCount = React.useMemo(() => {
    return data.reduce((sum, row) => {
      const booked = row.bookings
        ? row.bookings.reduce((bSum, b) => bSum + (Number(b.quantity) || 0), 0)
        : (Number(row.bookedQty) || 0);
      return sum + booked;
    }, 0);
  }, [data]);

  const formattedSelectedDate = React.useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return selectedDate;
  }, [selectedDate]);

  return (
    <div className="ga-container">
      <style>{`
        .ga-container {
          padding: 24px 32px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .ga-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
        }
        .ga-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }
        .ga-subtitle {
          font-size: 14px;
          color: var(--color-text-subtle);
          margin-top: 4px;
        }
        .ga-header-actions {
          display: flex;
          gap: 12px;
        }

        /* ── Stat Cards ── */
        .ga-stats-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .ga-stat-card {
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 16px 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: default;
          user-select: text;
          min-width: 0;
        }
        .ga-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ga-stat-value {
          font-size: 24px;
          font-weight: 800;
          color: var(--color-text);
          line-height: 1.1;
        }
        .ga-stat-label {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 4px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ga-stat-sublabel {
          font-size: 11px;
          color: var(--color-text-subtle);
          margin-top: 2px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ga-toolbar {
          background: var(--color-surface);
          padding: 16px 20px;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
          border: 1px solid var(--color-border);
        }
        .ga-toolbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .ga-search-group {
          flex: 1 1 auto;
          min-width: 240px;
        }
        .ga-search-input {
          width: 100%;
          height: 42px;
          box-sizing: border-box;
          padding: 10px 34px 10px 38px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--color-text);
          background: var(--color-surface);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .ga-search-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.15);
        }
        .ga-date-group {
          flex: 0 0 auto;
          min-width: 200px;
        }
        .ga-date-input {
          height: 42px;
          box-sizing: border-box;
          padding: 10px 14px 10px 38px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          background: var(--color-surface);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          cursor: pointer;
          width: 200px;
        }
        .ga-date-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.15);
        }
        .ga-table-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--color-border);
          overflow: hidden;
        }
        .ga-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .ga-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          text-align: left;
        }

        @media (max-width: 768px) {
          .ga-container {
            padding: 16px 12px !important;
          }
          .ga-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }
          .ga-title {
            font-size: 22px !important;
          }
          .ga-subtitle {
            font-size: 13px !important;
          }
          .ga-header-actions {
            width: 100% !important;
          }
          .ga-header-actions button {
            width: 100% !important;
            justify-content: center !important;
          }
          .ga-toolbar {
            padding: 14px !important;
            border-radius: var(--radius-lg) !important;
          }
          .ga-toolbar-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .ga-search-group,
          .ga-date-group {
            flex: none !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .ga-search-input,
          .ga-date-input {
            width: 100% !important;
            max-width: 100% !important;
          }
        }

        @media (max-width: 850px) {
          .ga-stats-row {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
        }

        @media (max-width: 540px) {
          .ga-stats-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .ga-stat-card {
            padding: 12px 14px !important;
          }
          .ga-stat-value {
            font-size: 20px !important;
          }
        }
      `}</style>
      
      {/* ── Header ── */}
      <div className="ga-header">
        <div>
          <h1 className="ga-title">Stock Availability Board</h1>
          <div className="ga-subtitle">
            Check generator stock availability for any given date
          </div>
        </div>
        <div className="ga-header-actions">
          <button
            onClick={() => navigate(ROUTES.GENERATORS)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-text)', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
          >
            <Icon.ArrowLeft size={16} />
            Back to Inventory
          </button>
        </div>
      </div>

      {/* ── 3 Main Stat Cards ── */}
      <div className="ga-stats-row">
        {/* Card 1: Total Overall Stock */}
        <div className="ga-stat-card">
          <div className="ga-stat-icon" style={{ background: '#EFF6FF', color: 'var(--color-primary)' }}>
            <Icon.Zap size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ga-stat-value">{totalStockCount}</div>
            <div className="ga-stat-label">Total Overall Stock</div>
            <div className="ga-stat-sublabel">Total fleet stock quantity</div>
          </div>
        </div>

        {/* Card 2: Available Total Stock */}
        <div className="ga-stat-card">
          <div className="ga-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <Icon.CheckCircle size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ga-stat-value" style={{ color: '#16A34A' }}>{totalAvailableCount}</div>
            <div className="ga-stat-label">Available Total Stock</div>
            <div className="ga-stat-sublabel">
              {selectedDate === todayStr ? 'Available generators today' : `Available on ${formattedSelectedDate}`}
            </div>
          </div>
        </div>

        {/* Card 3: Total Booked Stock */}
        <div className="ga-stat-card">
          <div className="ga-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Icon.Calendar size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ga-stat-value" style={{ color: '#D97706' }}>{totalBookedCount}</div>
            <div className="ga-stat-label">Total Booked Stock</div>
            <div className="ga-stat-sublabel">
              {selectedDate === todayStr ? 'Booked generators today' : `Booked on ${formattedSelectedDate}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="ga-toolbar">
        <div className="ga-toolbar-row">
          {/* Left Side: Search Bar */}
          <div className="ga-search-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
              Search Generator
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)', pointerEvents: 'none', display: 'flex' }}>
                <Icon.Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search generator name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ga-search-input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-subtle)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '4px',
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Date Selector */}
          <div className="ga-date-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
              Select Date to Check Availability
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)', pointerEvents: 'none', display: 'flex' }}>
                <Icon.Calendar size={18} />
              </div>
              <input
                type="date"
                value={selectedDate}
                min={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="ga-date-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="ga-table-card">
        <div className="ga-table-wrap">
          <table className="ga-table">
            <thead style={{ background: 'var(--color-surface-2)', borderBottom: '1.5px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Generator Name</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Stock</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Under Service</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available / Bookable</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Booked</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booked Orders (Qty)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-subtle)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                      <div>Loading availability...</div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-danger)' }}>
                    {error}
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-subtle)' }}>
                    {search ? `No generators match "${search}".` : 'No active generators found.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => {
                  const rowBg = row.isOverbooked
                    ? '#FFF5F5'   // red-tinted for conflict rows
                    : i % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)";

                  const rowBorder = row.isOverbooked
                    ? '1.5px solid #FECACA'
                    : '1px solid var(--color-surface-2)';
                  
                  // Color coding for available stock
                  const isZeroStock = row.availableQty <= 0;
                  const availableStyle = row.isOverbooked
                    ? { background: '#FEE2E2', color: '#991B1B', border: '1.5px solid #FECACA' }
                    : isZeroStock 
                    ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }
                    : { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' };

                  const totalBooked = row.bookings
                    ? row.bookings.reduce((sum, b) => sum + (b.quantity || 0), 0)
                    : (row.bookedQty || 0);

                  return (
                    <tr key={row.generatorId} style={{ background: rowBg, borderBottom: rowBorder, transition: 'background 0.15s' }}>
                      
                      {/* Name & Code — with overbooked indicator */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '14px' }}>{row.generatorName}</span>
                            {row.isOverbooked && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#FEE2E2', color: '#B91C1C',
                                padding: '2px 8px', borderRadius: 20,
                                fontSize: 11, fontWeight: 700,
                                border: '1px solid #FECACA',
                              }}>
                                ⚠ Overbooked
                              </span>
                            )}
                          </div>
                          {row.generatorCode && (
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-primary-dark)', background: 'var(--color-primary-100)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', fontFamily: 'monospace' }}>
                              {row.generatorCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Stock */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                        {row.totalStock}
                      </td>

                      {/* Under Service */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {row.underServiceQty > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF9C3', color: '#854D0E', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                            ⚠ {row.underServiceQty}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-subtle)', fontWeight: '500' }}>-</span>
                        )}
                      </td>

                      {/* Available Stock */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
                          fontSize: '15px', fontWeight: '800', ...availableStyle
                        }}>
                          {row.availableQty}
                        </span>
                        {row.isOverbooked && (
                          <div style={{ fontSize: 10, color: '#B91C1C', fontWeight: 700, marginTop: 3 }}>
                            CONFLICT
                          </div>
                        )}
                      </td>

                      {/* Total Booked */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '14px', color: totalBooked > 0 ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}>
                        {totalBooked}
                      </td>

                      {/* Booked Orders */}
                      <td style={{ padding: '14px 16px' }}>
                        {row.bookings && row.bookings.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.values(row.bookings.reduce((acc, b) => {
                              if (!acc[b.orderId]) acc[b.orderId] = { ...b };
                              else acc[b.orderId].quantity += b.quantity;
                              return acc;
                            }, {})).map(b => (
                              <button
                                key={b.orderId}
                                onClick={() => navigate(ROUTES.GENERATOR_ORDER_DETAIL.replace(':id', b.orderId))}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)',
                                  padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                  color: 'var(--color-text)', cursor: 'pointer', transition: 'all 0.15s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                              >
                                {b.orderNumber}
                                <span style={{ background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                  Qty: {b.quantity}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>No bookings for this date</span>
                        )}
                      </td>
                      
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
