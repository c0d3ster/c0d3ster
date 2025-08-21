CREATE TYPE "public"."domain_status" AS ENUM('pending', 'active', 'expired', 'transferred', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('design', 'document', 'image', 'video', 'code', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('requested', 'in_review', 'approved', 'in_progress', 'in_testing', 'ready_for_launch', 'live', 'completed', 'on_hold', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('website', 'web_app', 'mobile_app', 'e_commerce', 'api', 'maintenance', 'consultation', 'other');--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"user_id" uuid NOT NULL,
	"domain_name" varchar(255) NOT NULL,
	"registrar" varchar(100) DEFAULT 'godaddy',
	"status" "domain_status" DEFAULT 'pending' NOT NULL,
	"registration_date" timestamp,
	"expiration_date" timestamp,
	"auto_renew" boolean DEFAULT true,
	"nameservers" json,
	"dns_records" json,
	"godaddy_domain_id" text,
	"ssl_certificate" boolean DEFAULT false,
	"ssl_expiration_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domains_domain_name_unique" UNIQUE("domain_name")
);
--> statement-breakpoint
CREATE TABLE "project_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'viewer' NOT NULL,
	"can_view_files" boolean DEFAULT true,
	"can_upload_files" boolean DEFAULT false,
	"can_manage_domains" boolean DEFAULT false,
	"added_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_type" "file_type" NOT NULL,
	"file_size" integer,
	"file_path" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"is_client_visible" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"project_type" "project_type" NOT NULL,
	"budget" numeric(10, 2),
	"timeline" varchar(100),
	"requirements" json,
	"contact_preference" varchar(50),
	"additional_info" text,
	"status" "project_status" DEFAULT 'requested' NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_status_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"old_status" "project_status",
	"new_status" "project_status" NOT NULL,
	"progress_percentage" integer,
	"update_message" text NOT NULL,
	"is_client_visible" boolean DEFAULT true,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"client_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"project_type" "project_type" NOT NULL,
	"status" "project_status" DEFAULT 'approved' NOT NULL,
	"priority" "project_priority" DEFAULT 'medium' NOT NULL,
	"budget" numeric(10, 2),
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"start_date" timestamp,
	"estimated_completion_date" timestamp,
	"actual_completion_date" timestamp,
	"requirements" json,
	"tech_stack" json,
	"repository_url" text,
	"staging_url" text,
	"live_url" text,
	"client_notes" text,
	"internal_notes" text,
	"progress_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_requests" ADD CONSTRAINT "project_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_requests" ADD CONSTRAINT "project_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_updates" ADD CONSTRAINT "project_status_updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_updates" ADD CONSTRAINT "project_status_updates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_request_id_project_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."project_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;