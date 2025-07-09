import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Hotel } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MapPin, Star, Wifi, Car } from 'lucide-react';

export function Home() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Discover amazing hotels and book your next adventure with ease
          </p>
          
          <div className="bg-white rounded-lg p-2 flex items-center">
            <input
              type="text"
              placeholder="Search hotels by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Hotels
          </h2>
          <span className="text-gray-600">
            {filteredHotels.length} hotel{filteredHotels.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hotels found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Link
      to={`/hotels/${hotel.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
    >
      <div className="aspect-w-16 aspect-h-9">
        <img
          src={hotel.images[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'}
          alt={hotel.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {hotel.name}
          </h3>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{hotel.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{hotel.location}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {hotel.description}
        </p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {hotel.amenities.includes('Free WiFi') && (
            <div className="flex items-center">
              <Wifi className="h-4 w-4 mr-1" />
              <span>WiFi</span>
            </div>
          )}
          {hotel.amenities.includes('Parking') && (
            <div className="flex items-center">
              <Car className="h-4 w-4 mr-1" />
              <span>Parking</span>
            </div>
          )}
          {hotel.amenities.length > 2 && (
            <span>+{hotel.amenities.length - 2} more</span>
          )}
        </div>
      </div>
    </Link>
  );
}