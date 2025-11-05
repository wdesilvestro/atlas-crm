-- Remove follow-up reminder functionality from person_action table

-- Drop the dependent view first
DROP VIEW IF EXISTS person_action_with_user;

-- Drop the index
DROP INDEX IF EXISTS idx_person_action_follow_up_reminder_date;

-- Remove follow-up reminder columns
ALTER TABLE person_action
DROP COLUMN IF EXISTS follow_up_reminder_days,
DROP COLUMN IF EXISTS follow_up_reminder_date;

-- Recreate the view without the removed columns
CREATE VIEW person_action_with_user AS
SELECT
  pa.*,
  u.email as user_email,
  u.raw_user_meta_data->>'display_name' as user_display_name
FROM person_action pa
LEFT JOIN auth.users u ON pa.user_id = u.id;
