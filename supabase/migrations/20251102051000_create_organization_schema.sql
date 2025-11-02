-- Create organization table
CREATE TABLE organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on organization table
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;

-- Create auth-based RLS policies for organization table
CREATE POLICY "Users can view their own organization records" ON organization
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create organization records" ON organization
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization records" ON organization
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organization records" ON organization
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_organization_user_id ON organization(user_id);
CREATE INDEX idx_organization_created_at ON organization(created_at);
