# Migration Guide

## Updating from the initial version

If you already have the app running with the initial schema, you'll need to update your database to support the new features (configurable time increments and day hours).

### Step 1: Backup Your Data

Before making any changes, backup your existing data:

```sql
-- Backup projects
CREATE TABLE projects_backup AS SELECT * FROM projects;

-- Backup time entries
CREATE TABLE time_entries_backup AS SELECT * FROM time_entries;
```

### Step 2: Update the time_entries table

The `time_entries` table needs to be updated to use fractional hours instead of integer hours:

```sql
-- Add new columns
ALTER TABLE time_entries
  ADD COLUMN start_time DECIMAL(4,2),
  ADD COLUMN end_time DECIMAL(4,2);

-- Copy data from old columns to new columns
UPDATE time_entries
SET start_time = start_hour::DECIMAL,
    end_time = end_hour::DECIMAL;

-- Drop old columns
ALTER TABLE time_entries
  DROP COLUMN start_hour,
  DROP COLUMN end_hour;

-- Add constraints
ALTER TABLE time_entries
  ADD CONSTRAINT check_start_time CHECK (start_time >= 0 AND start_time < 24),
  ADD CONSTRAINT check_end_time CHECK (end_time >= 0 AND end_time <= 24),
  ADD CONSTRAINT check_time_range CHECK (start_time < end_time);
```

### Step 3: Create the user_settings table

```sql
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

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO user_settings (day_start_hour, day_end_hour, time_increment)
VALUES (0, 24, 60);
```

### Step 4: Update your local code

Pull the latest changes from the repository and rebuild:

```bash
git pull
npm install
npm run build
```

### Step 5: Test

1. Restart your development server
2. Go to Settings and verify the new time tracking preferences appear
3. Try changing the settings and creating new time entries
4. Verify your existing time entries still display correctly

### Rollback (if needed)

If something goes wrong, you can restore from the backup:

```sql
-- Restore time entries
DROP TABLE time_entries;
ALTER TABLE time_entries_backup RENAME TO time_entries;

-- Drop user_settings if created
DROP TABLE user_settings;
```

## Fresh Installation

If you're installing for the first time, simply run the SQL from `lib/schema.sql` - no migration needed!
