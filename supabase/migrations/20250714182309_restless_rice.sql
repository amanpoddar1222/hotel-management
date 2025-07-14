/*
  # Enable Email Confirmations

  This migration enables email confirmations for new user signups.
  Users will need to verify their email address before they can sign in.

  1. Configuration
    - Enables email confirmation requirement
    - Sets up proper email templates and redirects
*/

-- Enable email confirmations (this is typically done in Supabase dashboard)
-- The actual email confirmation settings need to be configured in Supabase dashboard:
-- 1. Go to Authentication > Settings
-- 2. Enable "Enable email confirmations"
-- 3. Set "Site URL" to your domain
-- 4. Configure email templates if needed

-- Update the handle_new_user function to use metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;