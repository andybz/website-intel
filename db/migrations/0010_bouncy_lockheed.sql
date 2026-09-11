CREATE TABLE "commerce_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"external_order_id" text NOT NULL,
	"order_number" text,
	"status" text NOT NULL,
	"total" text NOT NULL,
	"currency" text,
	"item_count" integer,
	"placed_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_orders_site_id_external_order_id_unique" UNIQUE("site_id","external_order_id")
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "ecommerce_platform" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "product_count" integer;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "store_currency" text;--> statement-breakpoint
ALTER TABLE "commerce_orders" ADD CONSTRAINT "commerce_orders_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;