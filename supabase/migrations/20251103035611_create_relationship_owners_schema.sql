-- Create relationship_owners table
CREATE TABLE IF NOT EXISTS relationship_owner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_relationship_owner_user_id ON relationship_owner(user_id);

-- Enable Row Level Security
ALTER TABLE relationship_owner ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own relationship owners" ON relationship_owner
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relationship owners" ON relationship_owner
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationship owners" ON relationship_owner
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationship owners" ON relationship_owner
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relationship_owner_updated_at
  BEFORE UPDATE ON relationship_owner
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
