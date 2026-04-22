const parse = (d) => {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (d) => {
  const date = parse(d);
  return date
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    : '—';
};

export const formatDateTime = (d) => {
  const date = parse(d);
  return date
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : '—';
};

export const timeAgo = (d) => {
  const date = parse(d);
  if (!date) return '—';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let duration = Math.round((date.getTime() - Date.now()) / 1000);
  const divisions = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Infinity, unit: 'year' },
  ];
  for (const { amount, unit } of divisions) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return rtf.format(Math.round(duration), 'year');
};

export const formatShort = (d) => {
  const date = parse(d);
  return date ? new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short' }).format(date) : '—';
};
