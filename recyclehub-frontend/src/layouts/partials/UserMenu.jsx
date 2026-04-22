import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, Key, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { resolveProfileImageUrl } from '../../utils/assetUrl';

export default function UserMenu({ variant = 'light' }) {
  const isDark = variant === 'dark';
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'U';
  const avatarUrl = resolveProfileImageUrl(user?.profileImageUrl);

  const menuItems = [
    { icon: <User size={14} />, label: 'Profile', path: '/profile' },
    { icon: <Settings size={14} />, label: 'Settings', path: '/settings' },
    { icon: <Key size={14} />, label: 'Change Password', path: '/change-password' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={
          isDark
            ? 'flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors'
            : 'flex items-center gap-2 p-1.5 rounded-xl hover:bg-hub-surface2 transition-colors'
        }
        aria-label="User menu"
      >
        {avatarUrl ? (
          <div
            className={`w-7 h-7 rounded-full overflow-hidden shrink-0 bg-hub-surface2 ${
              isDark ? 'ring-2 ring-white/15' : 'ring-2 ring-hub-border/40'
            }`}
          >
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className={`w-7 h-7 rounded-full bg-hub-accent flex items-center justify-center text-white text-xs font-display font-bold ${
              isDark ? 'ring-2 ring-white/15' : ''
            }`}
          >
            {initials}
          </div>
        )}
        <span
          className={`hidden md:block text-sm font-body ${
            isDark ? 'text-white' : 'text-hub-text'
          }`}
        >
          {user?.firstName || 'User'}
        </span>
        <ChevronDown size={14} className={isDark ? 'text-emerald-300/80' : 'text-hub-muted'} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-52 bg-hub-surface border border-hub-border rounded-2xl shadow-2xl z-50 animate-slide-up overflow-hidden">
          <div className="px-4 py-3 border-b border-hub-border">
            <p className="text-sm font-medium text-hub-text">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-hub-muted">{user?.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-hub-accent/10 text-hub-accent border border-hub-accent/20 mt-1">{user?.role}</span>
          </div>
          <div className="p-2">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-hub-muted hover:text-hub-text hover:bg-hub-surface2 transition-colors">
                {item.icon}{item.label}
              </Link>
            ))}
          </div>
          <div className="p-2 border-t border-hub-border">
            <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors">
              <LogOut size={14} />Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
