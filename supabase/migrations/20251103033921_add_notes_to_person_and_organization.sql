-- Add notes support for person and organization records
ALTER TABLE person
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE organization
ADD COLUMN IF NOT EXISTS notes TEXT;
