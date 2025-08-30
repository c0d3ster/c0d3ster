-- Migration: Add project_name to project_requests table
-- This aligns the database schema with the models and queries

-- Add project_name column to project_requests table (nullable initially)
ALTER TABLE project_requests
  ADD COLUMN project_name VARCHAR(255);

-- Backfill existing project_requests with project_name from title
UPDATE project_requests
SET project_name = COALESCE(NULLIF(TRIM(title), ''), 'Untitled Project')
WHERE project_name IS NULL OR project_name = '';

-- Make project_name NOT NULL after backfill
ALTER TABLE project_requests
  ALTER COLUMN project_name SET NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_project_requests_project_name ON project_requests(project_name);