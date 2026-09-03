-- Add earnings column to daily_logs table to persist computed earnings
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS earnings numeric DEFAULT 0;
