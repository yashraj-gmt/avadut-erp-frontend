// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShieldCheck,
  ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { useUIStore }     from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES }         from '@/constants/routes';
import { cn }             from '@/utils/cn';

/* ── Sidebar Navigation Items ────────────────────────────────────────── */
const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD },
  { label: 'Products Management', icon: Package, route: ROUTES.PRODUCTS, isFlat: true },
  { label: 'Generator Management', icon: Zap, route: ROUTES.GENERATORS, isFlat: true },
  { label: 'Roles', icon: ShieldCheck, route: ROUTES.ROLES },
];

/* ────────────────────────────────────────────────────────────────────────
   NavItem — a single flat sidebar link
──────────────────────────────────────────────────────────────────────── */
function NavItem({ label, icon: Icon, route, collapsed, isFlat }) {
  const showIcon = !isFlat || collapsed;
  return (
    <NavLink
      to={route}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-lg text-sm font-semibold w-full transition-all duration-200',
          collapsed ? 'justify-center py-2.5 px-0' : 'justify-between py-3 px-4',
          isActive
            ? 'bg-[#0052cc] text-white hover:bg-[#0041a3]'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        )
      }
      style={{
        marginBottom: '6px',
        textDecoration: 'none',
      }}
    >
      <div className="flex items-center gap-3">
        {showIcon && Icon && <Icon size={18} className="shrink-0" />}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
      {isFlat && !collapsed && <ChevronRight size={14} className="shrink-0 opacity-75" />}
    </NavLink>
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

  const { canAccess } = usePermissions();
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
        {SIDEBAR_ITEMS.filter((i) => canAccess(i.route)).map((item) => (
          <NavItem key={item.route} {...item} collapsed={sc} />
        ))}
      </nav>
    </aside>
  );
}