CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'flat');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"feature" varchar(50),
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"deposit_percent" integer,
	"deposit_due_date" date,
	"balance_due_date" date,
	"subtotal" numeric(10, 2) DEFAULT 0 NOT NULL,
	"discount_type" "discount_type",
	"discount_value" numeric(10, 2),
	"discount_label" text,
	"discount_amount" numeric(10, 2),
	"tax_rate" numeric(5, 4) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"notes" text,
	"payment_instructions" text,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_invoices_invoice_number" UNIQUE("invoice_number")
);
--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invoice_line_items_invoice_id" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_project_id" ON "invoices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_client_id" ON "invoices" USING btree ("client_id");