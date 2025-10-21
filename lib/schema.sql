-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time DECIMAL(4,2) NOT NULL CHECK (start_time >= 0 AND start_time < 24),
  end_time DECIMAL(4,2) NOT NULL CHECK (end_time >= 0 AND end_time <= 24),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_start_hour INTEGER DEFAULT 0 CHECK (day_start_hour >= 0 AND day_start_hour < 24),
  day_end_hour INTEGER DEFAULT 24 CHECK (day_end_hour > 0 AND day_end_hour <= 24),
  time_increment INTEGER DEFAULT 60 CHECK (time_increment IN (15, 30, 60)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_day_range CHECK (day_start_hour < day_end_hour)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS time_entries_date_idx ON time_entries(date);
CREATE INDEX IF NOT EXISTS time_entries_project_id_idx ON time_entries(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings row
INSERT INTO user_settings (day_start_hour, day_end_hour, time_increment)
VALUES (0, 24, 60)
ON CONFLICT DO NOTHING;
