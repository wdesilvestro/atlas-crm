-- Add relationship_owner_id to person table
ALTER TABLE person
ADD COLUMN relationship_owner_id UUID REFERENCES relationship_owner(id) ON DELETE SET NULL;

-- Create index for person.relationship_owner_id
CREATE INDEX idx_person_relationship_owner_id ON person(relationship_owner_id);

-- Add relationship_owner_id to organization table
ALTER TABLE organization
ADD COLUMN relationship_owner_id UUID REFERENCES relationship_owner(id) ON DELETE SET NULL;

-- Create index for organization.relationship_owner_id
CREATE INDEX idx_organization_relationship_owner_id ON organization(relationship_owner_id);
