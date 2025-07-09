/*
  # Fix profiles table INSERT policy for user registration

  1. Changes
    - Drop the existing restrictive INSERT policy for profiles
    - Create a new INSERT policy that allows authenticated users to insert their own profile
    - Ensure the policy works correctly during the registration process

  2. Security
    - Maintains security by ensuring users can only insert profiles with their own auth.uid()
    - Allows the registration process to complete successfully
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that properly handles registration
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the policy allows profile creation during registration
-- by also allowing inserts where the user is authenticated and the ID matches
CREATE POLICY "Allow profile creation during registration"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND 
    NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
    )
  );

-- Drop the duplicate policy since we only need one
DROP POLICY IF EXISTS "Allow profile creation during registration" ON profiles;

-- Create the final working policy
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);