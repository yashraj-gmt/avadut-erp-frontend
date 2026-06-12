import React, { useState, useEffect } from "react";

/* ─── Icons ──────────────────────────────────────────────────── */
const Icon = {
  X: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  Tag: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/**
 * CategoryForm — Create / Edit modal.
 *
 * Props:
 *   item    — category object when editing, null when creating
 *   saving  — boolean controlled by parent (shows spinner, disables submit)
 *   onSave  — (formData) => void  — parent handles the API call
 *   onClose — () => void
 */
export default function CategoryForm({ item, saving = false, onSave, onClose }) {
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    name:        "",
    description: "",
    isActive:    true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setForm({
        name:        item.name        ?? "",
        description: item.description ?? "",
        isActive:    item.isActive    ?? true,
      });
    }
  }, [item]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                e.name = "Category name is required.";
    else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    else if (form.name.trim().length > 100) e.name = "Name cannot exceed 100 characters.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    // Pass validated data to parent — parent handles API + loading state
    onSave({ ...(item || {}), ...form, name: form.name.trim() });
  };

  const field = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  /* ─── Styles ─────────────────────────────────────── */
  const overlay = {
    position: "fixed", inset: 0,
    background: "rgba(15,23,42,0.5)",
    backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 16,
  };
  const modal = {
    background: "#fff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 500,
    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
    overflow: "hidden",
    animation: "slideUp 0.25s ease",
  };
  const modalHeader = {
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    padding: "20px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const modalBody = { padding: "28px 28px 24px" };
  const label = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  };
  const inputBase = (hasErr) => ({
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${hasErr ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: 10,
    fontSize: 14,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  });
  const errText = { fontSize: 12, color: "#ef4444", marginTop: 4 };
  const formGroup = { marginBottom: 20 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .cf-input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        .cf-close:hover { background: rgba(255,255,255,0.25) !important; }
        .cf-cancel:hover { background: #f1f5f9 !important; }
        .cf-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4) !important; }
        .cf-submit:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      <div style={overlay} onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
        <div style={modal}>
          {/* Modal Header */}
          <div style={modalHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>
                <Icon.Tag />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff" }}>
                  {isEdit ? "Edit Category" : "New Category"}
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                  {isEdit ? `Editing: ${item.name}` : "Fill in the details to create a category"}
                </p>
              </div>
            </div>
            <button
              className="cf-close"
              onClick={onClose}
              disabled={saving}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 8, padding: 6, cursor: saving ? "not-allowed" : "pointer",
                color: "#fff", opacity: saving ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}
            >
              <Icon.X />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} style={modalBody}>
            {/* Name */}
            <div style={formGroup}>
              <label style={label}>
                Category Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                className="cf-input"
                style={inputBase(errors.name)}
                placeholder="e.g. Electronics"
                value={form.name}
                onChange={(e) => { field("name", e.target.value); setErrors((err) => ({ ...err, name: "" })); }}
                maxLength={100}
                disabled={saving}
              />
              {errors.name && <div style={errText}>{errors.name}</div>}
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {form.name.length}/100 characters
              </div>
            </div>

            {/* Description */}
            <div style={formGroup}>
              <label style={label}>Description</label>
              <textarea
                className="cf-input"
                style={{ ...inputBase(false), resize: "vertical", minHeight: 90, lineHeight: 1.6, opacity: saving ? 0.7 : 1 }}
                placeholder="Brief description of this category (optional)"
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Is Active */}
            <div style={{
              ...formGroup,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
              border: "1.5px solid #e2e8f0",
              opacity: saving ? 0.7 : 1,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Active Status</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {form.isActive ? "Category is visible and available" : "Category is hidden from users"}
                </div>
              </div>
              <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: saving ? "not-allowed" : "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => field("isActive", e.target.checked)}
                  disabled={saving}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", inset: 0, borderRadius: 12,
                  background: form.isActive ? "#6366f1" : "#cbd5e1",
                  transition: "background 0.2s",
                }} />
                <span style={{
                  position: "absolute",
                  top: 3, left: form.isActive ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }} />
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                type="button"
                className="cf-cancel"
                onClick={onClose}
                disabled={saving}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#334155", fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 14, transition: "background 0.15s",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cf-submit"
                disabled={saving}
                style={{
                  flex: 2, padding: "12px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 14, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                  transition: "all 0.2s",
                }}
              >
                {saving ? (
                  <>
                    <span style={{
                      width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      display: "inline-block", animation: "cf-spin 0.7s linear infinite",
                    }} />
                    Saving…
                  </>
                ) : (
                  <>
                    <Icon.Check />
                    {isEdit ? "Save Changes" : "Create Category"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes cf-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}