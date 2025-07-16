import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Hotel, Room } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MapPin, Star, Wifi, Car, Coffee, Dumbbell, Utensils, Calendar, Users, DollarSign } from 'lucide-react';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

export function HotelDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHotelDetails();
    }
  }, [id]);

  const fetchHotelDetails = async () => {
    try {
      const [hotelResponse, roomsResponse] = await Promise.all([
        supabase.from('hotels').select('*').eq('id', id).single(),
        supabase.from('rooms').select('*').eq('hotel_id', id).order('price', { ascending: true })
      ]);

      if (hotelResponse.error) throw hotelResponse.error;
      if (roomsResponse.error) throw roomsResponse.error;

      setHotel(hotelResponse.data);
      setRooms(roomsResponse.data || []);
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      toast.error('Hotel not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book a room');
      navigate('/login');
      return;
    }

    if (!selectedRoom) {
      toast.error('Please select a room');
      return;
    }

    setBookingLoading(true);

    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = selectedRoom.price * nights;

      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user.id,
            hotel_id: hotel!.id,
            room_id: selectedRoom.id,
            check_in: checkIn,
            check_out: checkOut,
            total_price: totalPrice,
            status: 'confirmed',
          },
        ]);

      if (error) throw error;

      toast.success('Booking confirmed! Check your bookings page for details.');
      navigate('/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Error creating booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hotel) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Hotel not found</p>
      </div>
    );
  }

  const amenityIcons = {
    'Free WiFi': Wifi,
    'Parking': Car,
    'Restaurant': Utensils,
    'Gym': Dumbbell,
    'Coffee': Coffee,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hotel Images */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={hotel.images[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'}
            alt={hotel.name}
            className="w-full h-64 lg:h-96 object-cover rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {hotel.images.slice(1, 5).map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${hotel.name} ${index + 2}`}
              className="w-full h-30 lg:h-44 object-cover rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* Hotel Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="text-lg font-semibold">{hotel.rating}</span>
              </div>
            </div>
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{hotel.location}</span>
            </div>
            <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {hotel.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity as keyof typeof amenityIcons] || Coffee;
                return (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rooms */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Available Rooms</h3>
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRoom?.id === room.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{room.type}</h4>
                      <p className="text-gray-600 text-sm mb-2">{room.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Up to {room.capacity} guests</span>
                        </div>
                        <span>•</span>
                        <span>{room.quantity} available</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-2xl font-bold text-gray-900">
                        <span className="text-2xl mr-1">₹</span>
                        <span>{room.price}</span>
                      </div>
                      <span className="text-sm text-gray-500">per night</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 sticky top-4">
            <h3 className="text-xl font-semibold mb-4">Book Your Stay</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoom && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Room type:</span>
                    <span className="font-medium">{selectedRoom.type}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Price per night:</span>
                    <span className="font-medium">₹{selectedRoom.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                      Total ({Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))} nights):
                    </span>
                    <span className="font-bold text-lg">
                      ₹{(selectedRoom.price * Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!selectedRoom || bookingLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}