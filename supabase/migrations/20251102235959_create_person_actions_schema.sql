-- Create person_action table for logging actions related to persons
CREATE TABLE person_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'linkedin_connection_request_sent',
    'linkedin_connection_request_retracted',
    'linkedin_message_sent',
    'email_sent',
    'email_received'
  )),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  additional_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_person_action_person_id ON person_action(person_id);
CREATE INDEX idx_person_action_user_id ON person_action(user_id);
CREATE INDEX idx_person_action_occurred_at ON person_action(occurred_at DESC);

-- Enable RLS
ALTER TABLE person_action ENABLE ROW LEVEL SECURITY;

-- person_action RLS Policies
-- Users can view actions for persons they own
CREATE POLICY "Users can view actions for their persons" ON person_action
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_action.person_id AND p.user_id = auth.uid()
    )
  );

-- Users can create actions for their persons
CREATE POLICY "Users can create actions for their persons" ON person_action
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_action.person_id AND p.user_id = auth.uid()
    )
  );

-- Users can update actions for their persons
CREATE POLICY "Users can update actions for their persons" ON person_action
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_action.person_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_action.person_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete actions for their persons
CREATE POLICY "Users can delete actions for their persons" ON person_action
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM person p
      WHERE p.id = person_action.person_id AND p.user_id = auth.uid()
    )
  );
