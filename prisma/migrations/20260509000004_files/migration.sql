-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL DEFAULT 'other',
    "gdrive_url" TEXT,
    "notes" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "files_entity_type_check" CHECK (entity_type IN ('order', 'model', 'model_version', 'print_job', 'print_attempt')),
    CONSTRAINT "files_file_type_check" CHECK (file_type IN ('stl', 'image', 'gcode', 'pdf', 'sliced', 'reference', 'other'))
);

-- Index
CREATE INDEX "files_tenant_entity_idx" ON "files"("tenant_id", "entity_type", "entity_id");

-- FK
ALTER TABLE "files" ADD CONSTRAINT "files_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select_tenant" ON "files" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "files_insert_tenant" ON "files" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "files_delete_tenant" ON "files" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
