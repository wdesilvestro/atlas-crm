export interface Todo {
  id: string
  user_id: string
  object_type: 'person' | 'organization'
  object_id: string
  title: string
  description: string | null // Lexical JSON serialized as string
  assigned_to: string | null
  due_date: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  assigned_user_email?: string
  assigned_user_display_name?: string
}

export interface TodoFormData {
  title: string
  description: string | null
  assigned_to: string | null
  due_date: string | null
}
