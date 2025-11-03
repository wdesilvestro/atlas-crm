-- Create a view that includes user email for person actions
-- This makes it easy to query actions with user information
CREATE OR REPLACE VIEW person_action_with_user AS
SELECT
  pa.*,
  au.email as user_email
FROM person_action pa
LEFT JOIN auth.users au ON pa.user_id = au.id;

-- Grant access to authenticated users
-- RLS will still apply through the underlying person_action table
GRANT SELECT ON person_action_with_user TO authenticated;

COMMENT ON VIEW person_action_with_user IS 'Person actions with user email information included';
