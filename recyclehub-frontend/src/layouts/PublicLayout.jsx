import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './partials/Navbar';
import CategorySidebar from '../components/landing/CategorySidebar';
import Footer from './partials/Footer';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-screen bg-hub-section flex flex-col">
      <div className="sticky top-0 z-50 isolate">
        <Navbar variant="inline" />
      </div>
      <div
        className={
          isHome ? 'flex flex-1 w-full' : 'flex flex-1 w-full max-w-content mx-auto'
        }
      >
        {!isHome && <CategorySidebar />}
        <main
          className={
            isHome
              ? 'flex-1 min-w-0 w-full bg-white'
              : 'flex-1 min-w-0 px-4 md:px-6 lg:px-8 py-6 bg-hub-section'
          }
        >
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
