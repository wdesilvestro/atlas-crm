-- Remove follow-up reminder functionality from person_action table

-- Drop the index first
DROP INDEX IF EXISTS idx_person_action_follow_up_reminder_date;

-- Remove follow-up reminder columns
ALTER TABLE person_action
DROP COLUMN IF EXISTS follow_up_reminder_days,
DROP COLUMN IF EXISTS follow_up_reminder_date;
