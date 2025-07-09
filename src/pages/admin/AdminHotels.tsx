import React, { useState, useEffect } from 'react';
import { supabase, Hotel } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    images: '',
    amenities: '',
    rating: 0,
  });

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
      toast.error('Error loading hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hotelData = {
      name: formData.name,
      description: formData.description,
      location: formData.location,
      images: formData.images.split(',').map(url => url.trim()).filter(url => url),
      amenities: formData.amenities.split(',').map(amenity => amenity.trim()).filter(amenity => amenity),
      rating: formData.rating,
    };

    try {
      if (editingHotel) {
        const { error } = await supabase
          .from('hotels')
          .update(hotelData)
          .eq('id', editingHotel.id);

        if (error) throw error;
        toast.success('Hotel updated successfully');
      } else {
        const { error } = await supabase
          .from('hotels')
          .insert([hotelData]);

        if (error) throw error;
        toast.success('Hotel created successfully');
      }

      setShowModal(false);
      setEditingHotel(null);
      setFormData({ name: '', description: '', location: '', images: '', amenities: '', rating: 0 });
      fetchHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
      toast.error('Error saving hotel');
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      description: hotel.description,
      location: hotel.location,
      images: hotel.images.join(', '),
      amenities: hotel.amenities.join(', '),
      rating: hotel.rating,
    });
    setShowModal(true);
  };

  const handleDelete = async (hotelId: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;

    try {
      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', hotelId);

      if (error) throw error;
      toast.success('Hotel deleted successfully');
      fetchHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
      toast.error('Error deleting hotel');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manage Hotels</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Hotel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <div key={hotel.id} className="bg-white rounded-lg border overflow-hidden">
            <img
              src={hotel.images[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'}
              alt={hotel.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{hotel.name}</h3>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm">{hotel.rating}</span>
                </div>
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{hotel.location}</span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hotel.description}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(hotel)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(hotel.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hotel Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images (comma-separated URLs)
                  </label>
                  <input
                    type="text"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amenities (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="Free WiFi, Pool, Gym, Restaurant"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingHotel(null);
                      setFormData({ name: '', description: '', location: '', images: '', amenities: '', rating: 0 });
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingHotel ? 'Update Hotel' : 'Create Hotel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}