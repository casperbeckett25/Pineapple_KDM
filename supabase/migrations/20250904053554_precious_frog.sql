/*
  # Add excess field to quick quotes table

  1. Changes
    - Add `excess` column to `quick_quotes` table to store excess amount
    - Set as numeric type to match premium field
    - Make it optional (nullable) for backward compatibility

  2. Notes
    - This field will store the excess amount from the quote response
    - Existing records will have null excess by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_quotes' AND column_name = 'excess'
  ) THEN
    ALTER TABLE quick_quotes ADD COLUMN excess numeric;
  END IF;
END $$;