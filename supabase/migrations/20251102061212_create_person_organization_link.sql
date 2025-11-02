-- Create person_organization junction table for many-to-many relationship
CREATE TABLE person_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- Required field for person's title/role in the organization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person_id, organization_id)
);

-- Enable RLS on person_organization table
ALTER TABLE person_organization ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can manage links for their organizations
CREATE POLICY "Users can view person_organization links for their organizations" ON person_organization
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM organization WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create person_organization links for their organizations" ON person_organization
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM organization WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update person_organization links for their organizations" ON person_organization
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM organization WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete person_organization links for their organizations" ON person_organization
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM organization WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_person_organization_person_id ON person_organization(person_id);
CREATE INDEX idx_person_organization_organization_id ON person_organization(organization_id);
CREATE INDEX idx_person_organization_created_at ON person_organization(created_at);
