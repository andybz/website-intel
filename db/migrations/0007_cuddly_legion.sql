CREATE TABLE "issue_hourly_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_id" integer NOT NULL,
	"hour_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "issue_hourly_counts_issue_id_hour_start_unique" UNIQUE("issue_id","hour_start")
);
--> statement-breakpoint
ALTER TABLE "issue_hourly_counts" ADD CONSTRAINT "issue_hourly_counts_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;