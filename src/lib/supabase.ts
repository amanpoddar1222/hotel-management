import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Profile {
  id: string;
  full_name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  location: string;
  images: string[];
  amenities: string[];
  rating: number;
  created_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  type: string;
  price: number;
  capacity: number;
  quantity: number;
  description: string;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  hotel_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  hotel?: Hotel;
  room?: Room;
}

export interface BookingWithDetails extends Booking {
  hotel: Hotel;
  room: Room;
  profile?: Profile;
}