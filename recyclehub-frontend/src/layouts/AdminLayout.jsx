import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Building2, ShoppingCart, CreditCard, Star, BarChart3, Settings, FileBadge, Flag, MessageSquare, Shield } from 'lucide-react';
import Sidebar from './partials/Sidebar';
import DashboardFooter from './partials/DashboardFooter';
import Navbar from './partials/Navbar';
import { getReportPendingCount } from '../api/reports.api';

const baseNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { path: '/admin/users', label: 'Users', icon: <Users size={16} /> },
  { path: '/admin/sellers', label: 'Sellers', icon: <Building2 size={16} /> },
  { path: '/admin/buyers', label: 'Buyers', icon: <Users size={16} /> },
  { path: '/admin/certificate-requests', label: 'Certificate Requests', icon: <FileBadge size={16} /> },
  { path: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={16} /> },
  { path: '/admin/payments', label: 'Payments', icon: <CreditCard size={16} /> },
  { path: '/admin/reviews', label: 'Reviews', icon: <Star size={16} /> },
  { path: '/messages', label: 'Messages', icon: <MessageSquare size={16} /> },
  { path: '/admin/reports', label: 'Reports', icon: <Flag size={16} /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  { path: '/admin/config', label: 'Settings', icon: <Settings size={16} /> },
  { path: '/settings', label: 'My account', icon: <Shield size={16} /> },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportBadge, setReportBadge] = useState(0);

  useEffect(() => {
    getReportPendingCount()
      .then((res) => {
        const n = res.data?.data ?? res.data ?? 0;
        setReportBadge(typeof n === 'number' ? n : 0);
      })
      .catch(() => {});
  }, []);

  const navItems = baseNavItems.map((item) =>
    item.path === '/admin/reports' ? { ...item, badge: reportBadge } : item,
  );

  return (
    <div className="app-shell">
      <Navbar onSidebarToggle={() => setSidebarOpen(true)} />
      <div className="flex pt-navbar">
        <Sidebar
          variant="app"
          navItems={navItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          className="mt-navbar !z-40"
        />
        <div className="app-shell-main app-shell-main--nav lg:ml-sidebar">
          <main className="page-container flex-1 py-6 md:py-10 animate-fade-in">{children}</main>
          <DashboardFooter />
        </div>
      </div>
    </div>
  );
}
