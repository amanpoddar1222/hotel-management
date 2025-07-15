/*
  # Add booking cancellation tracking fields

  1. New Fields
    - `cancelled_at` (timestamptz) - When the booking was cancelled
    - `cancelled_by` (text) - Who cancelled the booking ('user' or 'admin')

  2. Changes
    - Add new columns to bookings table with proper defaults
    - These fields will be null for non-cancelled bookings
*/

-- Add cancellation tracking fields to bookings table
DO $$
BEGIN
  -- Add cancelled_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at timestamptz;
  END IF;

  -- Add cancelled_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_by'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_by text;
  END IF;
END $$;

-- Add check constraint for cancelled_by values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_cancelled_by_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_cancelled_by_check 
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('user', 'admin'));
  END IF;
END $$;