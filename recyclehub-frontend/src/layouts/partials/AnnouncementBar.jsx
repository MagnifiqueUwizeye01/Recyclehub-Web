import { BadgeCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Slim trust strip — auth lives in Navbar.
 */
export default function AnnouncementBar() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="border-b border-emerald-900/40 bg-emerald-950">
      <div className="page-container flex min-h-[2.25rem] items-center py-1.5">
        <p className="flex items-center gap-2 text-[11px] sm:text-xs leading-snug text-emerald-100/90">
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.25} aria-hidden />
          <span className="text-left">
            <span className="text-emerald-200/95">Verified B2B</span>
            <span className="mx-1.5 text-emerald-700/80" aria-hidden>
              ·
            </span>
            <span>RWF via MoMo</span>
          </span>
        </p>
      </div>
    </div>
  );
}
