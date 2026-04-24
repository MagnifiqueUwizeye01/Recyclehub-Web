import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Recycle, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 p-6">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-100/30 blur-3xl" />

      <div className="relative mx-auto max-w-md text-center">
        {/* logo */}
        <div className="mb-10 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
            <Recycle size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">RecycleHub</span>
        </div>

        {/* 404 visual */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <SearchX size={44} className="text-emerald-400" strokeWidth={1.5} />
            </div>
            <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
              <span className="text-lg font-bold text-emerald-600">4</span>
            </div>
            <div className="absolute -bottom-2 -left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
              <span className="text-lg font-bold text-emerald-600">4</span>
            </div>
          </div>
        </div>

        <div className="mb-2 text-5xl font-extrabold text-gray-200 tracking-tight select-none">404</div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Page Not Found</h1>
        <p className="mb-8 text-sm text-gray-500 leading-relaxed">
          Oops! The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-105">
            <Home size={16} /> Go Home
          </Link>
          <button type="button" onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-gray-50">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
