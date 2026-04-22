import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-hub-section flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-hub-border rounded-2xl shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-extrabold text-hub-text mb-2">Access denied</h1>
        <p className="text-hub-muted text-sm mb-8">
          You don&apos;t have permission to view this page. Sign in with the correct role or return home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/login" className="btn-primary justify-center">
            Sign in
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-hub-border font-semibold text-hub-text hover:bg-hub-section transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
