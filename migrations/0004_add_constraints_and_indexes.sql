-- Add CHECK constraints for data validation
-- Progress percentage should be between 0 and 100
ALTER TABLE project_status_updates
  ADD CONSTRAINT project_status_updates_progress_chk
  CHECK (progress_percentage IS NULL OR progress_percentage BETWEEN 0 AND 100);

ALTER TABLE projects
  ADD CONSTRAINT projects_progress_chk
  CHECK (progress_percentage BETWEEN 0 AND 100);

-- Budget and paid amounts should be non-negative (>= 0, allowing zero budgets)
ALTER TABLE projects
  ADD CONSTRAINT projects_budget_nonneg_chk
  CHECK (budget IS NULL OR budget >= 0),
  ADD CONSTRAINT projects_paid_amount_nonneg_chk
  CHECK (paid_amount IS NULL OR paid_amount >= 0);

ALTER TABLE project_requests
  ADD CONSTRAINT project_requests_budget_nonneg_chk
  CHECK (budget IS NULL OR budget >= 0);

-- Add indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_client_id_idx ON projects (client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_status_idx ON projects (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_updated_at_idx ON projects (updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS project_collaborators_project_id_idx ON project_collaborators (project_id);

-- Add unique constraint to prevent duplicate collaborators
ALTER TABLE project_collaborators
  ADD CONSTRAINT project_collaborators_project_user_uq
  UNIQUE (project_id, user_id);
