-- daily_logs table

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  minutes integer not null check (minutes > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, logged_on desc, created_at desc);

drop trigger if exists daily_logs_set_updated_at on public.daily_logs;
create trigger daily_logs_set_updated_at before update on public.daily_logs
for each row execute function public.set_updated_at();

alter table public.daily_logs enable row level security;

revoke all on table public.daily_logs from anon, authenticated;
grant select, insert, update, delete on table public.daily_logs to authenticated;

drop policy if exists daily_logs_select_own on public.daily_logs;
create policy daily_logs_select_own on public.daily_logs for select
  to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists daily_logs_insert_own on public.daily_logs;
create policy daily_logs_insert_own on public.daily_logs for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists daily_logs_update_own on public.daily_logs;
create policy daily_logs_update_own on public.daily_logs for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists daily_logs_delete_own on public.daily_logs;
create policy daily_logs_delete_own on public.daily_logs for delete
  to authenticated
  using ( (select auth.uid()) = user_id );