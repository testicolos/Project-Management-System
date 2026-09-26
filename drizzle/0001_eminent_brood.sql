CREATE TABLE "project_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"content" text NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(64);--> statement-breakpoint
UPDATE "users" SET "username" = CASE
	WHEN "email" = 'admin@projectcommand.qa' THEN 'admin'
	ELSE left(lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9._-]', '', 'g')), 48) || '-' || substr("id"::text, 1, 8)
END;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_notes_project_idx" ON "project_notes" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");
