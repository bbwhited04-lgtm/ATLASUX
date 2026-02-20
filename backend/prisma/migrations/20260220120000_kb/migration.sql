-- CreateEnum
CREATE TYPE "kb_document_status" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "kb_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "kb_document_status" NOT NULL DEFAULT 'draft',
  "created_by" UUID NOT NULL,
  "updated_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "kb_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_tags" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "kb_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_tag_on_document" (
  "document_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "kb_tag_on_document_pkey" PRIMARY KEY ("document_id","tag_id")
);

-- Indexes
CREATE UNIQUE INDEX "kb_documents_tenant_id_slug_key" ON "kb_documents"("tenant_id","slug");
CREATE INDEX "kb_documents_tenant_id_status_updated_at_idx" ON "kb_documents"("tenant_id","status","updated_at");
CREATE UNIQUE INDEX "kb_tags_tenant_id_name_key" ON "kb_tags"("tenant_id","name");
CREATE INDEX "kb_tag_on_document_tag_id_idx" ON "kb_tag_on_document"("tag_id");

-- Foreign Keys
ALTER TABLE "kb_documents" ADD CONSTRAINT "kb_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_tags" ADD CONSTRAINT "kb_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_tag_on_document" ADD CONSTRAINT "kb_tag_on_document_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "kb_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_tag_on_document" ADD CONSTRAINT "kb_tag_on_document_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "kb_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
