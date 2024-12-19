import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Clipboard, ShoppingBag, Menu, DollarSign, Database, LogOut, Home, Phone, BellRing, Activity } from 'lucide-react';
import GCashSettings from './GCashSettings';
import AnnouncementSettings from './AnnouncementSettings';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-100 text-sm">
      <aside className="w-56 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <Link to="/admin" className="flex items-center text-xl font-bold text-blue-600">
            <Clipboard className="mr-2" />
            <span className="text-lg">Admin HAVEEKO's</span>
          </Link>
        </div>
        <nav className="mt-4 flex-grow space-y-0.5">
          <NavLink 
            to="/admin/orders" 
            icon={<ShoppingBag />} 
            isActive={isActiveRoute('/admin/orders')}
          >
            Orders
          </NavLink>
          <NavLink 
            to="/admin/monitoring" 
            icon={<Activity />} 
            isActive={isActiveRoute('/admin/monitoring')}
          >
            Order Monitoring
          </NavLink>
          <NavLink 
            to="/admin/menu" 
            icon={<Menu />} 
            isActive={isActiveRoute('/admin/menu')}
          >
            Menu
          </NavLink>
          <NavLink 
            to="/admin/accounting" 
            icon={<DollarSign />} 
            isActive={isActiveRoute('/admin/accounting')}
          >
            Accounting
          </NavLink>
          <NavLink 
            to="/admin/storage" 
            icon={<Database />} 
            isActive={isActiveRoute('/admin/storage')}
          >
            Storage
          </NavLink>
        </nav>
        <div className="p-4 space-y-4 border-t">
          <GCashSettings />
          <AnnouncementSettings />
        </div>
        <div className="p-4 space-y-2 border-t mt-auto">
          <Link
            to="/"
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            <Home className="mr-2" size={18} />
            Order Form
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <LogOut className="mr-2" size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="container mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, children, isActive }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-2 text-gray-700 relative text-sm
      transition-all duration-200
      ${isActive 
        ? 'bg-blue-100 text-blue-700 font-medium border-r-4 border-blue-700' 
        : 'hover:bg-gray-50 hover:text-blue-600'
      }
    `}
  >
    <span className={`${isActive ? 'text-blue-700' : 'text-gray-400'} w-4 h-4`}>
      {icon}
    </span>
    <span className="mx-2">{children}</span>
    {isActive && (
      <div className="absolute inset-y-0 left-0 w-1 bg-blue-700 rounded-r" />
    )}
  </Link>
);

export default AdminLayout;