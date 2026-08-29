-- Enable Realtime for real-time updates
-- Run this in the Supabase SQL Editor once.
-- After running, the app receives live updates without manual refresh.

alter publication supabase_realtime add table public.daily_logs;
alter publication supabase_realtime add table public.goals;