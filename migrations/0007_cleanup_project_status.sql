-- Create new enum without 'live' and 'on_hold'
CREATE TYPE project_status_new AS ENUM (
  'requested','in_review','approved','in_progress',
  'in_testing','ready_for_launch','completed','cancelled'
);

-- Drop defaults referencing old type
ALTER TABLE projects ALTER COLUMN status DROP DEFAULT;
ALTER TABLE project_requests ALTER COLUMN status DROP DEFAULT;

-- Convert to text temporarily
ALTER TABLE projects ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE project_requests ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE project_status_updates ALTER COLUMN old_status TYPE text USING old_status::text;
ALTER TABLE project_status_updates ALTER COLUMN new_status TYPE text USING new_status::text;

-- Cleanup any invalid values (live/on_hold or anything else unexpected)
UPDATE projects SET status='approved' WHERE status IN ('live','on_hold');
UPDATE project_requests SET status='requested' WHERE status IN ('live','on_hold');
UPDATE project_status_updates SET old_status='approved' WHERE old_status IN ('live','on_hold');
UPDATE project_status_updates SET new_status='approved' WHERE new_status IN ('live','on_hold');

-- Cast back to new enum
ALTER TABLE projects ALTER COLUMN status TYPE project_status_new USING status::project_status_new;
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'approved';

ALTER TABLE project_requests ALTER COLUMN status TYPE project_status_new USING status::project_status_new;
ALTER TABLE project_requests ALTER COLUMN status SET DEFAULT 'requested';

ALTER TABLE project_status_updates ALTER COLUMN old_status TYPE project_status_new USING old_status::project_status_new;
ALTER TABLE project_status_updates ALTER COLUMN new_status TYPE project_status_new USING new_status::project_status_new;

-- Drop old enum (must be in a separate non-transactional step)
DROP TYPE project_status;
ALTER TYPE project_status_new RENAME TO project_status;
