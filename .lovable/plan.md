

# Create sync_items Table Migration

## What

Create the `sync_items` table in the database to support the Mobile Notes feature already referenced in the codebase (`Index.tsx`, `MobileSync.tsx`).

## Migration SQL

A single migration file will be created and applied with the following schema:

- **Table**: `public.sync_items`
  - `id` — UUID primary key (auto-generated)
  - `content` — text, not null
  - `created_at` — timestamptz, defaults to UTC now
- **Row Level Security**: Enabled with an open policy allowing all operations (public-facing notes feature)

## Steps

1. Use the database migration tool to execute the provided SQL (create table, enable RLS, create policy)
2. The migration will be applied automatically to the connected backend

## Note

The RLS policy allows unrestricted access ("using (true)"). This is appropriate for the current public notes feature but should be tightened if user-specific data or authentication is added later.

