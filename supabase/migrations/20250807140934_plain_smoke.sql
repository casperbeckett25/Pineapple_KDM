/*
  # Create quick quotes table

  1. New Tables
    - `quick_quotes`
      - `id` (uuid, primary key)
      - `source` (text)
      - `external_reference_id` (text)
      - `vehicle_data` (jsonb, stores vehicle information)
      - `request_data` (jsonb, stores the full request payload)
      - `api_response` (jsonb, stores the API response)
      - `quote_id` (text, extracted from API response)
      - `premium` (numeric, extracted from API response)
      - `status` (text, success/error/pending)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `quick_quotes` table
    - Add policy for public access (anon users can insert and read)
*/

CREATE TABLE IF NOT EXISTS quick_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'KodomBranchOne',
  external_reference_id text DEFAULT '',
  vehicle_data jsonb DEFAULT '{}',
  request_data jsonb DEFAULT '{}',
  api_response jsonb,
  quote_id text,
  premium numeric,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quick_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on quick_quotes"
  ON quick_quotes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read on quick_quotes"
  ON quick_quotes
  FOR SELECT
  TO anon
  USING (true);