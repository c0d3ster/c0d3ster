CREATE INDEX "idx_domains_project_id" ON "domains" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_domains_user_id" ON "domains" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_files_project_id" ON "project_files" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_files_uploaded_by" ON "project_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_project_collab_project_id" ON "project_collaborators" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_collab_user_id" ON "project_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_collab_added_by" ON "project_collaborators" USING btree ("added_by");--> statement-breakpoint
CREATE INDEX "idx_project_requests_user_id" ON "project_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_requests_reviewed_by" ON "project_requests" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "idx_psu_project_id" ON "project_status_updates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_psu_updated_by" ON "project_status_updates" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "idx_projects_request_id" ON "projects" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_projects_client_id" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_projects_developer_id" ON "projects" USING btree ("developer_id");
