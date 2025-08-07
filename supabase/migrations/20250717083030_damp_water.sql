/*
  # Add Agent Name field to motor leads

  1. Changes
    - Add `agent_name` column to `motor_leads` table
    - Set default value to empty string for consistency
    - Make it optional (nullable) to maintain backward compatibility

  2. Notes
    - This field will store the name of the agent handling the lead
    - Existing records will have empty agent_name by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'motor_leads' AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE motor_leads ADD COLUMN agent_name text DEFAULT '';
  END IF;
END $$;