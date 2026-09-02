CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"category" text DEFAULT 'change' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;