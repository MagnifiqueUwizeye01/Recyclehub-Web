/** Normalize order DTOs from the API (orderId vs id). */
export function normalizeOrderRow(o) {
  if (!o) return o;
  const id = o.orderId ?? o.id;
  return { ...o, id };
}
