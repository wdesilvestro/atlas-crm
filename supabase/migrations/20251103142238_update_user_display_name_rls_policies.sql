-- Update RLS policies to allow all authenticated users to manage display names
-- This allows team members to set friendly names for each other

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can create their own display name" ON user_display_name;
DROP POLICY IF EXISTS "Users can update their own display name" ON user_display_name;
DROP POLICY IF EXISTS "Users can delete their own display name" ON user_display_name;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can create any display name" ON user_display_name
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update any display name" ON user_display_name
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete any display name" ON user_display_name
  FOR DELETE USING (auth.role() = 'authenticated');
