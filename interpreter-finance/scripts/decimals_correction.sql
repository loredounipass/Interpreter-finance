ALTER TABLE daily_logs ALTER COLUMN minutes TYPE numeric;
ALTER TABLE goals ALTER COLUMN daily_minutes TYPE numeric;
ALTER TABLE goals ALTER COLUMN work_hours TYPE numeric;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS rate_per_minute numeric default 0.13;

-- Reset no longer deletes the saved entry: it archives the current session
-- row (is_active = false) and starts a new one. Existing rows default to
-- archived so history (Latest logs / earnings) is preserved.
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS daily_logs_one_active_per_day
  ON public.daily_logs (user_id, logged_on) WHERE is_active;
