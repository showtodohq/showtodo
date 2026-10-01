CREATE TYPE "public"."recurrence_end_condition" AS ENUM('never', 'by_count', 'by_date');--> statement-breakpoint
CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekdays', 'weekly', 'monthly', 'custom_cron');--> statement-breakpoint
CREATE TYPE "public"."recurrence_status" AS ENUM('active', 'paused', 'dormant', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "recurring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"topic_hash" text NOT NULL,
	"note" text,
	"is_note_public" boolean DEFAULT true NOT NULL,
	"category" text,
	"frequency" "recurrence_frequency" DEFAULT 'daily' NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"days_of_week" integer[],
	"day_of_month" integer,
	"cron_expression" text,
	"status" "recurrence_status" DEFAULT 'active' NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"total_cycles" integer DEFAULT 0 NOT NULL,
	"completed_cycles" integer DEFAULT 0 NOT NULL,
	"consecutive_misses" integer DEFAULT 0 NOT NULL,
	"end_condition" "recurrence_end_condition" DEFAULT 'never' NOT NULL,
	"end_after_occurrences" integer,
	"end_date" timestamp with time zone,
	"next_run_at" timestamp with time zone NOT NULL,
	"last_run_at" timestamp with time zone,
	"timezone" text DEFAULT 'Asia/Shanghai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "recurring_rule_id" uuid;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "slot_key" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "cycle_index" integer;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recurring_rules_author_status" ON "recurring_rules" USING btree ("author_id","status");--> statement-breakpoint
CREATE INDEX "idx_recurring_rules_topic_status_next" ON "recurring_rules" USING btree ("topic_hash","status","next_run_at");--> statement-breakpoint
CREATE INDEX "idx_recurring_rules_next_run" ON "recurring_rules" USING btree ("next_run_at");--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_recurring_rule_id_recurring_rules_id_fk" FOREIGN KEY ("recurring_rule_id") REFERENCES "public"."recurring_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_todos_rule_slot" ON "todos" USING btree ("recurring_rule_id","slot_key");