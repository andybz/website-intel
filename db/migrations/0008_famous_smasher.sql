CREATE TABLE "pageview_hourly_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"hour_start" timestamp with time zone NOT NULL,
	"classification" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pageview_hourly_counts_site_id_hour_start_classification_unique" UNIQUE("site_id","hour_start","classification")
);
--> statement-breakpoint
ALTER TABLE "pageview_hourly_counts" ADD CONSTRAINT "pageview_hourly_counts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;