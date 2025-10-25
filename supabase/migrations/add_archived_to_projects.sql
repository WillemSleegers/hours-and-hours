-- Add archived column to projects table
ALTER TABLE projects
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering archived projects
CREATE INDEX idx_projects_archived ON projects(archived);
