/**
 * Page title row for dashboard screens.
 */
export default function ModernPageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 md:text-xl">{title}</h1>
        {description ? <p className="mt-0.5 text-xs text-gray-500 md:text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
