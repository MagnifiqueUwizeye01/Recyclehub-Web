import { AlertCircle } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry,
  retryLabel = 'Try Again',
}) {
  return (
    <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
        <AlertCircle className="text-emerald-600" size={22} />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
