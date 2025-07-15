import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart3, Hotel, Calendar, Bed, Users, LogOut, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminLayout() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const navigationItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/hotels', label: 'Hotels', icon: Hotel },
    { path: '/admin/rooms', label: 'Rooms', icon: Bed },
    { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { path: '/admin/users', label: 'Users', icon: Users },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r dark:border-gray-700">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Hotel Management</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-300 font-semibold">
                {profile?.full_name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1">
          <div className="space-y-1 px-3">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t dark:border-gray-700 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}