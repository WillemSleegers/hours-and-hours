-- Updated Hours and Hours Database Setup - Slot-based approach
-- Run this SQL in your Supabase SQL Editor

-- Drop old time_entries table if it exists
DROP TABLE IF EXISTS time_entries CASCADE;

-- Create time_slots table (stores individual 15-minute slots)
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot DECIMAL NOT NULL, -- 15-minute slot as decimal (9.0, 9.25, 9.5, 9.75, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure we don't have duplicate slots for the same date
  UNIQUE(date, time_slot)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS time_slots_date_idx ON time_slots(date);
CREATE INDEX IF NOT EXISTS time_slots_project_id_idx ON time_slots(project_id);
CREATE INDEX IF NOT EXISTS time_slots_date_time_idx ON time_slots(date, time_slot);

-- Note: Projects and user_settings tables remain unchanged
-- Run the original supabase-setup.sql first if you haven't created those tables
