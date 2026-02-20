-- CreateTable
CREATE TABLE "kb_chunks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "idx" INTEGER NOT NULL,
  "char_start" INTEGER NOT NULL,
  "char_end" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "source_updated_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "kb_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kb_chunks_document_id_idx_key" ON "kb_chunks"("document_id", "idx");
CREATE INDEX "kb_chunks_tenant_id_document_id_idx" ON "kb_chunks"("tenant_id", "document_id");
CREATE INDEX "kb_chunks_tenant_id_updated_at_idx" ON "kb_chunks"("tenant_id", "updated_at");

-- AddForeignKey
ALTER TABLE "kb_chunks" ADD CONSTRAINT "kb_chunks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kb_chunks" ADD CONSTRAINT "kb_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "kb_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
