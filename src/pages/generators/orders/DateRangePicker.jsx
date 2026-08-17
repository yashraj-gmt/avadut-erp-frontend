// src/pages/generators/orders/DateRangePicker.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';

/* ─── Helpers for calendar calculations ──────────────────────────────────── */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseDateStr = (str) => {
  if (!str) return null;
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
  if (typeof str === 'string') {
    const parts = str.trim().split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // yyyy-mm-dd
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return isNaN(d.getTime()) ? null : d;
      } else if (parts[2].length === 4) {
        // dd-mm-yyyy or dd/mm/yyyy
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return isNaN(d.getTime()) ? null : d;
      }
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${d}-${m}-${y}`;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

export default function DateRangePicker({ value, onChange, placeholder = 'Select Date Range', minDate = new Date(), align = 'left', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Left calendar month representation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [tempFrom, setTempFrom] = useState(null);
  const [tempTo, setTempTo] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  // Track whether we are mid-selection (first date picked, waiting for second)
  const [selecting, setSelecting] = useState(false);

  const containerRef = useRef(null);

  // Sync state from external value — only when value changes, NOT when isOpen toggles.
  // Including isOpen caused the month to reset every time the popup opened.
  useEffect(() => {
    if (value && value.includes(' to ')) {
      const [fromStr, toStr] = value.split(' to ');
      const from = parseDateStr(fromStr);
      const to = parseDateStr(toStr);
      setTempFrom(from);
      setTempTo(to);
      setSelecting(false);
      // Only jump the calendar to the from-month when NOT mid-selection
      if (from) {
        setCurrentMonth(new Date(from.getFullYear(), from.getMonth(), 1));
      }
    } else if (!selecting) {
      setTempFrom(null);
      setTempTo(null);
    }
  }, [value]); // ← isOpen intentionally removed

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rightMonth = useMemo(() => {
    let y = currentMonth.getFullYear();
    let m = currentMonth.getMonth() + 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    return new Date(y, m, 1);
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      let y = prev.getFullYear();
      let m = prev.getMonth() - 1;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return new Date(y, m, 1);
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      let y = prev.getFullYear();
      let m = prev.getMonth() + 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      return new Date(y, m, 1);
    });
  };

  const minCompareDate = useMemo(() => {
    if (!minDate) return null;
    return new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  }, [minDate]);

  const isDateDisabled = (year, month, day) => {
    if (!minCompareDate) return false;
    const d = new Date(year, month, day);
    return d < minCompareDate;
  };

  const handleDayClick = (year, month, day) => {
    const clickedDate = new Date(year, month, day);

    if (!selecting) {
      // ── First click: pick the start date; stay open for second pick ──
      setTempFrom(clickedDate);
      setTempTo(null);
      setSelecting(true);
      // Don't call onChange yet — wait for the second date
    } else {
      // ── Second click: pick the end date ──
      if (clickedDate < tempFrom) {
        // Clicked before start → treat it as the new start
        setTempFrom(clickedDate);
        setTempTo(null);
        // Stay in selecting mode so user can pick end
      } else if (clickedDate.getTime() === tempFrom.getTime()) {
        // Same day → single-day range; confirm and close
        setTempTo(clickedDate);
        setSelecting(false);
        onChange(`${formatDate(clickedDate)} to ${formatDate(clickedDate)}`);
        setIsOpen(false);
      } else {
        // Valid end date
        setTempTo(clickedDate);
        setSelecting(false);
        onChange(`${formatDate(tempFrom)} to ${formatDate(clickedDate)}`);
        setIsOpen(false);
      }
    }
  };

  const isSelected = (year, month, day) => {
    const d = new Date(year, month, day);
    return (tempFrom && d.getTime() === tempFrom.getTime()) || (tempTo && d.getTime() === tempTo.getTime());
  };

  const isInRange = (year, month, day) => {
    const d = new Date(year, month, day);
    if (tempFrom && tempTo) return d > tempFrom && d < tempTo;
    // Show preview range while mid-selection
    if (selecting && tempFrom && hoverDate && hoverDate > tempFrom) {
      return d > tempFrom && d < hoverDate;
    }
    return false;
  };

  const isHoverEnd = (year, month, day) => {
    if (!selecting || !hoverDate || !tempFrom) return false;
    const d = new Date(year, month, day);
    return hoverDate > tempFrom && d.getTime() === hoverDate.getTime();
  };

  const renderMonthCalendar = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const daysInMonth = getDaysInMonth(y, m);
    const startOffset = getFirstDayOfMonth(y, m);
    
    const dayCells = [];
    // empty offset cells
    for (let i = 0; i < startOffset; i++) {
      dayCells.push(<div key={`offset-${i}`} className="drp-day empty" />);
    }

    // day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const disabled = isDateDisabled(y, m, d);
      const selected = isSelected(y, m, d);
      const inRange = isInRange(y, m, d);
      const isStart = tempFrom && new Date(y, m, d).getTime() === tempFrom.getTime();
      const isEnd = (tempTo && new Date(y, m, d).getTime() === tempTo.getTime()) || isHoverEnd(y, m, d);

      let cellClass = 'drp-day';
      if (disabled) cellClass += ' disabled';
      if (selected) cellClass += ' selected';
      if (inRange) cellClass += ' in-range';
      if (isStart) cellClass += ' range-start';
      if (isEnd) cellClass += ' range-end';

      dayCells.push(
        <button
          key={`day-${d}`}
          type="button"
          disabled={disabled}
          className={cellClass}
          onClick={() => handleDayClick(y, m, d)}
          onMouseEnter={() => selecting && setHoverDate(new Date(y, m, d))}
          onMouseLeave={() => selecting && setHoverDate(null)}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="drp-month">
        <div className="drp-month-name">
          {MONTH_NAMES[m]} {y}
        </div>
        <div className="drp-weekdays">
          {WEEKDAYS.map(w => <div key={w} className="drp-weekday">{w}</div>)}
        </div>
        <div className="drp-days-grid">
          {dayCells}
        </div>
      </div>
    );
  };

  return (
    <div className="drp-container" ref={containerRef}>
      <style>{`
        .drp-container { position: relative; width: 100%; }
        .drp-input-wrap {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 13px; border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md); background: var(--color-surface);
          cursor: pointer; transition: border-color .2s;
        }
        .drp-input-wrap:hover { border-color: var(--color-primary-200); }
        .drp-input-value { font-size: 13.5px; color: var(--color-text); }
        .drp-input-value.placeholder { color: var(--color-text-subtle); }
        
        .drp-popup {
          position: absolute; top: calc(100% + 8px); z-index: 1000;
          background: #ffffff; border: 1px solid var(--color-border);
          border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          padding: 20px; display: flex; flex-direction: column; gap: 16px;
          min-width: 580px; width: max-content;
        }
        
        .drp-header { display: flex; justify-content: space-between; align-items: center; }
        .drp-months-wrap { display: flex; gap: 24px; }
        
        .drp-month { flex: 1; min-width: 250px; }
        .drp-month-name { font-size: 14px; font-weight: 700; color: var(--color-text); text-align: center; margin-bottom: 12px; }
        
        .drp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 6px; }
        .drp-weekday { font-size: 11px; font-weight: 700; color: var(--color-text-subtle); text-transform: uppercase; }
        
        .drp-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 4px; }
        .drp-day {
          aspect-ratio: 1; border: none; background: transparent;
          font-family: inherit; font-size: 13px; font-weight: 500;
          color: var(--color-text); display: flex; align-items: center;
          justify-content: center; cursor: pointer; border-radius: 50%;
          transition: all 0.1s;
        }
        .drp-day.empty { cursor: default; }
        .drp-day:not(.empty):not(.disabled):hover { background: var(--color-primary-50); color: var(--color-primary-dark); }
        .drp-day.disabled { color: var(--color-border-strong); opacity: 0.35; cursor: not-allowed; }
        .drp-day.selected { background: var(--color-primary) !important; color: #ffffff !important; font-weight: 700; }
        .drp-day.in-range { background: var(--color-primary-50); border-radius: 0; color: var(--color-primary-dark); }
        .drp-day.range-start { border-top-left-radius: 50%; border-bottom-left-radius: 50%; }
        .drp-day.range-end { border-top-right-radius: 50%; border-bottom-right-radius: 50%; }

        .drp-nav-btn {
          background: transparent; border: 1.5px solid var(--color-border);
          border-radius: 6px; width: 28px; height: 28px; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          color: var(--color-text-muted); transition: all 0.15s;
        }
        .drp-nav-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

        @media (max-width: 639px) {
          .drp-popup { min-width: 280px; width: 300px; padding: 14px; }
          .drp-months-wrap { flex-direction: column; gap: 16px; }
        }
      `}</style>

      <div className="drp-input-wrap" onClick={() => !disabled && setIsOpen(!isOpen)} style={disabled ? { cursor: 'not-allowed', background: 'var(--color-surface-2)', opacity: 0.7 } : {}}>
        <span className={`drp-input-value${!value ? ' placeholder' : ''}`}>
          {value || placeholder}
        </span>
        <svg width="15" height="15" fill="none" stroke="var(--color-text-subtle)" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      {isOpen && (
        <div className="drp-popup" style={{
          left: align === 'left' ? 0 : 'auto',
          right: align === 'right' ? 0 : 'auto'
        }}>
          <div className="drp-header">
            <button className="drp-nav-btn" type="button" onClick={handlePrevMonth}>
              ‹
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: selecting ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              {selecting ? '📅 Now select end date' : 'Select date range'}
            </span>
            <button className="drp-nav-btn" type="button" onClick={handleNextMonth}>
              ›
            </button>
          </div>
          <div className="drp-months-wrap">
            {renderMonthCalendar(currentMonth)}
            <div className="drp-month-divider" style={{ width: 1, background: 'var(--color-border)', display: 'block' }} />
            {renderMonthCalendar(rightMonth)}
          </div>
        </div>
      )}
    </div>
  );
}
