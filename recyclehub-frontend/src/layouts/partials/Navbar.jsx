import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Recycle, Search, MessageSquare, Menu, ArrowRight, Loader2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/roleGuard';
import { useMessages } from '../../hooks/useMessages';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import { getMaterials } from '../../api/materials.api';

/**
 * @param {'inline' | 'fixed'} variant — inline: inside PublicLayout sticky stack; fixed: dashboard top bar
 */
export default function Navbar({ onSidebarToggle, variant = 'fixed' }) {
  const { isAuthenticated, user, loading: authLoading, token: authToken, clearSession, refreshSession } = useAuth();
  const sessionPending = authLoading && !!authToken;
  const { unreadMessages } = useMessages();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchWrapRef = useRef(null);
  const mobileSearchWrapRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  const isInline = variant === 'inline';

  useEffect(() => {
    if (isInline) return undefined;
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInline]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    const fromUrl = searchParams.get('search') || '';
    setQ(fromUrl);
    setDebouncedQ(fromUrl.trim());
  }, [location.pathname, searchParams]);

  // Public home: always re-check JWT so the bar matches server (logout elsewhere, expiry, etc.).
  useEffect(() => {
    if (location.pathname !== '/') return;
    refreshSession?.();
  }, [location.pathname, refreshSession]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => clearTimeout(id);
  }, [q]);

  const fetchSuggestions = useCallback(async (term) => {
    if (term.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    try {
      const res = await getMaterials({ search: term, page: 1, pageSize: 8 });
      const list = res?.data?.data ?? [];
      setSuggestions(Array.isArray(list) ? list : []);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!suggestOpen) return;
    if (debouncedQ.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    fetchSuggestions(debouncedQ);
  }, [debouncedQ, suggestOpen, fetchSuggestions]);

  useEffect(() => {
    if (!suggestOpen) return;
    const close = (ev) => {
      const t = ev.target;
      if (searchWrapRef.current?.contains(t) || mobileSearchWrapRef.current?.contains(t)) return;
      setSuggestOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [suggestOpen]);

  const applySearchToHome = (query) => {
    const trimmed = query.trim();
    if (location.pathname === '/') {
      const sp = new URLSearchParams(searchParams);
      if (trimmed) sp.set('search', trimmed);
      else sp.delete('search');
      const s = sp.toString();
      navigate(s ? `/?${s}` : '/');
      return;
    }
    if (!trimmed) {
      navigate('/');
      return;
    }
    navigate(`/?search=${encodeURIComponent(trimmed)}`);
  };

  const onSearch = (e) => {
    e.preventDefault();
    setSuggestOpen(false);
    applySearchToHome(q);
  };

  const pickSuggestion = (m) => {
    setSuggestOpen(false);
    navigate(`/m/${m.id}`);
  };

  const isDashboard =
    location.pathname.includes('/admin') ||
    location.pathname.includes('/buyer') ||
    location.pathname.includes('/seller');

  const isPublicHome = location.pathname === '/';

  /* Inline: same dark green band as AnnouncementBar (emerald-950) */
  const positionClass = isInline
    ? 'relative w-full border-b border-emerald-900/45 bg-emerald-950'
    : `fixed top-0 left-0 right-0 z-50 min-h-navbar transition-[background,box-shadow,border-color] duration-200 ease-out ${
        scrolled || isDashboard
          ? 'bg-white/95 backdrop-blur-xl border-b border-hub-border/80 shadow-nav'
          : 'bg-white/90 backdrop-blur-md border-b border-hub-border/40 shadow-sm'
      }`;

  return (
    <nav className={positionClass}>
      <div
        className={`page-container w-full ${
          isInline ? 'py-2.5 md:py-3' : 'flex min-h-[3.25rem] items-center py-2.5'
        }`}
      >
        <div className="grid w-full grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] items-center gap-3 md:gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 justify-self-start group">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-[1.02] ${
                isInline ? 'bg-white/10 ring-1 ring-white/15' : 'bg-hub-text shadow-sm ring-1 ring-black/5'
              }`}
            >
              <Recycle size={18} className="text-emerald-400" strokeWidth={2.2} />
            </div>
            <div className="hidden sm:block leading-tight">
              <span
                className={`font-bold text-[1.05rem] tracking-tight ${
                  isInline ? 'text-white' : 'text-hub-text'
                }`}
              >
                Recycle
                <span className={isInline ? 'font-semibold text-emerald-200/95' : 'font-semibold text-hub-muted'}>
                  Hub
                </span>
              </span>
              <span
                className={`block text-[10px] font-medium uppercase tracking-[0.18em] ${
                  isInline ? 'text-emerald-300/80' : 'text-hub-muted/90'
                }`}
              >
                B2B marketplace
              </span>
            </div>
          </Link>

          {/* Search — capped width on marketing home so it does not dominate */}
          <div
            className={`hidden md:flex justify-center min-w-0 ${
              isPublicHome ? 'max-w-md lg:max-w-lg xl:max-w-xl justify-self-center w-full' : 'max-w-2xl w-full justify-self-center'
            }`}
          >
            <form onSubmit={onSearch} className="group relative w-full" ref={searchWrapRef}>
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 z-[1] ${
                  isInline
                    ? 'text-emerald-300/70 group-focus-within:text-emerald-200'
                    : 'text-hub-muted group-focus-within:text-hub-accent'
                }`}
                strokeWidth={2}
                aria-hidden
              />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                placeholder="Search materials, SKUs, locations…"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={suggestOpen}
                className={
                  isInline
                    ? 'w-full rounded-lg border border-white/15 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-emerald-200/45 shadow-inner backdrop-blur-sm focus:border-emerald-400/40 focus:bg-white focus:text-hub-text focus:placeholder:text-hub-muted/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/25 transition-[background,border-color,box-shadow,color] duration-150'
                    : 'w-full rounded-lg border border-hub-border bg-hub-surface2 py-2 pl-9 pr-3 text-sm text-hub-text placeholder:text-hub-muted/80 shadow-inner focus:border-hub-accent/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-hub-accent/15 transition-[background,border-color,box-shadow] duration-150'
                }
              />
              {suggestOpen && q.trim().length >= 2 && (
                <div
                  className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-xl border py-1 shadow-lg ${
                    isInline ? 'border-white/20 bg-emerald-950 text-emerald-50' : 'border-hub-border bg-white text-hub-text'
                  }`}
                  role="listbox"
                >
                  {(suggestLoading || debouncedQ.length < 2) && (
                    <div className={`flex items-center gap-2 px-3 py-2 text-xs ${isInline ? 'text-emerald-200/90' : 'text-hub-muted'}`}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      Searching…
                    </div>
                  )}
                  {!suggestLoading &&
                    debouncedQ.length >= 2 &&
                    suggestions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(m)}
                        className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                          isInline ? 'hover:bg-white/10' : 'hover:bg-hub-surface2'
                        }`}
                      >
                        {m.primaryImageUrl ? (
                          <img src={m.primaryImageUrl} alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold ${
                              isInline ? 'bg-white/10 text-emerald-100' : 'bg-hub-surface2 text-hub-muted'
                            }`}
                          >
                            RH
                          </div>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-medium">{m.title || m.name || 'Material'}</span>
                          {m.city && (
                            <span className={`mt-0.5 block text-xs ${isInline ? 'text-emerald-200/75' : 'text-hub-muted'}`}>{m.city}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  {!suggestLoading && debouncedQ.length >= 2 && suggestions.length === 0 && (
                    <div className={`px-3 py-2 text-xs ${isInline ? 'text-emerald-200/80' : 'text-hub-muted'}`}>No materials match.</div>
                  )}
                  <div className={`border-t px-2 py-1 ${isInline ? 'border-white/15' : 'border-hub-border'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSuggestOpen(false);
                        applySearchToHome(q);
                      }}
                      className={`w-full rounded-lg px-2 py-1.5 text-xs font-semibold ${
                        isInline ? 'text-emerald-100 hover:bg-white/10' : 'text-hub-accent hover:bg-hub-surface2'
                      }`}
                    >
                      See all results on home
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Actions — marketing home (/) always looks like the public browse experience */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 justify-self-end">
            {sessionPending ? (
              <div
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium ${
                  isInline ? 'text-emerald-200/90' : 'text-hub-muted'
                }`}
                aria-live="polite"
              >
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                <span className="hidden sm:inline">Checking session…</span>
              </div>
            ) : isPublicHome ? (
              isAuthenticated && user ? (
                <>
                  <Link
                    to={getDashboardPath(user.role)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/20"
                  >
                    <LayoutDashboard size={16} strokeWidth={2} aria-hidden />
                    <span className="hidden sm:inline">Workspace</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => clearSession()}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/95 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline text-sm font-medium px-2 py-1.5 rounded-lg text-emerald-100/95 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition-colors hover:bg-emerald-50"
                  >
                    Create account
                    <ArrowRight size={15} strokeWidth={2.25} className="opacity-90" />
                  </Link>
                </>
              )
            ) : isAuthenticated ? (
              <>
                <div
                  className={`flex items-center gap-0.5 pr-2 sm:pr-3 sm:border-r ${
                    isInline ? 'sm:border-emerald-700/50' : 'sm:border-hub-border'
                  }`}
                >
                  <Link
                    to="/messages"
                    className={`relative rounded-lg p-2 transition-colors ${
                      isInline
                        ? 'text-emerald-200/90 hover:bg-white/10 hover:text-white'
                        : 'text-hub-muted hover:bg-hub-surface2 hover:text-hub-accent'
                    }`}
                    aria-label="Messages"
                  >
                    <MessageSquare size={20} strokeWidth={1.75} />
                    {unreadMessages > 0 && (
                      <span
                        className={`absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded text-[10px] font-semibold text-white flex items-center justify-center ${
                          isInline ? 'bg-emerald-500' : 'bg-hub-text'
                        }`}
                      >
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <NotificationBell variant={isInline ? 'dark' : 'light'} />
                </div>
                <div className="hidden lg:flex flex-col items-end text-right mr-1">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wide ${
                      isInline ? 'text-emerald-400/85' : 'text-hub-muted'
                    }`}
                  >
                    {user?.role || 'User'}
                  </span>
                  <span
                    className={`text-xs font-semibold truncate max-w-[120px] ${
                      isInline ? 'text-white' : 'text-hub-text'
                    }`}
                  >
                    {user?.username || 'Account'}
                  </span>
                </div>
                <UserMenu variant={isInline ? 'dark' : 'light'} />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hidden sm:inline text-sm font-medium px-2 py-1.5 rounded-lg transition-colors ${
                    isInline
                      ? 'text-emerald-100/95 hover:text-white hover:bg-white/10'
                      : 'text-hub-muted hover:text-hub-text hover:bg-hub-section'
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
                    isInline
                      ? 'bg-white text-emerald-950 hover:bg-emerald-50'
                      : 'bg-hub-text text-white hover:bg-emerald-700'
                  }`}
                >
                  Create account
                  <ArrowRight size={15} strokeWidth={2.25} className="opacity-90" />
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => onSidebarToggle?.()}
              className={`md:hidden rounded-lg p-2 transition-colors ${
                isInline ? 'text-emerald-100 hover:bg-white/10' : 'text-hub-text hover:bg-hub-surface2'
              }`}
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={onSearch} className="mt-3 md:hidden relative" ref={mobileSearchWrapRef}>
          <Search
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 z-[1] ${
              isInline ? 'text-emerald-300/70' : 'text-hub-muted'
            }`}
            strokeWidth={2}
          />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            placeholder="Search materials…"
            autoComplete="off"
            className={
              isInline
                ? 'w-full rounded-lg border border-white/15 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-emerald-200/45 focus:border-emerald-400/40 focus:bg-white focus:text-hub-text focus:outline-none focus:ring-2 focus:ring-emerald-400/25 transition-[background] duration-150'
                : 'w-full rounded-lg border border-hub-border bg-hub-surface2 py-2 pl-9 pr-3 text-sm focus:border-hub-accent/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-hub-accent/15 transition-[background] duration-150'
            }
          />
          {suggestOpen && q.trim().length >= 2 && (
            <div
              className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border py-1 shadow-lg ${
                isInline ? 'border-white/20 bg-emerald-950 text-emerald-50' : 'border-hub-border bg-white text-hub-text'
              }`}
            >
              {(suggestLoading || debouncedQ.length < 2) && (
                <div className={`flex items-center gap-2 px-3 py-2 text-xs ${isInline ? 'text-emerald-200/90' : 'text-hub-muted'}`}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  Searching…
                </div>
              )}
              {!suggestLoading &&
                debouncedQ.length >= 2 &&
                suggestions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(m)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm ${isInline ? 'hover:bg-white/10' : 'hover:bg-hub-surface2'}`}
                  >
                    <span className="line-clamp-2 font-medium">{m.title || m.name || 'Material'}</span>
                  </button>
                ))}
              {!suggestLoading && debouncedQ.length >= 2 && suggestions.length === 0 && (
                <div className={`px-3 py-2 text-xs ${isInline ? 'text-emerald-200/80' : 'text-hub-muted'}`}>No materials match.</div>
              )}
            </div>
          )}
        </form>
      </div>
    </nav>
  );
}
