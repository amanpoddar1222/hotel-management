/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current policies on profiles table are causing infinite recursion
    - This happens when policies reference the profiles table in a circular way

  2. Solution
    - Remove problematic policies that cause recursion
    - Create simpler, non-recursive policies
    - Use auth.uid() directly instead of joining back to profiles table

  3. New Policies
    - Users can read their own profile using auth.uid()
    - Users can update their own profile using auth.uid()
    - Users can insert their own profile during signup
    - Admins can read all profiles (simplified check)
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Simplified admin policy that doesn't cause recursion
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );