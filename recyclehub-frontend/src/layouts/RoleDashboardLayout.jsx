import { useAuth } from '../hooks/useAuth';
import SellerLayout from './SellerLayout';
import BuyerLayout from './BuyerLayout';
import AdminLayout from './AdminLayout';

/**
 * Wraps children with the same shell as Dashboard / Listings / Messages so
 * Profile, Settings, Notifications, etc. keep the role sidebar (not SharedLayout).
 */
export default function RoleDashboardLayout({ children }) {
  const { user } = useAuth();

  switch (user?.role) {
    case 'Seller':
      return <SellerLayout>{children}</SellerLayout>;
    case 'Buyer':
      return <BuyerLayout>{children}</BuyerLayout>;
    case 'Admin':
      return <AdminLayout>{children}</AdminLayout>;
    default:
      return children;
  }
}
