-- Add status field to person table
ALTER TABLE person
ADD COLUMN status TEXT NOT NULL DEFAULT 'Active'
CHECK (status IN ('Active', 'Inactive'));

-- Add status field to organization table
ALTER TABLE organization
ADD COLUMN status TEXT NOT NULL DEFAULT 'Active'
CHECK (status IN ('Active', 'Inactive'));
