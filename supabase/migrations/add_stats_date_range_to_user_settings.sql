-- Add stats date range columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN stats_start_date DATE,
ADD COLUMN stats_end_date DATE;
