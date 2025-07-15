import React, { useState, useEffect } from 'react';
import { supabase, Profile, BookingWithDetails } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { User, Shield, ShieldCheck, Search, Filter, Calendar, MapPin, Eye, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface UserWithBookings extends Profile {
  bookings?: BookingWithDetails[];
  bookingCount?: number;
  totalSpent?: number;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithBookings | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch users with their booking statistics
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch booking statistics for each user
      const usersWithStats = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*, hotel:hotels(*), room:rooms(*)')
            .eq('user_id', user.id);

          if (bookingsError) {
            console.error('Error fetching bookings for user:', user.id, bookingsError);
            return {
              ...user,
              bookings: [],
              bookingCount: 0,
              totalSpent: 0
            };
          }

          const totalSpent = (bookings || []).reduce((sum, booking) => sum + booking.total_price, 0);

          return {
            ...user,
            bookings: bookings as BookingWithDetails[],
            bookingCount: bookings?.length || 0,
            totalSpent
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));

      toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'} successfully`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Error updating user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const viewUserDetails = async (user: UserWithBookings) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage users and view their booking history</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'user').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Regular Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.reduce((sum, user) => sum + (user.bookingCount || 0), 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Bookings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {user.role === 'admin' ? (
                        <ShieldCheck className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {user.bookingCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ₹{(user.totalSpent || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => updateUserRole(user.id, 'user')}
                        disabled={updatingUserId === user.id}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <User className="h-4 w-4" />
                        <span>{updatingUserId === user.id ? 'Updating...' : 'Remove Admin'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUserRole(user.id, 'admin')}
                        disabled={updatingUserId === user.id}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Shield className="h-4 w-4" />
                        <span>{updatingUserId === user.id ? 'Updating...' : 'Make Admin'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria</p>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-4">
                    <User className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedUser.full_name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Joined {format(new Date(selectedUser.created_at), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.bookingCount || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{(selectedUser.totalSpent || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedUser.bookings?.filter(b => b.status === 'confirmed').length || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Active Bookings</p>
                  </div>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking History</h3>
                {selectedUser.bookings && selectedUser.bookings.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedUser.bookings.map((booking) => (
                      <div key={booking.id} className="border dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{booking.hotel.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {booking.status === 'confirmed' ? (
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                            ) : (
                              <X className="h-3 w-3 inline mr-1" />
                            )}
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <div>
                            <span className="font-medium">Room:</span> {booking.room.type}
                          </div>
                          <div>
                            <span className="font-medium">Check-in:</span> {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                          </div>
                          <div>
                            <span className="font-medium">Check-out:</span> {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                          </div>
                          <div>
                            <span className="font-medium">Total:</span> ₹{booking.total_price}
                          </div>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3 mr-1" />
                          {booking.hotel.location}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No bookings found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}