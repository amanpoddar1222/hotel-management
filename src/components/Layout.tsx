import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Hotel, LogOut, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Hotel className="h-8 w-8" />
              <span className="text-xl font-bold">HotelManager</span>
            </Link>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {profile?.full_name}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/bookings"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/bookings'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      My Bookings
                    </Link>
                    
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                          location.pathname.startsWith('/admin')
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}