-- Backfill null titles from project_name before enforcing NOT NULL
UPDATE "project_requests" SET "title" = "project_name" WHERE "title" IS NULL;

ALTER TABLE "project_requests" ALTER COLUMN "title" SET NOT NULL;