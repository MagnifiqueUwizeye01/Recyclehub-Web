export const formatRWF = (amount) => {
  if (amount === null || amount === undefined) return 'RWF 0';
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (n) =>
  new Intl.NumberFormat('en-US').format(n || 0);
