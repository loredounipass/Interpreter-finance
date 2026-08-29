ALTER TABLE daily_logs ALTER COLUMN minutes TYPE numeric;
ALTER TABLE goals ALTER COLUMN daily_minutes TYPE numeric;
ALTER TABLE goals ALTER COLUMN work_hours TYPE numeric;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS rate_per_minute numeric default 0.13;
