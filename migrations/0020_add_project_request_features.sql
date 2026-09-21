ALTER TABLE "project_requests" ADD COLUMN "features" json;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "requirements";