-- Add follow-up reminder fields to person_action table
ALTER TABLE person_action
ADD COLUMN follow_up_reminder_days INTEGER,
ADD COLUMN follow_up_reminder_date TIMESTAMP WITH TIME ZONE;

-- Create index for follow-up reminder date for efficient querying
CREATE INDEX idx_person_action_follow_up_reminder_date ON person_action(follow_up_reminder_date)
WHERE follow_up_reminder_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN person_action.follow_up_reminder_days IS 'Number of days to follow up on this action (optional)';
COMMENT ON COLUMN person_action.follow_up_reminder_date IS 'Calculated follow-up reminder date (occurred_at + follow_up_reminder_days)';
