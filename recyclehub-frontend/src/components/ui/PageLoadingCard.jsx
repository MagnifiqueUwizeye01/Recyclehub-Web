export default function PageLoadingCard({ message = 'Loading…' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
}
