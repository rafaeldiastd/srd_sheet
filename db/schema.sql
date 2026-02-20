-- Create the sheets table
create table public.sheets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  class text,
  race text,
  level integer default 1,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.sheets enable row level security;

-- Policy: Users can view their own sheets
create policy "Users can view their own sheets"
  on public.sheets for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own sheets
create policy "Users can insert their own sheets"
  on public.sheets for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own sheets
create policy "Users can update their own sheets"
  on public.sheets for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own sheets
create policy "Users can delete their own sheets"
  on public.sheets for delete
  using (auth.uid() = user_id);
