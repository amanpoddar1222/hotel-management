/*
  # Fix profiles table RLS policy for user registration

  1. Changes
    - Drop and recreate the INSERT policy for profiles table to ensure it works correctly during registration
    - The policy allows authenticated users to insert their own profile record

  2. Security
    - Maintains RLS protection while allowing proper user registration flow
    - Users can only insert profiles for their own authenticated user ID
*/

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a working INSERT policy that allows profile creation during registration
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);