create table if not exists public.sync_items (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.sync_items enable row level security;

create policy "Allow all operations on sync_items"
  on public.sync_items
  for all
  using (true)
  with check (true);

alter publication supabase_realtime add table public.sync_items;