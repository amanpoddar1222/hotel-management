import React, { useState, useEffect } from 'react';
import { supabase, BookingWithDetails } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BookingCard } from '../components/BookingCard';
import { Calendar, MapPin, Clock, X, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          hotel:hotels(*),
          room:rooms(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data as BookingWithDetails[] || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'user'
        })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { 
              ...booking, 
              status: 'cancelled' as const,
              cancelled_at: new Date().toISOString(),
              cancelled_by: 'user'
            }
          : booking
      ));

      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Error cancelling booking');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter(booking => 
    statusFilter === 'all' || booking.status === statusFilter
  );

  const upcomingBookings = filteredBookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.check_in) >= new Date()
  );

  const pastBookings = filteredBookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.check_in) < new Date()
  );

  const cancelledBookings = filteredBookings.filter(booking => booking.status === 'cancelled');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your hotel reservations</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingBookings.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pastBookings.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center">
            <X className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cancelledBookings.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Bookings ({upcomingBookings.length})
          </h2>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={cancelBooking}
                cancelling={cancellingId === booking.id}
                showCancelButton={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Past Bookings ({pastBookings.length})
          </h2>
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={cancelBooking}
                cancelling={false}
                showCancelButton={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cancelled Bookings */}
      {cancelledBookings.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Cancelled Bookings ({cancelledBookings.length})
          </h2>
          <div className="space-y-4">
            {cancelledBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={cancelBooking}
                cancelling={false}
                showCancelButton={false}
              />
            ))}
          </div>
        </section>
      )}

      {filteredBookings.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No bookings found</p>
        </div>
      )}
    </div>
  );
}
