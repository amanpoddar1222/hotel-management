import React, { useState, useEffect } from 'react';
import { supabase, BookingWithDetails } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Calendar, MapPin, Clock, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as const }
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

  if (loading) {
    return <LoadingSpinner />;
  }

  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.check_in) >= new Date()
  );

  const pastBookings = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.check_in) < new Date()
  );

  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage your hotel reservations</p>
      </div>

      {/* Upcoming Bookings */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Upcoming Bookings ({upcomingBookings.length})
        </h2>
        {upcomingBookings.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming bookings</p>
          </div>
        ) : (
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
        )}
      </section>

      {/* Past Bookings */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Past Bookings ({pastBookings.length})
        </h2>
        {pastBookings.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No past bookings</p>
          </div>
        ) : (
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
        )}
      </section>

      {/* Cancelled Bookings */}
      {cancelledBookings.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
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
    </div>
  );
}

interface BookingCardProps {
  booking: BookingWithDetails;
  onCancel: (bookingId: string) => void;
  cancelling: boolean;
  showCancelButton: boolean;
}

function BookingCard({ booking, onCancel, cancelling, showCancelButton }: BookingCardProps) {
  const statusColors = {
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    confirmed: CheckCircle,
    cancelled: X,
  };

  const StatusIcon = statusIcons[booking.status];

  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{booking.hotel.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{booking.hotel.location}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Room Type</p>
              <p className="font-medium">{booking.room.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-in</p>
              <p className="font-medium">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-out</p>
              <p className="font-medium">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="text-xl font-bold text-gray-900">${booking.total_price}</p>
            </div>
            
            {showCancelButton && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}