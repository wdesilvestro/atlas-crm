-- Create a view that joins todos with user information for assigned_to
CREATE VIEW todos_with_user AS
SELECT
  t.*,
  u.email as assigned_user_email,
  u.raw_user_meta_data->>'display_name' as assigned_user_display_name
FROM todos t
LEFT JOIN auth.users u ON t.assigned_to = u.id;

-- Grant access to the view
GRANT SELECT ON todos_with_user TO authenticated;
