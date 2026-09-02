ALTER TABLE "issues" ADD COLUMN "ai_summary" jsonb;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "ai_summary_generated_at" timestamp with time zone;