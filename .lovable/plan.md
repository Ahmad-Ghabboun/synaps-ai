

# Create sync_items Table Migration

## What

Create the `sync_items` table in the database to support the Mobile Notes feature referenced in `MobileSync.tsx`.

## Migration SQL

The migration will be applied using the database migration tool with the following:

- **Table**: `public.sync_items`
  - `id` -- UUID primary key (auto-generated)
  - `content` -- text, not null
  - `created_at` -- timestamptz, defaults to UTC now
- **Row Level Security**: Enabled with an open policy allowing all operations
- **Realtime**: Table added to `supabase_realtime` publication for live sync

## Steps

1. Use the Supabase migration tool to execute the SQL (create table, enable RLS, create policy, enable realtime)
2. The migration is applied automatically to the connected backend

## Note

The RLS policy allows unrestricted access (`using (true)`). This is appropriate for the current public notes feature but should be tightened if user-specific data or authentication is added later.

