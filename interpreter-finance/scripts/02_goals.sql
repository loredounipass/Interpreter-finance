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

-- goals table

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_minutes integer not null check (daily_minutes >= 0),
  work_hours numeric(4,1) not null default 15 check (work_hours >= 0 and work_hours <= 24),
  rate_per_minute numeric not null default 0.13 check (rate_per_minute >= 0),
  starts_on date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists goals_one_active_per_user
  on public.goals (user_id) where is_active = true;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at before update on public.goals
for each row execute function public.set_updated_at();

alter table public.goals enable row level security;

revoke all on table public.goals from anon, authenticated;
grant select, insert, update, delete on table public.goals to authenticated;

drop policy if exists goals_select_own on public.goals;
create policy goals_select_own on public.goals for select
  to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists goals_insert_own on public.goals;
create policy goals_insert_own on public.goals for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists goals_update_own on public.goals;
create policy goals_update_own on public.goals for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists goals_delete_own on public.goals;
create policy goals_delete_own on public.goals for delete
  to authenticated
  using ( (select auth.uid()) = user_id );