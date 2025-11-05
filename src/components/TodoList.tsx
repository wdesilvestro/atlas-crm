'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Todo, TodoFormData } from '@/types/todo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotesEditor } from '@/components/NotesEditor'
import { NotesViewer } from '@/components/NotesViewer'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Calendar, User, Edit2, Trash2, X, Check } from 'lucide-react'
import { format } from 'date-fns'

interface TodoListProps {
  objectType: 'person' | 'organization'
  objectId: string
}

// Helper function to get current local date in format "YYYY-MM-DD"
const getLocalDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TodoList({ objectType, objectId }: TodoListProps) {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; email: string; display_name?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)

  // Form state for new todo
  const [newTodo, setNewTodo] = useState<TodoFormData>({
    title: '',
    description: null,
    assigned_to: null,
    due_date: null,
  })

  // Form state for editing todo
  const [editTodo, setEditTodo] = useState<TodoFormData | null>(null)

  useEffect(() => {
    if (user) {
      fetchTodos()
      fetchUsers()
    }
  }, [user, objectType, objectId])

  const fetchTodos = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('todos_with_user')
        .select('*')
        .eq('object_type', objectType)
        .eq('object_id', objectId)
        .order('completed', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
      toast.error('Failed to load todos')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // For now, we only show the current user as an option
      // In the future, you could create a database view or function to get all users
      if (user) {
        setAvailableUsers([{
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name
        }])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      if (user) {
        setAvailableUsers([{
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name
        }])
      }
    }
  }

  const handleAddTodo = async () => {
    if (!user) {
      toast.error('You must be logged in to add a todo')
      return
    }

    if (!newTodo.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            user_id: user.id,
            object_type: objectType,
            object_id: objectId,
            title: newTodo.title.trim(),
            description: newTodo.description || null,
            assigned_to: newTodo.assigned_to || null,
            due_date: newTodo.due_date || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast.success('Todo added successfully')
      setNewTodo({
        title: '',
        description: null,
        assigned_to: null,
        due_date: null,
      })
      setIsAddingTodo(false)
      fetchTodos()
    } catch (error) {
      console.error('Error adding todo:', error)
      toast.error('Failed to add todo')
    }
  }

  const handleUpdateTodo = async (todoId: string) => {
    if (!editTodo) return

    if (!editTodo.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      const { error } = await supabase
        .from('todos')
        .update({
          title: editTodo.title.trim(),
          description: editTodo.description || null,
          assigned_to: editTodo.assigned_to || null,
          due_date: editTodo.due_date || null,
        })
        .eq('id', todoId)

      if (error) throw error

      toast.success('Todo updated successfully')
      setEditingTodoId(null)
      setEditTodo(null)
      fetchTodos()
    } catch (error) {
      console.error('Error updating todo:', error)
      toast.error('Failed to update todo')
    }
  }

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({
          completed: !todo.completed,
          completed_at: !todo.completed ? new Date().toISOString() : null,
        })
        .eq('id', todo.id)

      if (error) throw error

      fetchTodos()
    } catch (error) {
      console.error('Error toggling todo:', error)
      toast.error('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return

    try {
      const { error } = await supabase.from('todos').delete().eq('id', todoId)

      if (error) throw error

      toast.success('Todo deleted successfully')
      fetchTodos()
    } catch (error) {
      console.error('Error deleting todo:', error)
      toast.error('Failed to delete todo')
    }
  }

  const startEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id)
    setEditTodo({
      title: todo.title,
      description: todo.description,
      assigned_to: todo.assigned_to,
      due_date: todo.due_date ? normalizeDateString(todo.due_date) : null,
    })
  }

  const cancelEdit = () => {
    setEditingTodoId(null)
    setEditTodo(null)
  }

  const getUserDisplay = (todo: Todo) => {
    if (!todo.assigned_to) return null
    return todo.assigned_user_display_name || todo.assigned_user_email
  }

  const normalizeDateString = (dateString: string): string => {
    // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS.sssZ" formats
    // Return just the date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0]
    }
    return dateString
  }

  const isToday = (dateString: string) => {
    const normalized = normalizeDateString(dateString)
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    return normalized === todayStr
  }

  const isOverdue = (dateString: string, completed: boolean) => {
    if (completed) return false
    const normalized = normalizeDateString(dateString)
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    return normalized < todayStr
  }

  const formatDueDate = (dateString: string) => {
    if (!dateString) return ''

    const normalized = normalizeDateString(dateString)

    if (isToday(dateString)) {
      return 'Today'
    }

    // Parse the date string as local date (YYYY-MM-DD)
    const parts = normalized.split('-')
    if (parts.length !== 3) return dateString // Return as-is if not valid format

    const [year, month, day] = parts.map(Number)
    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString

    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) return dateString // Invalid date

    return format(date, 'MMM d, yyyy')
  }

  const getTodoBackgroundClass = (todo: Todo) => {
    if (todo.completed) {
      return 'bg-muted/50 opacity-60'
    }
    if (todo.due_date) {
      if (isOverdue(todo.due_date, todo.completed)) {
        return 'bg-red-50 dark:bg-red-950/20'
      }
      if (isToday(todo.due_date)) {
        return 'bg-yellow-50 dark:bg-yellow-950/20'
      }
    }
    return 'bg-card'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>To-Do Items</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>To-Do Items</CardTitle>
            <CardDescription>
              Track tasks and action items for this {objectType}
            </CardDescription>
          </div>
          {!isAddingTodo && (
            <Button onClick={() => setIsAddingTodo(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Todo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Todo Form */}
        {isAddingTodo && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Enter todo title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <NotesEditor
                value={newTodo.description || ''}
                onChange={(value) => setNewTodo({ ...newTodo, description: value || null })}
                placeholder="Add a description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to</label>
                <Select
                  value={newTodo.assigned_to || 'unassigned'}
                  onValueChange={(value) =>
                    setNewTodo({ ...newTodo, assigned_to: value === 'unassigned' ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newTodo.due_date || ''}
                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value || null })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleAddTodo} size="sm">
                <Check className="w-4 h-4 mr-2" />
                Add Todo
              </Button>
              <Button
                onClick={() => {
                  setIsAddingTodo(false)
                  setNewTodo({
                    title: '',
                    description: null,
                    assigned_to: null,
                    due_date: null,
                  })
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Todo List */}
        {todos.length === 0 && !isAddingTodo ? (
          <div className="text-center py-8 text-muted-foreground">
            No todos yet. Click &quot;Add Todo&quot; to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 border rounded-lg ${getTodoBackgroundClass(todo)}`}
              >
                {editingTodoId === todo.id && editTodo ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        placeholder="Enter todo title"
                        value={editTodo.title}
                        onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description (optional)</label>
                      <NotesEditor
                        value={editTodo.description || ''}
                        onChange={(value) => setEditTodo({ ...editTodo, description: value || null })}
                        placeholder="Add a description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Assign to</label>
                        <Select
                          value={editTodo.assigned_to || 'unassigned'}
                          onValueChange={(value) =>
                            setEditTodo({ ...editTodo, assigned_to: value === 'unassigned' ? null : value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {availableUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.display_name || u.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Due date</label>
                        <input
                          type="date"
                          value={editTodo.due_date || ''}
                          onChange={(e) => setEditTodo({ ...editTodo, due_date: e.target.value || null })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleUpdateTodo(todo.id)} size="sm">
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${
                            todo.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <div className="mt-2 p-3 bg-muted/30 rounded-md">
                            <NotesViewer value={todo.description} />
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {getUserDisplay(todo) && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {getUserDisplay(todo)}
                            </div>
                          )}
                          {todo.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(todo.due_date)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => startEditTodo(todo)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteTodo(todo.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
