// src/components/layout/Header.jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Bell, Check } from 'lucide-react';
import { useUIStore }     from '@/store/uiStore';
import { useAuth }        from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES }         from '@/constants/routes';
import { ROLE_LABELS }    from '@/constants/roles';
import { notificationService } from '@/services/notificationService';
import { getImageUrl } from '@/utils/imageUrl';
import { formatToDMY } from '@/utils/helpers';

export default function Header() {
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useUIStore();
  const { user, token, logout } = useAuth();
  const { canAccess }           = usePermissions();
  const [currentDate, setCurrentDate] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.profilePic]);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu]   = useState(false);
  const notifRef                           = useRef(null);

  useEffect(() => {
    const today = new Date();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    setCurrentDate(`${weekday}, ${formatToDMY(today)}`);
  }, []);

  const checkedOverdueRef = useRef(false);

  // Fetch unread notifications & check overdue (admin/super-admin only)
  const fetchNotifications = async () => {
    if (!user || !token) return;
    // /api/admin/notifications/** is restricted to ADMIN and SUPER_ADMIN roles
    const isAdmin = user.role === 'ROLE_ADMIN' || user.role === 'ROLE_SUPER_ADMIN'
                 || user.role === 'ADMIN'       || user.role === 'SUPER_ADMIN';
    if (!isAdmin) return;
    try {
      // Run overdue check once on initial load, not repeatedly on every 60s poll
      if (!checkedOverdueRef.current) {
        checkedOverdueRef.current = true;
        await notificationService.checkOverdue().catch(() => {});
      }
      // Then fetch unread list
      const res = await notificationService.getUnread();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setNotifications(list);
    } catch (err) {
      // Silent error if notification check fails (e.g. guest mode)
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleMarkRead = async (id, refId) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (refId) {
        navigate(ROUTES.GENERATOR_ORDERS);
        setShowNotifMenu(false);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 shrink-0 relative z-30"
      style={{
        height:      'var(--header-height)',
        background:  'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow:   'var(--shadow-sm)',
      }}
    >
      {/* Left side: Hamburger + Date */}
      <div className="flex items-center gap-4">
        {/* Hamburger - mobile only (lg+: hidden) */}
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

      {/* Right side: Notifications + Profile + Logout */}
      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(prev => !prev)}
            aria-label="Notifications"
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors relative"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-600 rounded-full"
                style={{ minWidth: 16, height: 16, padding: '0 4px' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotifMenu && (
            <div
              className="fixed sm:absolute top-[calc(var(--header-height)+6px)] sm:top-full left-2 right-2 sm:left-auto sm:right-0 sm:mt-2 sm:w-96 max-w-md sm:max-w-none mx-auto sm:mx-0 bg-white rounded-xl shadow-2xl sm:shadow-xl border border-slate-200 z-50 overflow-hidden"
              style={{ animation: 'go-fadein 0.15s ease' }}
            >
              <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-medium text-slate-500">
                    Payment Alerts
                  </span>
                )}
              </div>

              <div className="max-h-[70vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    🎉 No pending notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id, n.referenceId)}
                      className="p-3 sm:p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-2.5 sm:gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        ⚠️
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">{n.title}</div>
                        <div className="text-[11.5px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Click to view & dismiss</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                        className="text-slate-400 hover:text-green-600 p-1 rounded transition-colors shrink-0"
                        title="Dismiss"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link */}
        {canAccess(ROUTES.PROFILE) && (
          <NavLink
            to={ROUTES.PROFILE}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 font-semibold text-sm"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: 'rgba(37,99,235,0.15)',
                border:     '1px solid rgba(37,99,235,0.30)',
              }}
            >
              {user?.profilePic && !imgError ? (
                <img
                  src={getImageUrl(user.profilePic)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <User size={14} className="text-blue-600" />
              )}
            </div>

            <div className="hidden sm:block text-left">
              <p
                className="text-xs font-bold leading-none"
                style={{ color: 'var(--color-text)', margin: 0 }}
              >
                {user?.fullName || user?.name}
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