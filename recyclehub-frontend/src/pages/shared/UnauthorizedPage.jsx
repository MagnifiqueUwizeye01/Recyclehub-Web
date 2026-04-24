import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn, ArrowLeft, Recycle } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-amber-50/20 p-6">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-amber-100/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-100/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        {/* logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
            <Recycle size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">RecycleHub</span>
        </div>

        {/* card */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* amber stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

          <div className="p-8 text-center">
            {/* icon */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <ShieldAlert size={36} className="text-amber-500" strokeWidth={1.5} />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mb-6 text-sm text-gray-500 leading-relaxed">
              You don&apos;t have permission to view this page. Sign in with the correct account or go back home.
            </p>

            {/* tip */}
            <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
              <strong>Tip:</strong> Make sure you&apos;re signed in with the right role (Admin, Seller, or Buyer) to access this section.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-105">
                <LogIn size={16} /> Sign In
              </Link>
              <Link to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-gray-50">
                <Home size={16} /> Go Home
              </Link>
              <button type="button" onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-gray-50">
                <ArrowLeft size={16} /> Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
