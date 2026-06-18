// src/components/layout/Header.jsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, User, LogOut } from 'lucide-react';
import { useUIStore }     from '@/store/uiStore';
import { useAuth }        from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES }         from '@/constants/routes';
import { ROLE_LABELS }    from '@/constants/roles';

export default function Header() {
  const { toggleMobileSidebar } = useUIStore();
  const { user, logout }        = useAuth();
  const { canAccess }           = usePermissions();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', options));
  }, []);

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 shrink-0"
      style={{
        height:      'var(--header-height)',
        background:  'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow:   'var(--shadow-sm)',
      }}
    >
      {/* Left side: Hamburger + Date */}
      <div className="flex items-center gap-4">
        {/* Hamburger — mobile only (lg+: hidden) */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
          className="header-icon-btn lg:hidden p-2 rounded-md transition-colors"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Date */}
        {currentDate && (
          <span className="hidden sm:inline" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            {currentDate}
          </span>
        )}
      </div>

      {/* Right side: Profile + Logout */}
      <div className="flex items-center gap-4">
        {/* Profile Link */}
        {canAccess(ROUTES.PROFILE) && (
          <NavLink
            to={ROUTES.PROFILE}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 font-semibold text-sm"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(37,99,235,0.15)',
                border:     '1px solid rgba(37,99,235,0.30)',
              }}
            >
              <User size={14} className="text-blue-600" />
            </div>

            <div className="hidden sm:block text-left">
              <p
                className="text-xs font-bold leading-none"
                style={{ color: 'var(--color-text)', margin: 0 }}
              >
                {user?.fullName}
              </p>
              <p
                className="text-[10px] font-medium mt-0.5"
                style={{ color: 'var(--color-text-subtle)', margin: 0 }}
              >
                {ROLE_LABELS[user?.role] ?? user?.role}
              </p>
            </div>
          </NavLink>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm"
          style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
        >
          <LogOut size={16} className="shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}