CREATE TYPE "public"."chain_status" AS ENUM('live', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."link_status" AS ENUM('paid', 'submitted', 'skipped', 'removed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'captured', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."reveal_mode" AS ENUM('referrer', 'latest');--> statement-breakpoint
CREATE TABLE "chains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"prompt" text NOT NULL,
	"tint" text DEFAULT 'wine' NOT NULL,
	"price_paise" integer DEFAULT 500 NOT NULL,
	"tail" integer DEFAULT 0 NOT NULL,
	"unseal_after" integer DEFAULT 50 NOT NULL,
	"unseal_media" boolean DEFAULT false NOT NULL,
	"reveal_count" integer DEFAULT 1 NOT NULL,
	"reveal_mode" "reveal_mode" DEFAULT 'referrer' NOT NULL,
	"window_minutes" integer DEFAULT 10 NOT NULL,
	"allow_voice" boolean DEFAULT true NOT NULL,
	"allow_image" boolean DEFAULT true NOT NULL,
	"status" "chain_status" DEFAULT 'live' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chains_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"payer_hash" text,
	"push_subscription" jsonb,
	"city" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"chain_id" uuid,
	"device_id" uuid,
	"name" text NOT NULL,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"status" "link_status" DEFAULT 'paid' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"body" text,
	"voice_key" text,
	"voice_type" text,
	"voice_seconds" integer,
	"image_key" text,
	"image_type" text,
	"city" text,
	"device_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"reveal_token" text NOT NULL,
	"revealed_link_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"read_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "links_reveal_token_unique" UNIQUE("reveal_token")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"gateway" text NOT NULL,
	"gateway_order_id" text NOT NULL,
	"gateway_payment_id" text,
	"amount_paise" integer NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"ref_position" integer,
	"city" text,
	"link_id" uuid,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"captured_at" timestamp with time zone,
	CONSTRAINT "payments_gateway_order_id_unique" UNIQUE("gateway_order_id"),
	CONSTRAINT "payments_gateway_payment_id_unique" UNIQUE("gateway_payment_id")
);
--> statement-breakpoint
CREATE TABLE "reads" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"link_id" uuid NOT NULL,
	"reader_link_id" uuid NOT NULL,
	"reader_city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution" text
);
--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_chain_id_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_chain_id_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reads" ADD CONSTRAINT "reads_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reads" ADD CONSTRAINT "reads_reader_link_id_links_id_fk" FOREIGN KEY ("reader_link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "devices_payer_hash_idx" ON "devices" USING btree ("payer_hash");--> statement-breakpoint
CREATE INDEX "events_chain_name_created_idx" ON "events" USING btree ("chain_id","name","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "links_chain_position_uq" ON "links" USING btree ("chain_id","position");--> statement-breakpoint
CREATE INDEX "links_chain_status_pos_idx" ON "links" USING btree ("chain_id","status","position");--> statement-breakpoint
CREATE INDEX "links_device_idx" ON "links" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "links_status_deadline_idx" ON "links" USING btree ("status","deadline_at");--> statement-breakpoint
CREATE INDEX "payments_status_created_idx" ON "payments" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reads_link_idx" ON "reads" USING btree ("link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reads_pair_uq" ON "reads" USING btree ("link_id","reader_link_id");--> statement-breakpoint
CREATE INDEX "reports_link_idx" ON "reports" USING btree ("link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_link_device_uq" ON "reports" USING btree ("link_id","device_id");