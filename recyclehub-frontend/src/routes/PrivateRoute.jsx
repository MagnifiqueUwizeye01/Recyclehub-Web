import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * @param {object} props
 * @param {boolean} [props.redirectGuestToBuyerRegister] — send guests to /register with Buyer role (buyer-only areas)
 */
export default function PrivateRoute({ children, redirectGuestToBuyerRegister = false }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (redirectGuestToBuyerRegister) {
      return (
        <Navigate
          to="/register"
          replace
          state={{ from: location, preselectedRole: 'Buyer' }}
        />
      );
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
