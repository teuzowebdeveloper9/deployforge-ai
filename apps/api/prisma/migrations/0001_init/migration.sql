CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "apps" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "app_versions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "app_id" TEXT NOT NULL REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "version_number" INTEGER NOT NULL,
  "storage_path" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "quality_score" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT NOT NULL
);

CREATE UNIQUE INDEX "app_versions_app_id_version_number_key" ON "app_versions"("app_id", "version_number");

CREATE TABLE "builds" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "app_id" TEXT NOT NULL REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "version_id" TEXT REFERENCES "app_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "status" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "logs_path" TEXT,
  "report_path" TEXT,
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3)
);

CREATE TABLE "build_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "build_id" TEXT NOT NULL REFERENCES "builds"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "level" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "agent_messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "app_id" TEXT NOT NULL REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "agent_runs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "app_id" TEXT NOT NULL REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "response" TEXT,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3)
);

CREATE TABLE "env_variables" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "app_id" TEXT NOT NULL REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "environment" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "secret_reference" TEXT NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "env_variables_app_id_environment_key_key" ON "env_variables"("app_id", "environment", "key");

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "app_id" TEXT REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
