-- Shared function: auto-updates the updated_at column on row changes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles table

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  display_name text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert
  to authenticated
  with check ( (select auth.uid()) = id );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles for delete
  to authenticated
  using ( (select auth.uid()) = id );