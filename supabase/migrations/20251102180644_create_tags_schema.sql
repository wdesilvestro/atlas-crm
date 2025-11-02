-- Create tags table
CREATE TABLE tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('person', 'organization')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, object_type, user_id)
);

-- Create person_tag junction table
CREATE TABLE person_tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(person_id, tag_id)
);

-- Create organization_tag junction table
CREATE TABLE organization_tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_tag_user_id_object_type ON tag(user_id, object_type);
CREATE INDEX idx_person_tag_person_id ON person_tag(person_id);
CREATE INDEX idx_person_tag_tag_id ON person_tag(tag_id);
CREATE INDEX idx_organization_tag_organization_id ON organization_tag(organization_id);
CREATE INDEX idx_organization_tag_tag_id ON organization_tag(tag_id);

-- Enable RLS
ALTER TABLE tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_tag ENABLE ROW LEVEL SECURITY;

-- Tag RLS Policies
-- Users can view tags they created
CREATE POLICY "Users can view their own tags" ON tag
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tags
CREATE POLICY "Users can create tags" ON tag
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tags
CREATE POLICY "Users can update their own tags" ON tag
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete their own tags" ON tag
  FOR DELETE USING (auth.uid() = user_id);

-- person_tag RLS Policies
-- Users can view tags for persons they can access
CREATE POLICY "Users can view person tags for their persons" ON person_tag
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_tag.person_id AND p.user_id = auth.uid()
    )
  );

-- Users can add tags to their persons
CREATE POLICY "Users can add tags to their persons" ON person_tag
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_tag.person_id AND p.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM tag t
      WHERE t.id = person_tag.tag_id AND t.user_id = auth.uid()
    )
  );

-- Users can remove tags from their persons
CREATE POLICY "Users can remove tags from their persons" ON person_tag
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_tag.person_id AND p.user_id = auth.uid()
    )
  );

-- organization_tag RLS Policies
-- Users can view tags for organizations they own
CREATE POLICY "Users can view organization tags for their organizations" ON organization_tag
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization o
      WHERE o.id = organization_tag.organization_id AND o.user_id = auth.uid()
    )
  );

-- Users can add tags to their organizations
CREATE POLICY "Users can add tags to their organizations" ON organization_tag
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization o
      WHERE o.id = organization_tag.organization_id AND o.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM tag t
      WHERE t.id = organization_tag.tag_id AND t.user_id = auth.uid()
    )
  );

-- Users can remove tags from their organizations
CREATE POLICY "Users can remove tags from their organizations" ON organization_tag
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization o
      WHERE o.id = organization_tag.organization_id AND o.user_id = auth.uid()
    )
  );
