-- Migration: Cleanup project status enum and add new fields
-- Remove 'live' and 'on_hold' from project_status enum
-- Add overview, logo, and projectName fields to projects table
-- Move existing title data to projectName and make title optional

-- First, create a new enum without the unwanted values
CREATE TYPE project_status_new AS ENUM (
  'requested',
  'in_review',
  'approved',
  'in_progress',
  'in_testing',
  'ready_for_launch',
  'completed',
  'cancelled'
);

-- Update existing columns to use the new enum
ALTER TABLE projects 
  ALTER COLUMN status TYPE project_status_new 
  USING status::text::project_status_new;

-- Drop the old enum
DROP TYPE project_status;

-- Rename the new enum to the original name
ALTER TYPE project_status_new RENAME TO project_status;

-- Add new fields to projects table
ALTER TABLE projects 
  ADD COLUMN overview TEXT,
  ADD COLUMN logo TEXT,
  ADD COLUMN project_name TEXT;

-- Move existing title data to project_name for all existing projects
UPDATE projects 
SET project_name = COALESCE(title, 'Untitled Project')
WHERE project_name IS NULL;

-- Add constraints for the new fields
ALTER TABLE projects 
  ALTER COLUMN project_name SET NOT NULL;

-- Make title optional (remove NOT NULL constraint)
ALTER TABLE projects 
  ALTER COLUMN title DROP NOT NULL;

-- Create index on project_name for better query performance
CREATE INDEX idx_projects_project_name ON projects(project_name);
