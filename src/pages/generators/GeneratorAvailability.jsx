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
};
import { generatorService } from '@/services/generatorService';

// Format currency
const fmtCurrency = (val) => {
  if (val == null) return "—";
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
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'AVAILABLE', 'BOOKED', 'SERVICE'

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
    if (statusFilter === 'AVAILABLE') {
      return data.filter(row => row.availableQty > 0);
    }
    if (statusFilter === 'BOOKED') {
      return data.filter(row => row.availableQty <= 0);
    }
    if (statusFilter === 'SERVICE') {
      return data.filter(row => (row.underServiceQty || 0) > 0);
    }
    return data;
  }, [data, statusFilter]);

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
        .ga-toolbar {
          background: var(--color-surface);
          padding: 20px;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
          border: 1px solid var(--color-border);
        }
        .ga-toolbar-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ga-date-group {
          flex: 1;
          min-width: 250px;
        }
        .ga-date-input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text);
          background: var(--color-surface);
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
          max-width: 300px;
        }
        .ga-filters-group {
          display: flex;
          gap: 12px;
          margin-left: auto;
          flex-wrap: wrap;
          align-items: center;
        }
        .ga-filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
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
            gap: 14px !important;
          }
          .ga-date-group {
            min-width: 100% !important;
          }
          .ga-date-input {
            max-width: 100% !important;
          }
          .ga-filters-group {
            margin-left: 0 !important;
            width: 100% !important;
            justify-content: flex-start !important;
            gap: 8px !important;
          }
          .ga-filter-btn {
            flex: 1 1 calc(33.33% - 6px);
            justify-content: center;
            padding: 8px 10px !important;
            font-size: 12px !important;
            white-space: nowrap;
          }
        }

        @media (max-width: 480px) {
          .ga-filter-btn {
            flex: 1 1 100% !important;
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

      {/* ── Toolbar ── */}
      <div className="ga-toolbar">
        <div className="ga-toolbar-row">
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
          
          <div className="ga-filters-group">
            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--color-text-subtle)',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Clear Filter
              </button>
            )}
            <button
              onClick={() => setStatusFilter(prev => prev === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
              className="ga-filter-btn"
              style={{
                background: '#F0FDF4',
                border: statusFilter === 'AVAILABLE' ? '2px solid #22C55E' : '1px solid #BBF7D0',
                opacity: statusFilter !== 'ALL' && statusFilter !== 'AVAILABLE' ? 0.4 : 1,
                boxShadow: statusFilter === 'AVAILABLE' ? '0 0 0 3px rgba(34, 197, 94, 0.2)' : 'none',
                transform: statusFilter === 'AVAILABLE' ? 'scale(1.03)' : 'scale(1)'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>Available</span>
            </button>

            <button
              onClick={() => setStatusFilter(prev => prev === 'BOOKED' ? 'ALL' : 'BOOKED')}
              className="ga-filter-btn"
              style={{
                background: '#FEF2F2',
                border: statusFilter === 'BOOKED' ? '2px solid #EF4444' : '1px solid #FECACA',
                opacity: statusFilter !== 'ALL' && statusFilter !== 'BOOKED' ? 0.4 : 1,
                boxShadow: statusFilter === 'BOOKED' ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 'none',
                transform: statusFilter === 'BOOKED' ? 'scale(1.03)' : 'scale(1)'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B' }}>Fully Booked</span>
            </button>

            <button
              onClick={() => setStatusFilter(prev => prev === 'SERVICE' ? 'ALL' : 'SERVICE')}
              className="ga-filter-btn"
              style={{
                background: '#FEF9C3',
                border: statusFilter === 'SERVICE' ? '2px solid #EAB308' : '1px solid #FEF08A',
                opacity: statusFilter !== 'ALL' && statusFilter !== 'SERVICE' ? 0.4 : 1,
                boxShadow: statusFilter === 'SERVICE' ? '0 0 0 3px rgba(234, 179, 8, 0.25)' : 'none',
                transform: statusFilter === 'SERVICE' ? 'scale(1.03)' : 'scale(1)'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EAB308' }}></div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#854D0E' }}>Under Service</span>
            </button>
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
                    {statusFilter !== 'ALL' ? 'No generators match the selected filter.' : 'No active generators found.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => {
                  const rowBg = i % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)";
                  
                  // Color coding for available stock
                  const isZeroStock = row.availableQty <= 0;
                  const availableStyle = isZeroStock 
                    ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }
                    : { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' };

                  const totalBooked = row.bookings
                    ? row.bookings.reduce((sum, b) => sum + (b.quantity || 0), 0)
                    : (row.bookedQty || 0);

                  return (
                    <tr key={row.generatorId} style={{ background: rowBg, borderBottom: '1px solid var(--color-surface-2)', transition: 'background 0.15s' }}>
                      
                      {/* Name & Code */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '14px' }}>{row.generatorName}</span>
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
                          <span style={{ color: 'var(--color-text-subtle)', fontWeight: '500' }}>—</span>
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
