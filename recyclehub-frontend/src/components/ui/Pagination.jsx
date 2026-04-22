import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-hub-surface2 text-hub-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      {start > 1 && (
        <>
          <PageBtn n={1} active={page === 1} onClick={() => onPageChange(1)} />
          {start > 2 && <span className="text-hub-muted px-1">...</span>}
        </>
      )}
      {pages.map((n) => <PageBtn key={n} n={n} active={page === n} onClick={() => onPageChange(n)} />)}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-hub-muted px-1">...</span>}
          <PageBtn n={totalPages} active={page === totalPages} onClick={() => onPageChange(totalPages)} />
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg hover:bg-hub-surface2 text-hub-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function PageBtn({ n, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-hub-accent text-white' : 'hover:bg-hub-surface2 text-hub-muted'}`}
    >
      {n}
    </button>
  );
}
