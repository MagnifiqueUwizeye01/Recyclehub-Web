import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Recycle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-hub-accent/5 rounded-full blur-3xl" />
      <div className="relative text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-hub-accent flex items-center justify-center">
            <Recycle size={22} className="text-white" />
          </div>
          <span className="font-display font-bold text-hub-text text-2xl">RecycleHub</span>
        </div>
        <div className="text-8xl font-mono font-extrabold text-hub-accent/20 mb-4">404</div>
        <h1 className="text-3xl font-display font-bold text-hub-text mb-3">Page Not Found</h1>
        <p className="text-hub-muted font-body mb-8 max-w-sm mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-hub-accent text-white rounded-xl font-body text-sm hover:bg-hub-accentHover transition-colors">
            <Home size={16} /> Go Home
          </Link>
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-hub-surface border border-hub-border text-hub-text rounded-xl font-body text-sm hover:bg-hub-surface2 transition-colors">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
