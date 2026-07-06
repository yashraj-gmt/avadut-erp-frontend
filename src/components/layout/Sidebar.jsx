// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Zap, ClipboardList, Box,
} from 'lucide-react';
import { useState } from 'react';
import { useUIStore }     from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES }         from '@/constants/routes';
import { cn }             from '@/utils/cn';

/* ────────────────────────────────────────────────────────────────────────
   NavItem — a single flat sidebar link
──────────────────────────────────────────────────────────────────────── */
function NavItem({ label, icon: Icon, route, collapsed }) {
  return (
    <NavLink
      to={route}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-lg text-sm font-semibold w-full transition-all duration-200',
          collapsed ? 'justify-center py-2.5 px-0' : 'py-3 px-4',
          isActive
            ? 'bg-[#0052cc] text-white hover:bg-[#0041a3]'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        )
      }
      style={{ marginBottom: '6px', textDecoration: 'none' }}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="shrink-0" />}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
    </NavLink>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   SubNavItem — an indented child link inside a dropdown group
──────────────────────────────────────────────────────────────────────── */
function SubNavItem({ label, icon: Icon, route }) {
  return (
    <NavLink
      to={route}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg text-sm font-semibold w-full transition-all duration-200',
          'py-2.5 pl-10 pr-3',
          isActive
            ? 'bg-[#0052cc] text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        )
      }
      style={{ marginBottom: '4px', textDecoration: 'none' }}
    >
      {Icon && <Icon size={15} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   DropdownGroup — collapsible parent menu item with child links
──────────────────────────────────────────────────────────────────────── */
function DropdownGroup({ label, icon: Icon, collapsed, children, isActive }) {
  const [open, setOpen] = useState(isActive);

  // Re-open if a child becomes active while collapsed
  if (isActive && !open && !collapsed) {
    // intentional: keep open when already active
  }

  if (collapsed) {
    // Collapsed sidebar: show only the parent icon (no dropdown)
    return (
      <div
        title={label}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 8, marginBottom: 6, padding: '10px 0',
          cursor: 'pointer',
          color: isActive ? '#fff' : '#94a3b8',
          background: isActive ? '#0052cc' : 'transparent',
          transition: 'all .2s',
        }}
      >
        {Icon && <Icon size={18} />}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Parent trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', width: '100%',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          padding: '12px 16px', gap: 12, fontFamily: 'inherit',
          fontSize: 14, fontWeight: 600, transition: 'all .2s',
          background: isActive ? 'rgba(0,82,204,.15)' : 'transparent',
          color: isActive ? '#60a5fa' : '#94a3b8',
          marginBottom: 2,
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = '#1e293b';
            e.currentTarget.style.color = '#e2e8f0';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }
        }}
      >
        <Icon size={18} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {open
          ? <ChevronUp size={14} style={{ flexShrink: 0, opacity: .75 }} />
          : <ChevronDown size={14} style={{ flexShrink: 0, opacity: .75 }} />
        }
      </button>

      {/* Children with smooth expand/collapse */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? '200px' : '0px',
          transition: 'max-height .28s ease',
        }}
      >
        <div style={{ paddingBottom: 4 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Sidebar Main Component
──────────────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUIStore();

  const location  = useLocation();
  const { canAccess } = usePermissions();
  const sc = sidebarCollapsed;

  // Whether any Generator route is currently active
  const isGenActive = location.pathname.startsWith('/generators');

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full flex flex-col z-50 transition-all duration-300',
        'lg:translate-x-0',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
      style={{
        width:      sc ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        background: '#111827',
      }}
    >
      {/* ── Logo / Header Area ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center transition-all duration-300 w-full shrink-0"
        style={{
          height: sc ? '64px' : '150px',
          background: '#ffffff',
          padding: sc ? '8px' : '16px',
          position: 'relative',
          borderRight: '1px solid var(--color-border)'
        }}
      >
        <div className="flex items-center justify-center w-full h-full overflow-hidden">
          <img
            src="/images/avadhut-logo.png"
            alt="Avadhut Logo"
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Mobile — close button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
          className="lg:hidden absolute right-3 top-3 p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">

        {/* Dashboard */}
        {canAccess(ROUTES.DASHBOARD) && (
          <NavItem
            label="Dashboard"
            icon={LayoutDashboard}
            route={ROUTES.DASHBOARD}
            collapsed={sc}
          />
        )}

        {/* Products Management */}
        {canAccess(ROUTES.PRODUCTS) && (
          <NavItem
            label="Products Management"
            icon={Package}
            route={ROUTES.PRODUCTS}
            collapsed={sc}
          />
        )}

        {/* ── Generator Management dropdown ── */}
        {(canAccess(ROUTES.GENERATORS) || canAccess(ROUTES.GENERATOR_ORDERS)) && (
          <DropdownGroup
            label="Generator Management"
            icon={Zap}
            collapsed={sc}
            isActive={isGenActive}
          >
            {canAccess(ROUTES.GENERATORS) && (
              <SubNavItem
                label="Generator Inventory"
                icon={Box}
                route={ROUTES.GENERATORS}
              />
            )}
            {canAccess(ROUTES.GENERATOR_ORDERS) && (
              <SubNavItem
                label="Order Management"
                icon={ClipboardList}
                route={ROUTES.GENERATOR_ORDERS}
              />
            )}
          </DropdownGroup>
        )}

        {/* Roles */}
        {canAccess(ROUTES.ROLES) && (
          <NavItem
            label="Roles"
            icon={ShieldCheck}
            route={ROUTES.ROLES}
            collapsed={sc}
          />
        )}

      </nav>
    </aside>
  );
}