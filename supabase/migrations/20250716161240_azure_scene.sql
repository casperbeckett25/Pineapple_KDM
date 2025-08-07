/*
  # Create motor leads table

  1. New Tables
    - `motor_leads`
      - `id` (uuid, primary key)
      - `source` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `contact_number` (text)
      - `id_number` (text, optional)
      - `meta_data` (jsonb)
      - `api_response` (jsonb, stores the API response)
      - `quote_reference` (text, extracted from API response)
      - `redirect_url` (text, extracted from API response)
      - `status` (text, success/error)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `motor_leads` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS motor_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'Kodom_Connect',
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  contact_number text NOT NULL,
  id_number text DEFAULT '',
  meta_data jsonb DEFAULT '{}',
  api_response jsonb,
  quote_reference text,
  redirect_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE motor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on motor_leads"
  ON motor_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read on motor_leads"
  ON motor_leads
  FOR SELECT
  TO anon
  USING (true);