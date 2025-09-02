ALTER TABLE "project_files" ADD COLUMN "content_type" varchar(100) NOT NULL DEFAULT 'image/jpeg';--> statement-breakpoint
ALTER TABLE "project_files" DROP COLUMN "file_type";