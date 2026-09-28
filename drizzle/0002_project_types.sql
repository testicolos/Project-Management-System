CREATE TABLE "project_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_types_name_unique" ON "project_types" USING btree ("name");
--> statement-breakpoint
INSERT INTO "project_types" ("name") VALUES ('In Hand'), ('Tender') ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_type_id" uuid;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_type_id_project_types_id_fk" FOREIGN KEY ("project_type_id") REFERENCES "public"."project_types"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "projects_project_type_idx" ON "projects" USING btree ("project_type_id");
