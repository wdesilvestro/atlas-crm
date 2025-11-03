-- Add 'Needs Qualification' status to person table
-- First, drop the existing check constraint on person.status
ALTER TABLE person
DROP CONSTRAINT IF EXISTS person_status_check;

-- Add new check constraint with 'Needs Qualification' option
ALTER TABLE person
ADD CONSTRAINT person_status_check
CHECK (status IN ('Active', 'Inactive', 'Needs Qualification'));

-- Add 'Needs Qualification' status to organization table
-- First, drop the existing check constraint on organization.status
ALTER TABLE organization
DROP CONSTRAINT IF EXISTS organization_status_check;

-- Add new check constraint with 'Needs Qualification' option
ALTER TABLE organization
ADD CONSTRAINT organization_status_check
CHECK (status IN ('Active', 'Inactive', 'Needs Qualification'));
