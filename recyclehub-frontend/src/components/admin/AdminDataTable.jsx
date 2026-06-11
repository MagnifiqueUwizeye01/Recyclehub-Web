/** Table shell with compact header and footer. */
export default function AdminDataTable({ children, footer }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-2 text-[11px] text-gray-500">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AdminTableHead({ columns }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 bg-gray-50/80 text-left">
        {columns.map((col) => (
          <th
            key={col}
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}
