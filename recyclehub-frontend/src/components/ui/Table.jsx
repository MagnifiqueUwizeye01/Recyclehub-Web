export default function Table({ columns = [], data = [], loading = false, emptyMessage = 'No data found', onRowClick }) {
  if (loading) {
    return (
      <div className="bg-hub-surface border border-hub-border rounded-xl overflow-hidden">
        <div className="animate-pulse p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-hub-surface2 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const rows = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);

  return (
    <div className="bg-hub-surface border border-hub-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hub-border bg-hub-surface2">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-hub-muted uppercase tracking-wider font-body">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-hub-muted font-body">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (

                <tr
                  key={row.id ?? idx}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-hub-border/50 hover:bg-hub-surface2 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-hub-text font-body">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
