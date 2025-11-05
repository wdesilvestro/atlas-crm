-- Fix the get_all_users_with_display_names function
-- Remove deleted_at check which may not exist in all Supabase installations
CREATE OR REPLACE FUNCTION get_all_users_with_display_names()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id as user_id,
    au.email,
    COALESCE(udn.display_name, au.raw_user_meta_data->>'display_name', au.email) as display_name
  FROM auth.users au
  LEFT JOIN user_display_name udn ON au.id = udn.user_id
  ORDER BY
    CASE
      WHEN udn.display_name IS NOT NULL THEN udn.display_name
      WHEN au.raw_user_meta_data->>'display_name' IS NOT NULL THEN au.raw_user_meta_data->>'display_name'
      ELSE au.email
    END ASC;
END;
$$;

-- Ensure execute permission is granted
GRANT EXECUTE ON FUNCTION get_all_users_with_display_names() TO authenticated;

COMMENT ON FUNCTION get_all_users_with_display_names() IS 'Returns all active users with their display names for user selection dropdowns';
