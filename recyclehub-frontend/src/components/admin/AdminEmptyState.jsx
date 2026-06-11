export default function AdminEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
      {Icon ? (
        <Icon size={22} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
      ) : null}
      <p className="text-sm font-medium text-gray-800">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
    </div>
  );
}
