import { NavLink, useNavigate } from 'react-router-dom';
import { Recycle, X } from 'lucide-react';

/**
 * @param {'light' | 'app'} variant — app = dark sidebar for authenticated dashboard
 */
export default function Sidebar({ navItems, isOpen, onClose, className = '', variant = 'light' }) {
  const navigate = useNavigate();
  const dark = variant === 'app';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed left-0 top-0 h-full w-sidebar z-40 flex flex-col transition-transform duration-300 shadow-shell lg:shadow-none
        ${dark ? 'bg-hub-dark border-r border-white/10' : 'bg-white border-r border-hub-border shadow-sm'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${className}`}
      >
        {/* Brand */}
        <div className={`flex items-center justify-between p-5 border-b ${dark ? 'border-white/10' : 'border-hub-border'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-hub-accent'}`}>
              <Recycle size={16} className="text-white" />
            </div>
            <div>
              <span className={`font-display font-bold block leading-tight ${dark ? 'text-white' : 'text-hub-text'}`}>RecycleHub</span>
              {dark && <span className="text-[10px] uppercase tracking-widest text-emerald-400/90 font-medium">Workspace</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`lg:hidden p-1 rounded-lg ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-hub-muted hover:text-hub-text'}`}
          >
            <X size={18} />
          </button>
        </div>
        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all duration-150 ${isActive
                  ? dark
                    ? 'bg-white/10 text-white font-medium border border-white/10 shadow-inner'
                    : 'bg-hub-accent/10 text-hub-accent font-medium border border-hub-accent/20'
                  : dark
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-hub-muted hover:text-hub-text hover:bg-hub-surface2'}`
              }
            >
              {item.icon && <span className="shrink-0 opacity-90">{item.icon}</span>}
              {item.label}
              {item.badge > 0 && (
                <span
                  className={`ml-auto text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-mono ${
                    dark ? 'bg-emerald-500 text-white' : 'bg-hub-accent text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className={`p-4 border-t text-[11px] leading-relaxed ${dark ? 'border-white/10 text-slate-500' : 'border-hub-border text-hub-muted'}`}>
          {dark ? 'Secure session · JWT · SignalR ready' : 'RecycleHub'}
        </div>
      </aside>
    </>
  );
}
