import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import PublicLayout from '../layouts/PublicLayout';

import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';
import MaterialDetailPublicPage from '../pages/public/MaterialDetailPublicPage';

import BuyerDashboard from '../pages/buyer/BuyerDashboard';
import MarketplacePage from '../pages/buyer/MarketplacePage';
import MaterialDetailPage from '../pages/buyer/MaterialDetailPage';
import OrdersPage from '../pages/buyer/OrdersPage';
import OrderDetailPage from '../pages/buyer/OrderDetailPage';
import PaymentPage from '../pages/buyer/PaymentPage';
import SellerDashboard from '../pages/seller/SellerDashboard';
import InventoryPage from '../pages/seller/InventoryPage';
import AddMaterialPage from '../pages/seller/AddMaterialPage';
import EditMaterialPage from '../pages/seller/EditMaterialPage';
import SellerOrdersPage from '../pages/seller/SellerOrdersPage';
import SellerOrderDetailPage from '../pages/seller/SellerOrderDetailPage';
import SellerAnalyticsPage from '../pages/seller/SellerAnalyticsPage';
import SellerReportsPage from '../pages/seller/SellerReportsPage';

import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagementPage from '../pages/admin/UserManagementPage';
import SellerManagementPage from '../pages/admin/SellerManagementPage';
import BuyerManagementPage from '../pages/admin/BuyerManagementPage';
import OrdersOverviewPage from '../pages/admin/OrdersOverviewPage';
import PaymentsOverviewPage from '../pages/admin/PaymentsOverviewPage';
import ReviewModerationPage from '../pages/admin/ReviewModerationPage';
import PlatformAnalyticsPage from '../pages/admin/PlatformAnalyticsPage';
import AdminConfigPage from '../pages/admin/AdminConfigPage';
import CertificateRequestsPage from '../pages/admin/CertificateRequestsPage';
import ReportsPage from '../pages/admin/ReportsPage';

import SellerProfilePage from '../pages/public/SellerProfilePage';

import ProfilePage from '../pages/shared/ProfilePage';
import SettingsPage from '../pages/shared/SettingsPage';
import ChangePasswordPage from '../pages/shared/ChangePasswordPage';
import MessagesPage from '../pages/shared/MessagesPage';
import NotificationsPage from '../pages/shared/NotificationsPage';
import NotFoundPage from '../pages/shared/NotFoundPage';
import UnauthorizedPage from '../pages/shared/UnauthorizedPage';

function MarketplacePublicRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePublicRedirect />} />
        <Route path="/m/:id" element={<MaterialDetailPublicPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/sellers/:userId" element={<SellerProfilePage />} />

      <Route
        path="/buyer/dashboard"
        element={
          <PrivateRoute redirectGuestToBuyerRegister>
            <RoleRoute allowedRoles={['Buyer']}>
              <BuyerDashboard />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/buyer/marketplace"
        element={
          <PrivateRoute redirectGuestToBuyerRegister>
            <RoleRoute allowedRoles={['Buyer']}>
              <MarketplacePage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/buyer/materials/:id"
        element={
          <PrivateRoute redirectGuestToBuyerRegister>
            <RoleRoute allowedRoles={['Buyer']}>
              <MaterialDetailPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/marketplace/:id"
        element={
          <PrivateRoute redirectGuestToBuyerRegister>
            <RoleRoute allowedRoles={['Buyer']}>
              <MaterialDetailPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/buyer/orders"
        element={
          <PrivateRoute redirectGuestToBuyerRegister>
            <RoleRoute allowedRoles={['Buyer']}>
              <OrdersPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/buyer/orders/:id"
        element={
          <PrivateRoute redirectGuestToBuyerRegister>
            <RoleRoute allowedRoles={['Buyer']}>
              <OrderDetailPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/buyer/payment/:orderId"
        element={
          <PrivateRoute redirectGuestToBuyerRegister>
            <RoleRoute allowedRoles={['Buyer']}>
              <PaymentPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/dashboard"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerDashboard />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/inventory"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <InventoryPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/materials/add"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <AddMaterialPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/materials/:id/edit"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <EditMaterialPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/orders"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerOrdersPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/orders/:id"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerOrderDetailPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/analytics"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerAnalyticsPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/reports"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Seller']}>
              <SellerReportsPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <UserManagementPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/sellers"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <SellerManagementPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/buyers"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <BuyerManagementPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <OrdersOverviewPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <PaymentsOverviewPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <ReviewModerationPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/certificate-requests"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <CertificateRequestsPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <ReportsPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <PlatformAnalyticsPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/config"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['Admin']}>
              <AdminConfigPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <PrivateRoute>
            <ChangePasswordPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/messages/:userId"
        element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
