-- Run this in the Supabase SQL editor to create the tasks table

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  note text,
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  category text check (category in ('Dev', 'Design', 'Meeting', 'Personal')) default 'Dev',
  due_date date,
  everyday boolean default false,
  done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security (allow all — tighten once you add auth)
alter table tasks enable row level security;

create policy "Allow all operations" on tasks
  for all
  using (true)
  with check (true);
