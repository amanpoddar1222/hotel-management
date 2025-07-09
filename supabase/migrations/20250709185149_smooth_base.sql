/*
  # Hotel Management System Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (text, default 'user')
      - `created_at` (timestamp)
    - `hotels`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `location` (text)
      - `images` (text array)
      - `amenities` (text array)
      - `rating` (decimal)
      - `created_at` (timestamp)
    - `rooms`
      - `id` (uuid, primary key)
      - `hotel_id` (uuid, foreign key to hotels)
      - `type` (text)
      - `price` (decimal)
      - `capacity` (integer)
      - `quantity` (integer)
      - `description` (text)
      - `created_at` (timestamp)
    - `bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `hotel_id` (uuid, foreign key to hotels)
      - `room_id` (uuid, foreign key to rooms)
      - `check_in` (date)
      - `check_out` (date)
      - `total_price` (decimal)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Add policies for admin access control

  3. Sample Data
    - Insert sample hotels with images and amenities
    - Insert sample rooms for each hotel
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  rating decimal(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  capacity integer NOT NULL CHECK (capacity > 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  total_price decimal(10,2) NOT NULL CHECK (total_price > 0),
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT check_dates CHECK (check_out > check_in)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Hotels policies
CREATE POLICY "Anyone can read hotels"
  ON hotels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage hotels"
  ON hotels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Rooms policies
CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage rooms"
  ON rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Bookings policies
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert sample hotels
INSERT INTO hotels (id, name, description, location, images, amenities, rating) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Grand Plaza Hotel',
    'Luxury 5-star hotel in the heart of the city with exceptional service and amenities. Experience world-class hospitality with stunning city views, premium dining options, and state-of-the-art facilities.',
    'New York, NY',
    ARRAY['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg', 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg', 'https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg', 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'],
    ARRAY['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Room Service', 'Concierge', 'Valet Parking', 'Business Center'],
    4.8
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Ocean View Resort',
    'Beachfront resort with stunning ocean views and world-class amenities. Relax on pristine beaches, enjoy water sports, and indulge in spa treatments while listening to the sound of waves.',
    'Miami, FL',
    ARRAY['https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg', 'https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg', 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg', 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'],
    ARRAY['Beach Access', 'Spa', 'Pool', 'Restaurant', 'Bar', 'Water Sports', 'Free WiFi', 'Fitness Center'],
    4.7
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Mountain Lodge',
    'Cozy mountain retreat perfect for nature lovers and adventure seekers. Surrounded by breathtaking mountain views, hiking trails, and fresh alpine air for the ultimate escape.',
    'Aspen, CO',
    ARRAY['https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg', 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg', 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg', 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'],
    ARRAY['Mountain Views', 'Fireplace', 'Hiking Trails', 'Restaurant', 'Free WiFi', 'Ski Storage', 'Hot Tub'],
    4.6
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Downtown Business Hotel',
    'Modern business hotel in the financial district with state-of-the-art conference facilities and premium business services. Perfect for corporate travelers and business meetings.',
    'Chicago, IL',
    ARRAY['https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg', 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg', 'https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg', 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'],
    ARRAY['Business Center', 'Conference Rooms', 'Free WiFi', 'Gym', 'Restaurant', 'Concierge', 'Airport Shuttle'],
    4.5
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    'Boutique Garden Hotel',
    'Charming boutique hotel with beautiful gardens and personalized service. Each room is uniquely designed with local art and premium amenities for a memorable stay.',
    'San Francisco, CA',
    ARRAY['https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg', 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg', 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg', 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'],
    ARRAY['Garden Views', 'Free WiFi', 'Restaurant', 'Bar', 'Concierge', 'Pet Friendly', 'Bicycle Rental'],
    4.4
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample rooms
INSERT INTO rooms (hotel_id, type, price, capacity, quantity, description) VALUES
  -- Grand Plaza Hotel rooms
  ('550e8400-e29b-41d4-a716-446655440001', 'Standard Room', 199.99, 2, 20, 'Comfortable room with city views and modern amenities'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Deluxe Suite', 399.99, 4, 10, 'Spacious suite with premium amenities and separate living area'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Executive Suite', 699.99, 6, 5, 'Luxury suite with panoramic city views and executive lounge access'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Presidential Suite', 1299.99, 8, 2, 'Ultimate luxury with private terrace and butler service'),
  
  -- Ocean View Resort rooms
  ('550e8400-e29b-41d4-a716-446655440002', 'Ocean View Room', 299.99, 2, 15, 'Room with direct ocean views and private balcony'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Beach Villa', 599.99, 4, 8, 'Private villa steps from the beach with outdoor shower'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Oceanfront Suite', 899.99, 6, 4, 'Luxury suite with panoramic ocean views and private beach access'),
  
  -- Mountain Lodge rooms
  ('550e8400-e29b-41d4-a716-446655440003', 'Mountain Cabin', 179.99, 3, 12, 'Rustic cabin with mountain views and cozy fireplace'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Lodge Suite', 299.99, 4, 6, 'Spacious suite with fireplace and mountain panorama'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Alpine Chalet', 449.99, 6, 3, 'Luxury chalet with hot tub and ski-in/ski-out access'),
  
  -- Downtown Business Hotel rooms
  ('550e8400-e29b-41d4-a716-446655440004', 'Business Room', 159.99, 2, 25, 'Modern room with work desk and high-speed internet'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Executive Room', 249.99, 2, 15, 'Premium room with executive lounge access'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Business Suite', 399.99, 4, 8, 'Suite with separate meeting area and conference call facilities'),
  
  -- Boutique Garden Hotel rooms
  ('550e8400-e29b-41d4-a716-446655440005', 'Garden Room', 189.99, 2, 18, 'Charming room overlooking the hotel gardens'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Boutique Suite', 329.99, 3, 10, 'Uniquely designed suite with local art and garden views'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Penthouse Suite', 599.99, 4, 2, 'Top floor suite with private terrace and city skyline views')
ON CONFLICT DO NOTHING;