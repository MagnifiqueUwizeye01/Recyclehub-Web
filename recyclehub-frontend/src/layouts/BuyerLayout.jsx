import { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Star,
  MessageSquare,
  Bell,
  User,
  Settings,
} from 'lucide-react';
import Sidebar from './partials/Sidebar';
import DashboardFooter from './partials/DashboardFooter';
import Navbar from './partials/Navbar';

const navItems = [
  { path: '/buyer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { path: '/buyer/marketplace', label: 'Marketplace', icon: <ShoppingBag size={16} /> },
  { path: '/buyer/orders', label: 'My Orders', icon: <Package size={16} /> },
  { path: '/buyer/reviews', label: 'My Reviews', icon: <Star size={16} /> },
  { path: '/messages', label: 'Messages', icon: <MessageSquare size={16} /> },
  { path: '/notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { path: '/profile', label: 'Profile', icon: <User size={16} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={16} /> },
];

export default function BuyerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
