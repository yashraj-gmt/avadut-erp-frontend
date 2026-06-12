// src/components/layout/Sidebar.jsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronDown,
  LogOut, User, Database, Warehouse, Zap,
} from 'lucide-react';
import { useUIStore }     from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth }        from '@/hooks/useAuth';
import { ROUTES }         from '@/constants/routes';
import { ROLE_LABELS }    from '@/constants/roles';
import { cn }             from '@/utils/cn';
import { ENV }            from '@/config/env';

/* ── Top-level nav items (no grouping) ─────────────────────────────────── */
const TOP_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD  },
];

/* ── Inventory group ───────────────────────────────────────────────────── */
const INVENTORY_NAV = [
  { label: 'Products',   icon: Package, route: ROUTES.PRODUCTS   },
  { label: 'Categories', icon: Tag,     route: ROUTES.CATEGORIES },
];

/* ── Master Data group ─────────────────────────────────────────────────── */
const MASTER_DATA_NAV = [
  { label: 'Warehouses', icon: Warehouse, route: ROUTES.WAREHOUSES },
];

/* ── Generator Management ─────────────────────────────────────────────── */
const GENERATOR_NAV = [
  { label: 'Generators', icon: Zap, route: ROUTES.GENERATORS },
];

/* ── Roles ─────────────────────────────────────────────────────────────── */
const BOTTOM_NAV = [
  { label: 'Roles', icon: ShieldCheck, route: ROUTES.ROLES },
];

/* ────────────────────────────────────────────────────────────────────────
   NavItem — a single sidebar link
──────────────────────────────────────────────────────────────────────── */
function NavItem({ label, icon: Icon, route, collapsed }) {
  return (
    <NavLink
      to={route}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'sidebar-link flex items-center py-2.5 rounded-lg text-sm w-full',
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          isActive && 'active'
        )
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   NavGroup — collapsible section with sub-items
   Collapses to icon-only (tooltip) when the whole sidebar is collapsed.
──────────────────────────────────────────────────────────────────────── */
function NavGroup({
  label,
  icon: GroupIcon,
  items,
  sidebarCollapsed,
  canAccess,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const visibleItems = items.filter((i) => canAccess(i.route));
  if (!visibleItems.length) return null;

  /* ── When sidebar is fully collapsed: show each sub-item icon directly ── */
  if (sidebarCollapsed) {
    return (
      <div className="space-y-1">
        {visibleItems.map(({ label: lbl, icon: Icon, route }) => (
          <NavLink
            key={route}
            to={route}
            title={lbl}
            className={({ isActive }) =>
              cn(
                'sidebar-link flex items-center justify-center py-2.5 rounded-lg text-sm w-full',
                isActive && 'active'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* ── Group header button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'sidebar-icon-btn w-full flex items-center gap-3 px-3 py-2.5',
          'rounded-lg text-sm font-medium transition-all duration-150',
        )}
        style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
      >
        <GroupIcon size={18} className="shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* ── Sub-items ── */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? `${visibleItems.length * 52}px` : '0',
          transition: 'max-height 0.22s ease',
        }}
      >
        <div className="pl-4 pt-0.5 space-y-0.5">
          {/* Left accent line */}
          <div className="relative">
            <div
              className="absolute left-0 top-1 bottom-1 w-px rounded-full"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            />
            <div className="pl-3 space-y-0.5">
              {visibleItems.map(({ label: lbl, icon: Icon, route }) => (
                <NavLink
                  key={route}
                  to={route}
                  title={lbl}
                  className={({ isActive }) =>
                    cn(
                      'sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full',
                      isActive && 'active'
                    )
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{lbl}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Section divider label
──────────────────────────────────────────────────────────────────────── */
function NavSectionLabel({ children, collapsed }) {
  if (collapsed) return <div className="h-3" />;
  return (
    <p
      className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest truncate"
      style={{ color: 'rgba(203,213,225,0.45)' }}
    >
      {children}
    </p>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Sidebar
──────────────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const {
    sidebarCollapsed,
    toggleCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUIStore();

  const { canAccess } = usePermissions();
  const { user, logout } = useAuth();

  const sc = sidebarCollapsed; // shorthand

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full flex flex-col z-50 transition-all duration-300',
        'lg:translate-x-0',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
      style={{
        width:      sc ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        background: 'var(--color-sidebar-bg)',
      }}
    >
      {/* ── Logo / collapse toggle ─────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-between px-4 shrink-0 transition-all duration-300",
          sc ? "h-16" : "h-28"
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {!sc && (
          <div className="flex items-center h-24 overflow-hidden pr-2">
            <img
              src="/images/erp-logo.png"
              alt="Logo"
              className="max-h-full w-auto object-contain"
            />
          </div>
        )}

        {/* Desktop — collapse toggle */}
        <button
          onClick={toggleCollapsed}
          aria-label={sc ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'sidebar-icon-btn hidden lg:flex p-1.5 rounded-md shrink-0',
            sc ? 'mx-auto' : 'ml-auto',
          )}
        >
          {sc ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Mobile — close button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
          className="sidebar-icon-btn lg:hidden ml-auto p-1.5 rounded-md shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">

        {/* ── Core ── */}
        {TOP_NAV.filter((i) => canAccess(i.route)).map((item) => (
          <NavItem key={item.route} {...item} collapsed={sc} />
        ))}

        {/* ── Inventory group ── */}
        <NavSectionLabel collapsed={sc}>Inventory</NavSectionLabel>
        <NavGroup
          label="Inventory"
          icon={Package}
          items={INVENTORY_NAV}
          sidebarCollapsed={sc}
          canAccess={canAccess}
          defaultOpen
        />

        {/* ── Master Data group ── */}
        <NavSectionLabel collapsed={sc}>Master Data</NavSectionLabel>
        <NavGroup
          label="Master Data"
          icon={Database}
          items={MASTER_DATA_NAV}
          sidebarCollapsed={sc}
          canAccess={canAccess}
          defaultOpen
        />

        {/* ── Generator Management group ── */}
        <NavSectionLabel collapsed={sc}>Generators</NavSectionLabel>
        <NavGroup
          label="Generator Management"
          icon={Zap}
          items={GENERATOR_NAV}
          sidebarCollapsed={sc}
          canAccess={canAccess}
          defaultOpen
        />

        {/* ── Admin ── */}
        <NavSectionLabel collapsed={sc}>Admin</NavSectionLabel>
        {BOTTOM_NAV.filter((i) => canAccess(i.route)).map((item) => (
          <NavItem key={item.route} {...item} collapsed={sc} />
        ))}
      </nav>

      {/* ── Bottom: Profile + Logout ────────────────────────────────────── */}
      <div
        className="p-2 space-y-1 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Profile */}
        {canAccess(ROUTES.PROFILE) && (
          <NavLink
            to={ROUTES.PROFILE}
            title={sc ? (user?.fullName ?? 'Profile') : undefined}
            className={({ isActive }) =>
              cn(
                'sidebar-link flex items-center py-2.5 rounded-lg text-sm w-full',
                sc ? 'justify-center px-0' : 'gap-3 px-3',
                isActive && 'active',
              )
            }
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(37,99,235,0.20)',
                border:     '1px solid rgba(37,99,235,0.40)',
              }}
            >
              <User size={14} style={{ color: 'var(--color-accent-light)' }} />
            </div>

            {!sc && (
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-sm font-medium leading-none truncate"
                  style={{ color: 'var(--color-text-inverse)' }}
                >
                  {user?.fullName}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-sidebar-text)' }}>
                  {ROLE_LABELS[user?.role] ?? user?.role}
                </p>
              </div>
            )}
          </NavLink>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          title={sc ? 'Logout' : undefined}
          className={cn(
            'sidebar-logout flex items-center py-2.5 rounded-lg text-sm w-full',
            sc ? 'justify-center px-0' : 'gap-3 px-3',
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!sc && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}