-- Add 'meeting' to the action_type CHECK constraint
-- Drop the existing CHECK constraint
ALTER TABLE person_action DROP CONSTRAINT person_action_action_type_check;

-- Add new CHECK constraint with the meeting action type
ALTER TABLE person_action
ADD CONSTRAINT person_action_action_type_check CHECK (action_type IN (
  'linkedin_connection_request_sent',
  'linkedin_connection_request_retracted',
  'linkedin_connection_request_accepted',
  'linkedin_message_sent',
  'linkedin_message_received',
  'email_sent',
  'email_received',
  'meeting'
));
