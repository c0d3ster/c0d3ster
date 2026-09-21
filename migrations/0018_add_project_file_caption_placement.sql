CREATE TYPE "public"."file_placement" AS ENUM('gallery', 'document', 'other');--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "caption" text;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "placement" "file_placement";