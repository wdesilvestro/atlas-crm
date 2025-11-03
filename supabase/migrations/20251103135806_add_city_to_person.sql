-- Add missing city column to person table
ALTER TABLE person
  ADD COLUMN IF NOT EXISTS city TEXT;

-- Add comment explaining the city field
COMMENT ON COLUMN person.city IS 'City from Google Places API';
