ALTER TABLE "chains" ADD COLUMN "allow_contact" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "contact" text;