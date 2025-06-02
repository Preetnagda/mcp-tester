CREATE TYPE "public"."transport_type" AS ENUM('stdio', 'http', 'sse');--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD COLUMN "transport_type" "transport_type" DEFAULT 'http' NOT NULL;