/*
  # Fix profile insert policy for registration

  1. Security Changes
    - Add policy to allow profile creation during signup process
    - Ensure users can create their own profile when registering

  This migration addresses the RLS violation that occurs when new users
  try to register and create their profile entry.
*/

-- Drop the existing insert policy to recreate it with proper conditions
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new policy that allows profile insertion during signup
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also add a policy for anon users during the signup process
-- This is needed because the profile creation happens during the signup flow
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);