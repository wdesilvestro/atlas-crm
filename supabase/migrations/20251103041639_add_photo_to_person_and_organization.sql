-- Add photo column to person table
-- Stores base64-encoded portrait photo
ALTER TABLE person ADD COLUMN photo TEXT;

-- Add photo column to organization table
-- Stores base64-encoded logo/banner photo
ALTER TABLE organization ADD COLUMN photo TEXT;
