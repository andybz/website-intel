CREATE TYPE "public"."site_status" AS ENUM('pending', 'connected', 'disconnected');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"status" "site_status" DEFAULT 'pending' NOT NULL,
	"api_secret_hash" text,
	"wordpress_version" text,
	"php_version" text,
	"server_software" text,
	"active_theme" text,
	"theme_version" text,
	"is_multisite" boolean DEFAULT false NOT NULL,
	"connected_at" timestamp with time zone,
	"last_heartbeat_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "site_plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"version" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_plugins_site_id_slug_unique" UNIQUE("site_id","slug")
);
--> statement-breakpoint
CREATE TABLE "pairing_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_plugins" ADD CONSTRAINT "site_plugins_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_tokens" ADD CONSTRAINT "pairing_tokens_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;