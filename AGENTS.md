# Agent Guidelines for Atlas CRM

## Technology Stack

This project uses a modern, lightweight stack optimized for rapid development and scalability:

### Frontend
- **Next.js 14+** with App Router - Server-side rendering and static generation
- **React 18** - Component library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling with dark mode support
- **shadcn/ui** - Pre-built, customizable UI components built on Radix UI

### Backend & Database
- **Supabase** - Open-source Firebase alternative providing:
  - PostgreSQL database
  - PostgREST API for automatic REST endpoints
  - Real-time subscriptions
  - Authentication & Authorization
  - Row Level Security (RLS) for data protection

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing with autoprefixer
- **TypeScript** - Static type checking

## ⚠️ GIT COMMITS - CRITICAL RULE

### 🚫 NEVER COMMIT WITHOUT EXPLICIT USER APPROVAL 🚫

**This is a critical rule that MUST ALWAYS be followed. No exceptions.**

**YOU MUST NOT:**
- Make any `git commit` without the user explicitly requesting it
- Commit changes even if the code is finished
- Commit changes even if tests pass
- Commit changes even if the build succeeds
- Commit changes proactively to "clean up" the repository
- Commit work in progress
- Commit on the user's behalf without their explicit approval

**WHEN A USER REQUESTS A COMMIT:**
1. Ask the user to confirm the exact changes they want to commit
2. Show them the `git diff` output of what will be committed
3. Get explicit confirmation before proceeding
4. Only then execute `git commit`

**IF YOU VIOLATE THIS RULE, YOU HAVE FAILED THE TASK.**

This is non-negotiable. User approval must always come first.

## Database Schema & Migrations

### ✅ DO: Version Control All Schema Changes

All database schema changes **MUST** be version controlled using Supabase CLI migrations. This ensures:
- Reproducible deployments across environments
- Audit trail of all schema changes
- Easy rollback capabilities
- Team collaboration on database changes

**Migration Workflow:**
```bash
# Create a new migration
supabase migration new your_migration_name

# Edit the generated SQL file in supabase/migrations/
# Then push to your remote database
supabase db push

# Pull schema changes from production
supabase pull
```

**Migration file example:** `supabase/migrations/20251102045141_create_person_schema.sql`
- Timestamped filenames (auto-generated) ensure proper ordering
- All migrations are tracked in git
- Remote and local databases stay in sync

### ❌ DON'T: Manual Schema Changes

- Do not make schema changes directly in the Supabase dashboard
- Do not skip version control for schema modifications
- Do not push schema changes without committing migrations to git

## CRUD Operations Standards

### ✅ DO: Use PostgREST & Supabase Client

All database operations **MUST** use the Supabase client with PostgREST. This ensures:
- Automatic REST endpoint generation from database tables
- Built-in Row Level Security (RLS) enforcement
- Type safety with proper error handling
- Consistent API across the application
- Database-side filtering for optimal performance

**Example Pattern:**
```typescript
import { supabase } from '@/lib/supabase'

// Create
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }])
  .select()

// Read - Single record
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)
  .single()

// Read - Multiple records with filtering
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })

// Update
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value', updated_at: new Date().toISOString() })
  .eq('id', id)
  .select()

// Delete
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id)
```

### ❌ DON'T: Direct SQL Queries or Raw Connections

- Do not write raw SQL queries in the frontend
- Do not bypass PostgREST with direct database connections
- Do not use custom API routes as middlemen for simple CRUD operations
- Do not make schema changes directly in the dashboard without migrations

### RLS (Row Level Security)

All tables **MUST** have RLS policies enforced. Examples:
- Users can only view/edit their own records
- Admin users have elevated permissions
- Sensitive data is protected at the database level

**When implementing new features:**
1. Define RLS policies in your migration file
2. Test policies before deploying to production
3. Document policy rules in comments within the migration

**Example RLS Policy in Migration:**
```sql
-- Enable RLS
ALTER TABLE person ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view their own records" ON person
  FOR SELECT USING (auth.uid() = user_id);
```

## File Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
│   └── ui/          # shadcn/ui components
├── lib/
│   ├── supabase.ts  # Supabase client initialization
│   └── utils.ts     # Utility functions
└── types/           # TypeScript type definitions (when needed)
```

## Environment Variables

Always use `.env.local` for local development. Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

See `.env.example` for the template.

## Development Workflow

1. **Create migrations** for any database schema changes
   - Use `supabase migration new migration_name`
   - Write SQL in the generated migration file
   - Push with `supabase db push`
   - Commit migration files to git
2. **Define TypeScript types** for your data models
3. **Use Supabase client** for all CRUD operations via PostgREST
4. **Implement RLS policies** in migration files for data protection
5. **Build UI** with shadcn/ui components and Tailwind CSS
6. **Test authentication** with Supabase Auth

## Performance Considerations

- Use PostgREST's `select` parameter to fetch only needed columns
- Leverage database-side filtering with `.eq()`, `.lt()`, etc. to reduce data transfer
- Consider real-time subscriptions for live updates instead of polling
- Use proper indexing in PostgreSQL for frequently queried columns
