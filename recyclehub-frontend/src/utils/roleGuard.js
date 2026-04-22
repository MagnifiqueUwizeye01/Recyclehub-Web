export const canAccess = (userRole, allowedRoles) => {
  if (!userRole || !allowedRoles?.length) return false;
  return allowedRoles.includes(userRole);
};

export const getDashboardPath = (role) => {
  switch (role) {
    case 'Buyer': return '/buyer/dashboard';
    case 'Seller': return '/seller/dashboard';
    case 'Admin': return '/admin/dashboard';
    default: return '/';
  }
};
