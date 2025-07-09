import React, { useState, useEffect } from 'react';
import { supabase, BookingWithDetails } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Calendar, MapPin, User, DollarSign, Filter, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AdminBookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // First, fetch bookings with hotel and room data
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          hotel:hotels(*),
          room:rooms(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const bookingsData = data || [];
      
      if (bookingsData.length > 0) {
        // Extract unique user IDs
        const userIds = [...new Set(bookingsData.map(booking => booking.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;
        
        // Create a map of user_id to profile
        const profilesMap = new Map(
          (profilesData || []).map(profile => [profile.id, profile])
        );
        
        // Associate profiles with bookings
        const bookingsWithProfiles = bookingsData.map(booking => ({
          ...booking,
          profile: profilesMap.get(booking.user_id)
        }));
        
        setBookings(bookingsWithProfiles as BookingWithDetails[]);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status }
          : booking
      ));

      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Error updating booking');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSearch = booking.hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel & Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-8 w-8 bg-gray-300 rounded-full p-2 text-gray-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.profile?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.hotel.name}</div>
                    <div className="text-sm text-gray-500">{booking.room.type}</div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {booking.hotel.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {booking.total_price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'confirmed' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {booking.status === 'confirmed' ? (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Confirm
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No bookings found matching your criteria</p>
        </div>
      )}
    </div>
  );
}