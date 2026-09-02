CREATE TABLE "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"fingerprint" text NOT NULL,
	"event_type" text NOT NULL,
	"category" text DEFAULT 'error' NOT NULL,
	"severity" integer NOT NULL,
	"message" text NOT NULL,
	"file" text,
	"line" integer,
	"stack_trace" text,
	"request_url" text,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"metadata" jsonb,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issues_site_id_fingerprint_unique" UNIQUE("site_id","fingerprint")
);
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;