-- Create todos table for person and organization to-do tracking
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL CHECK (object_type IN ('person', 'organization')),
  object_id UUID NOT NULL,
  title TEXT NOT NULL,
  description JSONB, -- Rich text content stored as JSON
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_object_type_id ON todos(object_type, object_id);
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX idx_todos_due_date ON todos(due_date) WHERE completed = false;
CREATE INDEX idx_todos_completed ON todos(completed);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_todos_updated_at();

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view todos they created or are assigned to
CREATE POLICY "Users can view their own todos or assigned todos" ON todos
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- RLS Policy: Users can create todos for their own records
CREATE POLICY "Users can create todos for their own records" ON todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update todos they created or are assigned to
CREATE POLICY "Users can update their own todos or assigned todos" ON todos
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

-- RLS Policy: Users can delete todos they created
CREATE POLICY "Users can delete todos they created" ON todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE todos IS 'To-do items for persons and organizations';
COMMENT ON COLUMN todos.object_type IS 'Type of object: person or organization';
COMMENT ON COLUMN todos.object_id IS 'ID of the associated person or organization';
COMMENT ON COLUMN todos.description IS 'Rich text description stored as Lexical JSON format';
COMMENT ON COLUMN todos.assigned_to IS 'User assigned to this todo (can be different from creator)';
COMMENT ON COLUMN todos.due_date IS 'Optional due date and time for the todo';
