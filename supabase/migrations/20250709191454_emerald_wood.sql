/*
  # Add admin user management policies

  1. Security
    - Add policy for admins to update user roles
    - Ensure only admins can modify other users' profiles
*/

-- Allow admins to update other users' profiles (specifically for role changes)
CREATE POLICY "Admins can update user roles"
  ON profiles
  FOR UPDATE
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