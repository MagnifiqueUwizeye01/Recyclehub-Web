import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-hub-border py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-hub-accent flex items-center justify-center">
                <Recycle size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-hub-text text-lg">RecycleHub</span>
            </div>
            <p className="text-sm text-hub-muted">B2B marketplace for verified recyclable industrial materials.</p>
          </div>
          <div>
            <h4 className="font-semibold text-hub-text text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-hub-muted">
              <li><Link to="/" className="hover:text-hub-accent transition-colors">Browse listings</Link></li>
              <li><Link to="/register" className="hover:text-hub-accent transition-colors">Sell Materials</Link></li>
              <li><Link to="/login" className="hover:text-hub-accent transition-colors">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-hub-text text-sm mb-3">Materials</h4>
            <ul className="space-y-2 text-sm text-hub-muted">
              {['Metal', 'Electronics', 'Plastic', 'Textile'].map((t) => (
                <li key={t}><Link to={`/?type=${encodeURIComponent(t)}`} className="hover:text-hub-accent transition-colors">{t}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-hub-text text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-hub-muted">
              <li><a href="#" className="hover:text-hub-accent transition-colors">About</a></li>
              <li><a href="#" className="hover:text-hub-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-hub-accent transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-hub-border text-center text-xs text-hub-muted">
          © {new Date().getFullYear()} RecycleHub. All rights reserved. Built for the circular economy.
        </div>
      </div>
    </footer>
  );
}
