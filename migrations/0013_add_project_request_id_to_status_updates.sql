ALTER TABLE "project_status_updates" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_status_updates" ADD COLUMN "project_request_id" uuid;--> statement-breakpoint
ALTER TABLE "project_status_updates" ADD CONSTRAINT "project_status_updates_project_request_id_project_requests_id_fk" FOREIGN KEY ("project_request_id") REFERENCES "public"."project_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_psu_project_request_id" ON "project_status_updates" USING btree ("project_request_id");