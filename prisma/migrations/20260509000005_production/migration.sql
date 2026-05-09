-- CreateTable: printers
CREATE TABLE "printers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FDM',
    "model_name" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "printers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "printers_type_check" CHECK (type IN ('FDM', 'resin', 'other'))
);

ALTER TABLE "printers" ADD CONSTRAINT "printers_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE INDEX "printers_tenant_idx" ON "printers"("tenant_id");

ALTER TABLE "printers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "printers_select_tenant" ON "printers" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "printers_insert_tenant" ON "printers" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "printers_update_tenant" ON "printers" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "printers_delete_tenant" ON "printers" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- CreateTable: materials
CREATE TABLE "materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PLA',
    "color" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "materials_type_check" CHECK (type IN ('PLA', 'ABS', 'PETG', 'resin', 'other'))
);

ALTER TABLE "materials" ADD CONSTRAINT "materials_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE INDEX "materials_tenant_idx" ON "materials"("tenant_id");

ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_select_tenant" ON "materials" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "materials_insert_tenant" ON "materials" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "materials_update_tenant" ON "materials" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "materials_delete_tenant" ON "materials" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- CreateTable: print_profiles
CREATE TABLE "print_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "printer_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    -- FDM fields (nullable)
    "layer_height_mm" DECIMAL(4,2),
    "nozzle_temp" INTEGER,
    "bed_temp" INTEGER,
    "print_speed_mm_s" INTEGER,
    "wall_count" INTEGER,
    "infill_pct" INTEGER,
    "supports" BOOLEAN,
    "brim_raft_skirt" TEXT,
    -- Resin fields (nullable)
    "exposure_time_s" DECIMAL(6,2),
    "bottom_exposure_time_s" DECIMAL(6,2),
    "lift_speed_mm_s" DECIMAL(6,2),
    "resin_layer_height_mm" DECIMAL(4,2),
    "supports_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "print_profiles_brim_check" CHECK (brim_raft_skirt IN ('none', 'brim', 'raft', 'skirt'))
);

ALTER TABLE "print_profiles" ADD CONSTRAINT "print_profiles_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "print_profiles" ADD CONSTRAINT "print_profiles_printer_id_fkey"
    FOREIGN KEY ("printer_id") REFERENCES "printers"("id") ON DELETE RESTRICT;
ALTER TABLE "print_profiles" ADD CONSTRAINT "print_profiles_material_id_fkey"
    FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;

CREATE INDEX "print_profiles_tenant_idx" ON "print_profiles"("tenant_id");

ALTER TABLE "print_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "print_profiles_select_tenant" ON "print_profiles" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "print_profiles_insert_tenant" ON "print_profiles" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "print_profiles_update_tenant" ON "print_profiles" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "print_profiles_delete_tenant" ON "print_profiles" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
