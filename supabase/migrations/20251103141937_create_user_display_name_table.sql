-- Create user_display_name table to store custom display names for users
CREATE TABLE IF NOT EXISTS user_display_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_user_display_name_user_id ON user_display_name(user_id);

-- Enable Row Level Security
ALTER TABLE user_display_name ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - all authenticated users can view all display names
CREATE POLICY "All authenticated users can view display names" ON user_display_name
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only insert their own display name
CREATE POLICY "Users can create their own display name" ON user_display_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own display name
CREATE POLICY "Users can update their own display name" ON user_display_name
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own display name
CREATE POLICY "Users can delete their own display name" ON user_display_name
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_display_name_updated_at
  BEFORE UPDATE ON user_display_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_display_name IS 'Stores custom display names for authenticated users';
