import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, ShoppingCart, ShoppingBag,
  BarChart3, Bell, Settings, LogOut, Menu, X, Brain, ChevronDown, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import InventoryBackground from '../components/InventoryBackground';


const sidebarItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/categories', icon: Tag, label: 'Categories' },
  { path: '/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/inventory', icon: BarChart3, label: 'Inventory' },
  { path: '/sales', icon: ShoppingCart, label: 'Sales' },
  { path: '/purchases', icon: ShoppingBag, label: 'Purchases' },
  { path: '/ai-insights', icon: Brain, label: 'AI Insights', adminOnly: false },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count);
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  const filteredItems = sidebarItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen relative" style={{
      background: '#0c0c1d'
    }}>
      {/* Inventory-themed animated background */}
      <InventoryBackground />

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-50 h-full transition-all duration-500 ease-out ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarOpen ? 'w-64' : 'w-20'}`} style={{
        background: 'rgba(15, 15, 35, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="flex items-center justify-between h-16 px-4" style={{
          borderBottom: '1px solid rgba(99, 102, 241, 0.08)'
        }}>
          {sidebarOpen && (              <span className="text-lg font-bold whitespace-nowrap">
              <span className="text-white">📦 InventoryPro</span>
            </span>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 rounded-xl hover:bg-indigo-50 transition-all duration-200">              <Menu size={20} className="text-gray-400" />
          </button>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                } : {}}
              >
                <div className={`p-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white/20'
                    : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-400'} />
                </div>
                {sidebarOpen && <span>{item.label}</span>}
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6" style={{
          background: 'rgba(15, 15, 35, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 1px 8px rgba(0, 0, 0, 0.2)'
        }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-all">
            <Menu size={20} className="text-gray-400" />
          </button>

          {/* Centered large search bar */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative w-full max-w-[680px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search products, sales, suppliers, reports..."
                className="w-full pl-14 pr-16 py-4 rounded-2xl text-[16px] text-white placeholder-gray-500 transition-all duration-300 focus:outline-none text-center placeholder:text-center"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 16px rgba(0, 0, 0, 0.3)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 bg-white/10 px-2 py-1 rounded-lg font-medium">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-2.5 rounded-xl transition-all hover:bg-white/10">
              <Bell size={20} className="text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm font-bold"
                  style={{ width: '18px', height: '18px', lineHeight: '18px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl transition-all hover:bg-white/10"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                }}>
                  <span className="text-sm font-semibold text-white">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-300">{user?.full_name}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl py-1 z-50 animate-scale-in" style={{
                  background: 'rgba(20, 20, 45, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
