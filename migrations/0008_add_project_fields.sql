-- Migration: Add new fields to projects table
-- Add overview, logo, project_name, and featured fields
-- Move existing title data to project_name and make title optional

-- Add new fields to projects table
ALTER TABLE projects 
  ADD COLUMN overview TEXT,
  ADD COLUMN logo TEXT,
  ADD COLUMN project_name VARCHAR(255),
  ADD COLUMN featured BOOLEAN DEFAULT FALSE NOT NULL;

-- Move existing title data to project_name for all existing projects
UPDATE projects 
SET project_name = COALESCE(NULLIF(TRIM(title), ''), 'Untitled Project')
WHERE project_name IS NULL OR project_name = '';

-- Add constraints for the new fields
ALTER TABLE projects 
  ALTER COLUMN project_name SET NOT NULL;

-- Make title optional (remove NOT NULL constraint)
ALTER TABLE projects 
  ALTER COLUMN title DROP NOT NULL;

-- Create indexes for better query performance
CREATE INDEX idx_projects_project_name ON projects(project_name);
CREATE INDEX idx_projects_featured ON projects(featured);
