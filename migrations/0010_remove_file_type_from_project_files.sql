-- 1) Add nullable, backfill, then enforce NOT NULL (no default going forward)
ALTER TABLE "project_files" ADD COLUMN "content_type" varchar(100);--> statement-breakpoint
UPDATE "project_files" SET "content_type" = 'image/jpeg' WHERE "content_type" IS NULL;--> statement-breakpoint
ALTER TABLE "project_files" ALTER COLUMN "content_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_files" DROP COLUMN "file_type";