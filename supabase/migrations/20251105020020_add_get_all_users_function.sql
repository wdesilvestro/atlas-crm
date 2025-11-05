-- Create function to get all users with their display names
-- This is needed because auth.users is not directly accessible via PostgREST
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
    COALESCE(udn.display_name, au.raw_user_meta_data->>'display_name') as display_name
  FROM auth.users au
  LEFT JOIN user_display_name udn ON au.id = udn.user_id
  WHERE au.deleted_at IS NULL
  ORDER BY display_name ASC NULLS LAST, au.email ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_with_display_names() TO authenticated;

COMMENT ON FUNCTION get_all_users_with_display_names() IS 'Returns all active users with their display names for user selection dropdowns';
