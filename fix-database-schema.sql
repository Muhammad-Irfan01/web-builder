-- Manually add the missing apiKey column to the projects table
-- Run this against your PostgreSQL database to sync the schema with Prisma

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "projects_apiKey_key" ON "projects"("apiKey");
