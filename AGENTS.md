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

## CRUD Operations Standards

### ✅ DO: Use PostgREST & Supabase Client

All database operations **MUST** use the Supabase client with PostgREST. This ensures:
- Automatic REST endpoint generation
- Built-in Row Level Security (RLS) enforcement
- Type safety with proper error handling
- Consistent API across the application

**Example Pattern:**
```typescript
import { supabase } from '@/lib/supabase'

// Create
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }])
  .select()

// Read
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)

// Update
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', id)

// Delete
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id)
```

### ❌ DON'T: Direct SQL Queries or Raw Connections

- Do not write raw SQL queries in the frontend
- Do not bypass PostgREST with direct database connections
- Do not use custom API routes as middlemen for simple CRUD

### RLS (Row Level Security)

All tables should have RLS policies enforced. Examples:
- Users can only view/edit their own records
- Admin users have elevated permissions
- Sensitive data is protected at the database level

When implementing new features, always define appropriate RLS policies in Supabase.

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

1. **Create database tables** in Supabase with appropriate RLS policies
2. **Define TypeScript types** for your data models
3. **Use Supabase client** for all CRUD operations
4. **Build UI** with shadcn/ui components and Tailwind CSS
5. **Test authentication** with Supabase Auth

## Performance Considerations

- Use PostgREST's `select` parameter to fetch only needed columns
- Leverage database-side filtering with `.eq()`, `.lt()`, etc. to reduce data transfer
- Consider real-time subscriptions for live updates instead of polling
- Use proper indexing in PostgreSQL for frequently queried columns
