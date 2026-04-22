/**
 * Unpack ASP.NET PagedResult<T> from axios: { items, totalCount, totalPages, ... }
 */
export function getPagedItems(res) {
  const body = res?.data;
  if (!body) return { items: [], totalCount: 0, totalPages: 1 };
  const raw = body.items ?? body.data;
  const items = Array.isArray(raw) ? raw : [];
  return {
    items,
    totalCount: body.totalCount ?? items.length,
    totalPages: body.totalPages ?? 1,
  };
}
