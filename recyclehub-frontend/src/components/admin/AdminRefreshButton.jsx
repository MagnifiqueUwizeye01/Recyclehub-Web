import { RefreshCw } from 'lucide-react';

export default function AdminRefreshButton({ onClick, label = 'Refresh' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      <RefreshCw size={14} className="text-gray-400" />
      {label}
    </button>
  );
}
