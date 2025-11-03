-- Update the person_action_with_user view to include display_name
-- Drop the old view first
DROP VIEW IF EXISTS person_action_with_user;

-- Recreate the view with display_name included
CREATE OR REPLACE VIEW person_action_with_user AS
SELECT
  pa.*,
  au.email as user_email,
  udn.display_name as user_display_name
FROM person_action pa
LEFT JOIN auth.users au ON pa.user_id = au.id
LEFT JOIN user_display_name udn ON pa.user_id = udn.user_id;

-- Grant access to authenticated users
-- RLS will still apply through the underlying person_action table
GRANT SELECT ON person_action_with_user TO authenticated;

COMMENT ON VIEW person_action_with_user IS 'Person actions with user email and display name information included';
