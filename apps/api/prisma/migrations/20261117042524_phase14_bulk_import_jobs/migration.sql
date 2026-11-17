-- CreateEnum
CREATE TYPE "BulkImportCategory" AS ENUM ('STUDENTS', 'TEACHERS', 'PARENTS');

-- CreateEnum
CREATE TYPE "BulkImportStatus" AS ENUM ('PENDING', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "bulk_import_jobs" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "actor_id" UUID,
    "category" "BulkImportCategory" NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" "BulkImportStatus" NOT NULL DEFAULT 'PENDING',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "invalid_rows" INTEGER NOT NULL DEFAULT 0,
    "duplicate_rows" INTEGER NOT NULL DEFAULT 0,
    "successful_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows" INTEGER NOT NULL DEFAULT 0,
    "invitations_created" INTEGER NOT NULL DEFAULT 0,
    "invitations_sent" INTEGER NOT NULL DEFAULT 0,
    "invitations_failed" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB,
    "errors" JSONB,
    "results" JSONB,
    "idempotency_key" VARCHAR(255),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bulk_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bulk_import_jobs_school_id_status_idx" ON "bulk_import_jobs"("school_id", "status");

-- CreateIndex
CREATE INDEX "bulk_import_jobs_school_id_category_idx" ON "bulk_import_jobs"("school_id", "category");

-- CreateIndex
CREATE INDEX "bulk_import_jobs_school_id_created_at_idx" ON "bulk_import_jobs"("school_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bulk_import_jobs_school_id_idempotency_key_key" ON "bulk_import_jobs"("school_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
