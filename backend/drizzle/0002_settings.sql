CREATE TABLE "settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"free_mode" boolean DEFAULT false NOT NULL,
	"free_banner" text DEFAULT 'Free this week — ₹5 a note after that.' NOT NULL,
	"reveal_hold_seconds" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("id")
);--> statement-breakpoint
INSERT INTO "settings" ("id") VALUES (true) ON CONFLICT DO NOTHING;
