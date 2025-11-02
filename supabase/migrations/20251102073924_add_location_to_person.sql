-- Add location fields to person table (only add columns that don't already exist)
ALTER TABLE person
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add comment explaining the location fields
COMMENT ON COLUMN person.street_address IS 'Street address from Google Places API';
COMMENT ON COLUMN person.state_province IS 'State or province from Google Places API';
COMMENT ON COLUMN person.postal_code IS 'Postal code from Google Places API';
COMMENT ON COLUMN person.country IS 'Country from Google Places API';
COMMENT ON COLUMN person.formatted_address IS 'Full formatted address from Google Places API';
COMMENT ON COLUMN person.place_id IS 'Google Places ID for reference and reverse lookup';
