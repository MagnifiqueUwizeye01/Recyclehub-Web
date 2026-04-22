export const getStatusColor = (status) => {
  const map = {
    Pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Verified: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Available: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
    Suspended: 'text-red-400 bg-red-400/10 border-red-400/20',
    Accepted: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Shipped: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Paid: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Delivered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Cancelled: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    Sold: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    Suggested: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Successful: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Failed: 'text-red-400 bg-red-400/10 border-red-400/20',
    Hidden: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    Visible: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    AwaitingPayment: 'text-amber-500 bg-amber-400/10 border-amber-400/25',
  };
  return map[status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
};

export const getOrderStatusStep = (status) => {
  const map = {
    AwaitingPayment: 0,
    Pending: 1,
    Accepted: 2,
    Paid: 3,
    Shipped: 4,
    Delivered: 5,
  };
  return map[status] ?? 0;
};

export const canCancelOrder = (status) => status === 'Pending' || status === 'AwaitingPayment';
export const canReviewOrder = (status) => status === 'Delivered';
export const canPayOrder = (status) => status === 'Accepted' || status === 'AwaitingPayment';
