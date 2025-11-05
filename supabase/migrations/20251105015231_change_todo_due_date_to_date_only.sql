-- Change due_date column from TIMESTAMP WITH TIME ZONE to DATE
-- This prevents timezone conversion issues when storing date-only values

-- Drop the view first before altering the column
DROP VIEW IF EXISTS todos_with_user;

-- Now alter the column type
ALTER TABLE todos
ALTER COLUMN due_date TYPE DATE USING due_date::DATE;

CREATE VIEW todos_with_user AS
SELECT
  t.*,
  u.email as assigned_user_email,
  u.raw_user_meta_data->>'display_name' as assigned_user_display_name
FROM todos t
LEFT JOIN auth.users u ON t.assigned_to = u.id;

-- Grant access to the view
GRANT SELECT ON todos_with_user TO authenticated;

-- Update the column comment
COMMENT ON COLUMN todos.due_date IS 'Date-only due date for the todo (no time component)';
