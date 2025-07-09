/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current policies on profiles table cause infinite recursion
    - Policies are trying to query profiles table from within the policy itself
    - This creates circular dependency when checking permissions

  2. Solution
    - Drop existing problematic policies
    - Create simpler policies that don't reference profiles table recursively
    - Use auth.uid() directly for user-specific access
    - Create separate admin policies that don't cause recursion

  3. New Policies
    - Users can read/update their own profile using auth.uid()
    - Allow profile creation during signup (anon users)
    - Admin access will be handled at application level initially
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new non-recursive policies
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

-- For admin access, we'll handle this at the application level initially
-- This avoids the recursive policy issue while maintaining security
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);