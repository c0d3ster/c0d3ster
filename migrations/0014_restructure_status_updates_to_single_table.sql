ALTER TABLE "project_status_updates" RENAME TO "status_updates";--> statement-breakpoint
-- Drop legacy indexes first
DROP INDEX "idx_psu_project_id";--> statement-breakpoint
DROP INDEX "idx_psu_project_request_id";--> statement-breakpoint
DROP INDEX "idx_psu_updated_by";--> statement-breakpoint
-- Add new columns as nullable first
ALTER TABLE "status_updates" ADD COLUMN "entity_type" varchar(20);--> statement-breakpoint
ALTER TABLE "status_updates" ADD COLUMN "entity_id" uuid;--> statement-breakpoint

-- Backfill new columns from legacy columns
UPDATE "status_updates"
SET
  "entity_type" = CASE
    WHEN "project_request_id" IS NOT NULL THEN 'project_request'
    ELSE 'project'
  END,
  "entity_id" = COALESCE("project_request_id", "project_id");--> statement-breakpoint

-- Validate and enforce NOT NULL after backfill
ALTER TABLE "status_updates" ALTER COLUMN "entity_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "status_updates" ALTER COLUMN "entity_id" SET NOT NULL;--> statement-breakpoint

-- Constrain entity_type to allowed values
ALTER TABLE "status_updates"
  ADD CONSTRAINT "status_updates_entity_type_chk"
  CHECK ("entity_type" IN ('project','project_request'));--> statement-breakpoint

-- Now drop legacy FKs and columns
ALTER TABLE "status_updates" DROP CONSTRAINT "project_status_updates_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "status_updates" DROP CONSTRAINT "project_status_updates_project_request_id_project_requests_id_fk";--> statement-breakpoint
ALTER TABLE "status_updates" DROP CONSTRAINT "project_status_updates_updated_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "status_updates" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "status_updates" DROP COLUMN "project_request_id";--> statement-breakpoint

-- Recreate FK for updated_by on users
ALTER TABLE "status_updates" ADD CONSTRAINT "status_updates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_status_updates_entity_type_id" ON "status_updates" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_status_updates_updated_by" ON "status_updates" USING btree ("updated_by");