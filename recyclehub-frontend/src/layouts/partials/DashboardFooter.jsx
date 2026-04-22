import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';

export default function DashboardFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-hub-border/80 bg-white/80 backdrop-blur-md shadow-shell">
      <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-hub-muted">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-hub-accent/15 flex items-center justify-center border border-hub-accent/20">
            <Recycle size={14} className="text-hub-accent" />
          </div>
          <span>
            © {year} <span className="text-hub-text font-medium">RecycleHub</span>
            <span className="hidden sm:inline"> — B2B recyclable materials marketplace</span>
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/" className="hover:text-hub-accent transition-colors">Home</Link>
          <Link to="/" className="hover:text-hub-accent transition-colors">Browse listings</Link>
          <a href="mailto:support@recyclehub.com" className="hover:text-hub-accent transition-colors">Support</a>
          <span className="text-hub-border hidden sm:inline">|</span>
          <span className="text-hub-light font-mono">API connected</span>
        </nav>
      </div>
    </footer>
  );
}
