import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { generatorService } from "@/services/generatorService";
import { useToast } from "@/components/shared/toast/ToastProvider";
import ConfirmModal from "@/components/shared/modal/ConfirmModal";

/* ─── Icons ──────────────────────────────────────────────────── */
const Icon = {
  Search: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  Zap: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
};

/* ─── Style helpers ──────────────────────────────────────────── */
const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: 14,
  color: "var(--color-text)",
  verticalAlign: "middle",
};

const genIconStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "var(--color-primary-100)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--color-primary)",
  flexShrink: 0,
};

const actionBtnStyle = (type, disabled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  background:
    type === "blue"  ? "var(--color-primary-100)" :
    type === "amber" ? "#fee2e2" :
    "var(--color-danger-light)",
  color:
    type === "blue"  ? "var(--color-primary)" :
    type === "amber" ? "#dc2626" :
    "var(--color-danger)",
  opacity: disabled ? 0.5 : 1,
  transition: "all 0.15s",
});

const pageBtnStyle = (active) => ({
  width: 34,
  height: 34,
  borderRadius: 8,
  border: active ? "none" : "1.5px solid var(--color-border)",
  background: active ? "var(--color-primary)" : "var(--color-surface)",
  color: active ? "#fff" : "var(--color-text)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
});

const badgeStyle = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: active ? "var(--color-success-light)" : "var(--color-danger-light)",
  color: active ? "var(--color-success)" : "var(--color-danger)",
});

/* ─── Toggle Component ───────────────────────────────────────── */
function Toggle({ active, onToggle, disabled }) {
  return (
    <div
      className="gl-toggle"
      onClick={disabled ? undefined : onToggle}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <div className={`gl-toggle-track${active ? " on" : ""}`} />
      <div className={`gl-toggle-thumb${active ? " on" : ""}`} />
    </div>
  );
}

/* ─── Skeleton Row ───────────────────────────────────────────── */
function SkeletonRow({ cols }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--color-surface-2)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "16px" }}>
          <div style={{
            height: 14, borderRadius: 6,
            background: "var(--color-border)",
            width: `${55 + (i % 3) * 15}%`,
            animation: "gl-pulse 1.5s ease-in-out infinite",
          }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Fuel & Status labels ───────────────────────────────────── */
const FUEL_LABELS = {
  DIESEL:   "Diesel",
  PETROL:   "Petrol",
  GAS:      "Gas",
  NATURAL_GAS: "Natural Gas",
  DUAL_FUEL: "Dual Fuel",
};

const STATUS_LABELS = {
  AVAILABLE:    "Available",
  IN_USE:       "In Use",
  UNDER_MAINTENANCE: "Maintenance",
  RETIRED:      "Retired",
};

const statusColor = (status) => {
  switch (status) {
    case "AVAILABLE":          return { bg: "#dcfce7", color: "#166534" };
    case "IN_USE":             return { bg: "#dbeafe", color: "#1e40af" };
    case "UNDER_MAINTENANCE":  return { bg: "#fef9c3", color: "#854d0e" };
    case "RETIRED":            return { bg: "#f1f5f9", color: "#475569" };
    default:                   return { bg: "#f1f5f9", color: "#64748b" };
  }
};

/* ─── Format currency ────────────────────────────────────────── */
const fmtCurrency = (val) => {
  if (val == null) return "—";
  return "₹" + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

/* ─── Main Component ─────────────────────────────────────────── */
export default function GeneratorList() {
  const toast = useToast();
  const navigate = useNavigate();

  // ── Data state ────────────────────────────────────────────────
  const [generators, setGenerators]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [togglingId, setTogglingId]     = useState(null);

  // ── UI state ──────────────────────────────────────────────────
  const [search, setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage]           = useState(1);
  const [deleteId, setDeleteId]   = useState(null);

  const PAGE_SIZE = 8;

  /* ── Fetch generators ──────────────────────────────────────── */
  const fetchGenerators = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await generatorService.getAll({ size: 1000, sortBy: "createdAt", sortDir: "desc" });
      const content = res?.data?.content ?? res?.data ?? [];
      setGenerators(content);
    } catch (err) {
      toast({
        type: "error",
        title: "Failed to load generators",
        message: err?.message || "Could not connect to the server.",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenerators();
  }, [fetchGenerators]);

  /* ── Client-side filtering ─────────────────────────────────── */
  const filtered = generators.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch =
      g.name.toLowerCase().includes(q) ||
      g.generatorCode.toLowerCase().includes(q) ||
      (g.productBy || "").toLowerCase().includes(q);
    const matchActive =
      activeFilter === "all" ? true
      : activeFilter === "active" ? g.isActive
      : !g.isActive;
    return matchSearch && matchActive;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Toggle active status ──────────────────────────────────── */
  const handleToggle = async (id) => {
    const gen = generators.find((g) => g.id === id);
    if (!gen || togglingId) return;

    setTogglingId(id);
    setGenerators((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g))
    );

    try {
      await generatorService.update(id, { isActive: !gen.isActive });
      toast({
        type: "success",
        title: "Status updated",
        message: `"${gen.name}" is now ${!gen.isActive ? "active" : "inactive"}.`,
      });
    } catch (err) {
      setGenerators((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isActive: gen.isActive } : g))
      );
      toast({
        type: "error",
        title: "Update failed",
        message: err?.message || "Could not update generator status.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Delete generator ──────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteId) return;
    const gen = generators.find((g) => g.id === deleteId);

    try {
      await generatorService.delete(deleteId);
      setGenerators((prev) => prev.filter((g) => g.id !== deleteId));
      setDeleteId(null);
      const newFiltered = generators.filter((g) => g.id !== deleteId);
      const newTotal = Math.max(1, Math.ceil(newFiltered.length / PAGE_SIZE));
      if (page > newTotal) setPage(newTotal);

      toast({
        type: "success",
        title: "Generator deleted",
        message: gen ? `"${gen.name}" has been removed.` : "Generator deleted successfully.",
      });
    } catch (err) {
      setDeleteId(null);
      toast({
        type: "error",
        title: "Delete failed",
        message: err?.message || "Could not delete this generator.",
      });
    }
  };

  /* ── Create / Update generator ─────────────────────────────── */


  /* ── Derived stats ─────────────────────────────────────────── */
  const totals = {
    all:      generators.length,
    active:   generators.filter((g) => g.isActive).length,
    inactive: generators.filter((g) => !g.isActive).length,
    noStock:  generators.filter((g) => (g.stockQuantity ?? 0) === 0).length,
  };

  const SKELETON_COLS = 8;

  return (
    <>
      {/* ── Global Styles ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes gl-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes gl-spin { to { transform: rotate(360deg); } }

        .gl-page {
          min-height: 100vh;
          background: var(--color-bg);
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          padding: 28px 32px;
        }

        .gl-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .gl-page-title {
          font-size: clamp(18px, 3vw, 22px);
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: -0.4px;
          margin: 0;
        }
        .gl-breadcrumb {
          font-size: 13px;
          color: var(--color-text-subtle);
          margin: 3px 0 0;
        }
        .gl-breadcrumb a { color: var(--color-primary); text-decoration: none; }

        .gl-add-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--shadow-md);
          transition: all 0.2s;
          white-space: nowrap;
          font-family: inherit;
        }
        .gl-add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.35);
        }

        .gl-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .gl-stat-card {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          box-shadow: var(--shadow-sm);
        }
        .gl-stat-value {
          font-size: 26px;
          font-weight: 800;
          color: var(--color-text);
          line-height: 1;
        }
        .gl-stat-label {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 4px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .gl-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
          align-items: center;
          flex-wrap: wrap;
        }
        .gl-search-wrap {
          position: relative;
          flex: 1;
          min-width: 180px;
          max-width: 380px;
        }
        .gl-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-subtle);
          pointer-events: none;
          display: flex;
        }
        .gl-search-input {
          width: 100%;
          padding: 10px 14px 10px 36px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--color-text);
          background: var(--color-surface);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .gl-search-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        }
        .gl-filter-select {
          padding: 10px 14px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--color-text-muted);
          background: var(--color-surface);
          cursor: pointer;
          outline: none;
          min-width: 140px;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .gl-filter-select:focus { border-color: var(--color-primary); }
        .gl-result-count {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-left: auto;
          white-space: nowrap;
        }

        .gl-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }

        .gl-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .gl-table { width: 100%; border-collapse: collapse; }
        .gl-thead { background: var(--color-surface-2); border-bottom: 1.5px solid var(--color-border); }
        .gl-row { border-bottom: 1px solid var(--color-surface-2); transition: background 0.15s; }
        .gl-row:hover td { background: rgba(37,99,235,0.04) !important; }
        .gl-row:last-child { border-bottom: none; }

        .gl-action-btn { transition: transform 0.15s; }
        .gl-action-btn:hover:not(:disabled) { transform: scale(1.1); }

        .gl-toggle {
          position: relative;
          display: inline-block;
          width: 38px;
          height: 22px;
          flex-shrink: 0;
        }
        .gl-toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 11px;
          background: var(--color-border-strong);
          transition: background 0.2s;
        }
        .gl-toggle-track.on { background: var(--color-primary); }
        .gl-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-surface);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: left 0.2s;
        }
        .gl-toggle-thumb.on { left: 19px; }

        .gl-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-2);
          flex-wrap: wrap;
          gap: 10px;
        }
        .gl-page-btn { font-family: inherit; }
        .gl-page-btn:not([data-active="true"]):hover {
          background: var(--color-surface-2) !important;
        }

        /* ── Mobile cards ── */
        .gl-mobile-list { display: none; padding: 12px; }
        .gl-mobile-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          margin-bottom: 10px;
        }
        .gl-mobile-card:last-child { margin-bottom: 0; }
        .gl-mc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .gl-mc-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--color-text);
          font-size: 14px;
        }
        .gl-mc-actions { display: flex; gap: 6px; }
        .gl-mc-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .gl-mc-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          .gl-page { padding: 20px 24px; }
          .gl-stats-row { grid-template-columns: repeat(2, 1fr); }
          .gl-col-brand { display: none; }
          .gl-col-power { display: none; }
          .gl-col-rent { display: none; }
        }
        @media (max-width: 639px) {
          .gl-page { padding: 16px; }
          .gl-header { margin-bottom: 16px; }
          .gl-stats-row { gap: 8px; margin-bottom: 16px; }
          .gl-stat-card { padding: 12px 10px; }
          .gl-stat-value { font-size: 20px; }
          .gl-stat-label { font-size: 10px; }
          .gl-toolbar { gap: 8px; margin-bottom: 14px; }
          .gl-search-wrap { max-width: none; min-width: 0; flex: 1 1 100%; }
          .gl-filter-select { flex: 1; min-width: 0 !important; }
          .gl-result-count { margin-left: 0; }
          .gl-table-wrap { display: none; }
          .gl-mobile-list { display: block; }
          .gl-pagination { padding: 12px 16px; }
        }
        @media (max-width: 359px) {
          .gl-page { padding: 12px; }
          .gl-stat-value { font-size: 18px; }
          .gl-stat-label { font-size: 9px; }
          .gl-add-btn { padding: 9px 12px; font-size: 13px; }
        }
      `}</style>

      {/* ── Page ───────────────────────────────────────────────── */}
      <div className="gl-page">

        {/* Header */}
        <div className="gl-header">
          <div>
            <h1 className="gl-page-title">Generator Management</h1>
            <p className="gl-breadcrumb">
              <a href="#">Home</a> › Generators
            </p>
          </div>
          <button
            className="gl-add-btn"
            onClick={() => navigate(ROUTES.GENERATOR_ADD)}
            disabled={loading}
          >
            <Icon.Plus /> Add Generator
          </button>
        </div>

        {/* Stats */}
        <div className="gl-stats-row">
          {[
            { color: "var(--color-primary)", value: loading ? "—" : totals.all,      label: "Total Generators" },
            { color: "#059669", value: loading ? "—" : totals.active,   label: "Active" },
            { color: "#64748b", value: loading ? "—" : totals.inactive,  label: "Inactive" },
            { color: "#d97706", value: loading ? "—" : totals.noStock,   label: "Zero Stock" },
          ].map(({ color, value, label }) => (
            <div key={label} className="gl-stat-card" style={{ borderLeft: `4px solid ${color}` }}>
              <div className="gl-stat-value" style={{ color: loading ? "var(--color-border-strong)" : undefined }}>
                {value}
              </div>
              <div className="gl-stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="gl-toolbar">
          <div className="gl-search-wrap">
            <span className="gl-search-icon"><Icon.Search /></span>
            <input
              className="gl-search-input"
              placeholder="Search by name, code, product by…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              disabled={loading}
            />
          </div>
          <select
            className="gl-filter-select"
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="gl-result-count">
            {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Main Card */}
        <div className="gl-card">

          {/* ── Desktop Table ─────────────────────────────────── */}
          <div className="gl-table-wrap">
            <table className="gl-table">
              <thead className="gl-thead">
                <tr>
                  <th style={{ ...thStyle, width: 48 }}>#</th>
                  <th style={thStyle}>Generator</th>
                  <th style={thStyle}>Code (SKU)</th>
                  <th style={thStyle}>Product By</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Purchase ₹</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Rent ₹</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Stock</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Active</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={SKELETON_COLS} />
                  ))
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
                      <div style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>
                        {search || activeFilter !== "all" ? "No generators match your filters" : "No generators yet"}
                      </div>
                      <div style={{ fontSize: 13, marginTop: 4, color: "var(--color-text-subtle)" }}>
                        {search || activeFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : 'Click "Add Generator" to register your first generator'}
                      </div>
                    </td>
                  </tr>
                ) : paged.map((gen, i) => {
                  const sc = statusColor(gen.currentStatus);
                  return (
                    <tr
                      key={gen.id}
                      className="gl-row"
                      style={{ background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)" }}
                    >
                      <td style={{ ...tdStyle, color: "var(--color-text-subtle)", fontSize: 13, width: 48 }}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
                          <div>
                            <div>{gen.name}</div>
                            {gen.fuelType && (
                              <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 400, marginTop: 1 }}>
                                {FUEL_LABELS[gen.fuelType] || gen.fuelType}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-block",
                          background: "var(--color-primary-100)",
                          color: "var(--color-primary-dark)",
                          fontWeight: 600,
                          fontSize: 12,
                          padding: "2px 10px",
                          borderRadius: 6,
                          fontFamily: "monospace",
                        }}>
                          {gen.generatorCode}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
                          {gen.productBy || "—"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontSize: 13 }}>
                        {fmtCurrency(gen.purchasePrice)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontSize: 13, color: 'var(--color-primary)' }}>
                        {fmtCurrency(gen.rentPrice)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                        <span style={{ color: (gen.stockQuantity ?? 0) === 0 ? "var(--color-danger)" : "var(--color-text)" }}>
                          {gen.stockQuantity ?? 0}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <Toggle
                          active={gen.isActive}
                          onToggle={() => handleToggle(gen.id)}
                          disabled={togglingId === gen.id}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            className="gl-action-btn"
                            style={actionBtnStyle("blue", false)}
                            title="View"
                            onClick={() => navigate(ROUTES.GENERATOR_DETAIL.replace(":id", gen.id))}
                          >
                            <Icon.Eye />
                          </button>
                          <button
                            className="gl-action-btn"
                            style={actionBtnStyle("amber", false)}
                            title="Edit"
                            onClick={() => navigate(ROUTES.GENERATOR_EDIT.replace(":id", gen.id))}
                          >
                            <Icon.Edit />
                          </button>
                          <button
                            className="gl-action-btn"
                            style={actionBtnStyle("red", false)}
                            title="Delete"
                            onClick={() => setDeleteId(gen.id)}
                          >
                            <Icon.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ──────────────────────────────────── */}
          <div className="gl-mobile-list">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="gl-mobile-card">
                  <div style={{ height: 14, width: "60%", borderRadius: 6, background: "var(--color-border)", marginBottom: 8, animation: "gl-pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 10, width: "40%", borderRadius: 6, background: "var(--color-border)", animation: "gl-pulse 1.5s ease-in-out infinite" }} />
                </div>
              ))
            ) : paged.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-muted)" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
                <div style={{ fontWeight: 600 }}>No generators found</div>
              </div>
            ) : paged.map((gen) => {
              const sc = statusColor(gen.currentStatus);
              return (
                <div key={gen.id} className="gl-mobile-card">
                  <div className="gl-mc-header">
                    <div className="gl-mc-name">
                      <div>
                        <div>{gen.name}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 400, fontFamily: "monospace" }}>
                          {gen.generatorCode}
                        </div>
                      </div>
                    </div>
                    <div className="gl-mc-actions">
                      <button className="gl-action-btn" style={actionBtnStyle("blue", false)} title="View" onClick={() => navigate(ROUTES.GENERATOR_DETAIL.replace(":id", gen.id))}>
                        <Icon.Eye />
                      </button>
                      <button className="gl-action-btn" style={actionBtnStyle("amber", false)} title="Edit" onClick={() => navigate(ROUTES.GENERATOR_EDIT.replace(":id", gen.id))}>
                        <Icon.Edit />
                      </button>
                      <button className="gl-action-btn" style={actionBtnStyle("red", false)} title="Delete" onClick={() => setDeleteId(gen.id)}>
                        <Icon.Trash />
                      </button>
                    </div>
                  </div>
                  <div className="gl-mc-meta">
                    <span style={{ ...sc, padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                      {STATUS_LABELS[gen.currentStatus]}
                    </span>
                    {gen.fuelType && (
                      <span style={{ padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: "#64748b" }}>
                        {FUEL_LABELS[gen.fuelType]}
                      </span>
                    )}
                    {gen.ratedPowerKva && (
                      <span style={{ padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: "var(--color-primary-100)", color: "var(--color-primary-dark)" }}>
                        {gen.ratedPowerKva} KVA
                      </span>
                    )}
                  </div>
                  <div className="gl-mc-footer">
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      Purchase: <strong>{fmtCurrency(gen.purchasePrice)}</strong>
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-primary)", marginLeft: 8 }}>
                      Rent: <strong>{fmtCurrency(gen.rentPrice)}</strong>
                    </span>
                    <div style={{ marginLeft: "auto" }}>
                      <Toggle active={gen.isActive} onToggle={() => handleToggle(gen.id)} disabled={togglingId === gen.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ────────────────────────────────────── */}
          {!loading && filtered.length > 0 && (
            <div className="gl-pagination">
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="gl-page-btn"
                  style={pageBtnStyle(false)}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Icon.ChevronLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span style={{ alignSelf: "center", fontSize: 12, color: "var(--color-text-subtle)", padding: "0 2px" }}>…</span>
                      )}
                      <button
                        className="gl-page-btn"
                        data-active={page === p}
                        style={pageBtnStyle(page === p)}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  className="gl-page-btn"
                  style={pageBtnStyle(false)}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <Icon.ChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* ── Delete Confirmation Modal ─────────────────────────── */}
      {deleteId && (
        <ConfirmModal
          title="Delete Generator"
          message={`Are you sure you want to delete "${generators.find((g) => g.id === deleteId)?.name || "this generator"}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
