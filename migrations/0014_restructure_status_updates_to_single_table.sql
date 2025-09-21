ALTER TABLE "project_status_updates" RENAME TO "status_updates";--> statement-breakpoint
ALTER TABLE "status_updates" DROP CONSTRAINT "project_status_updates_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "status_updates" DROP CONSTRAINT "project_status_updates_project_request_id_project_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "status_updates" DROP CONSTRAINT "project_status_updates_updated_by_users_id_fk";
--> statement-breakpoint
DROP INDEX "idx_psu_project_id";--> statement-breakpoint
DROP INDEX "idx_psu_project_request_id";--> statement-breakpoint
DROP INDEX "idx_psu_updated_by";--> statement-breakpoint
ALTER TABLE "status_updates" ADD COLUMN "entity_type" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "status_updates" ADD COLUMN "entity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "status_updates" ADD CONSTRAINT "status_updates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_status_updates_entity_type_id" ON "status_updates" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_status_updates_updated_by" ON "status_updates" USING btree ("updated_by");--> statement-breakpoint
ALTER TABLE "status_updates" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "status_updates" DROP COLUMN "project_request_id";