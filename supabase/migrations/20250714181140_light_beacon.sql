/*
  # Add automatic profile creation trigger

  1. Function
    - Creates a function that automatically inserts a profile when a new user is created
    - Uses the user's email as a fallback for full_name if not provided
    
  2. Trigger
    - Triggers the function whenever a new user is inserted into auth.users
    - Ensures profile is created after user is fully committed to database
    
  3. Security
    - Function runs with security definer privileges to bypass RLS
    - Only creates profiles for newly inserted users
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();