import React from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Clock, X, CheckCircle, AlertCircle, User } from 'lucide-react';
import { BookingWithDetails } from '../lib/supabase';

interface BookingCardProps {
  booking: BookingWithDetails & { cancelled_at?: string; cancelled_by?: string };
  onCancel?: (bookingId: string) => void;
  cancelling?: boolean;
  showCancelButton?: boolean;
  isAdmin?: boolean;
}

export function BookingCard({ 
  booking, 
  onCancel, 
  cancelling = false, 
  showCancelButton = false,
  isAdmin = false 
}: BookingCardProps) {
  const statusColors = {
    confirmed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };

  const statusIcons = {
    confirmed: CheckCircle,
    cancelled: X,
  };

  const StatusIcon = statusIcons[booking.status];

  const handleCancel = () => {
    if (onCancel && window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      onCancel(booking.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.hotel.name}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{booking.hotel.location}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Room Type</p>
                <p className="font-medium text-gray-900 dark:text-white">{booking.room.type}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check-in</p>
                <p className="font-medium text-gray-900 dark:text-white">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check-out</p>
                <p className="font-medium text-gray-900 dark:text-white">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </div>

          {booking.status === 'cancelled' && booking.cancelled_at && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  Cancelled on {format(new Date(booking.cancelled_at), 'MMM dd, yyyy')} 
                  {booking.cancelled_by === 'admin' ? ' by admin' : ' by you'}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Price</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{booking.total_price.toLocaleString()}</p>
            </div>
            
            {showCancelButton && booking.status === 'confirmed' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Booking'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}