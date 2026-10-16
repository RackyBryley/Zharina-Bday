-- Run this script in Supabase Dashboard > SQL Editor.
-- This guestbook publishes every accepted wish immediately.
-- Public visitors can read and insert wishes; they cannot update or delete them via the public API.

create table if not exists public.birthday_wishes (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 60),
  message text not null check (char_length(trim(message)) between 2 and 500),
  created_at timestamptz not null default now()
);

create index if not exists birthday_wishes_created_at_idx
  on public.birthday_wishes (created_at desc);

alter table public.birthday_wishes enable row level security;

-- Remove these policies first so re-running this setup remains safe.
drop policy if exists "Anyone can read birthday wishes" on public.birthday_wishes;
drop policy if exists "Anyone can submit birthday wishes" on public.birthday_wishes;

create policy "Anyone can read birthday wishes"
  on public.birthday_wishes
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can submit birthday wishes"
  on public.birthday_wishes
  for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) between 1 and 60
    and char_length(trim(message)) between 2 and 500
  );

-- Deliberately no public UPDATE or DELETE policy.
-- Do not grant browser access to service_role credentials.

-- Live wall: let the website receive new wishes the moment they are posted.
-- (Safe to run more than once.)
do $$
begin
  alter publication supabase_realtime add table public.birthday_wishes;
exception when duplicate_object then
  null;
end $$;
