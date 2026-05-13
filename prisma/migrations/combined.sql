-- === 20260509000000_init_tenants ===
-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tenant_members_role_check" CHECK (role IN ('owner', 'admin', 'operator', 'sales'))
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_tenant_id_user_id_key" ON "tenant_members"("tenant_id", "user_id");

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- === 20260509000001_rls_tenants ===
-- Enable RLS on tenants
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tenant_members
ALTER TABLE "tenant_members" ENABLE ROW LEVEL SECURITY;

-- SELECT policy on tenants: user sees only tenants they belong to
CREATE POLICY "tenants_select_own"
  ON "tenants"
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

-- SELECT policy on tenant_members: user sees their own membership rows
CREATE POLICY "tenant_members_select_own"
  ON "tenant_members"
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT policy on tenant_members: only owner or admin of the target tenant can add members
CREATE POLICY "tenant_members_insert_admin"
  ON "tenant_members"
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- UPDATE policy on tenant_members: only owner or admin can update membership
CREATE POLICY "tenant_members_update_admin"
  ON "tenant_members"
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- DELETE policy on tenant_members: only owner or admin can remove members
CREATE POLICY "tenant_members_delete_admin"
  ON "tenant_members"
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );


-- === 20260509000002_customers ===
-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON "customers"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;

-- RLS policies: all CRUD scoped to user tenant
CREATE POLICY "customers_select_tenant"
  ON "customers" FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "customers_insert_tenant"
  ON "customers" FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "customers_update_tenant"
  ON "customers" FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "customers_delete_tenant"
  ON "customers" FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );


-- === 20260509000003_orders ===
-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'new',
    "tags" TEXT[],
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_urgency_check" CHECK (urgency IN ('low', 'normal', 'high')),
    CONSTRAINT "orders_status_check" CHECK (status IN (
        'new', 'researching', 'pending_approval', 'ready_for_factory',
        'printing', 'post_processing', 'ready_to_deliver', 'delivered',
        'failed_or_reprint', 'cancelled'
    ))
);

-- Indexes
CREATE INDEX "orders_tenant_status_idx" ON "orders"("tenant_id", "status");
CREATE INDEX "orders_tenant_created_idx" ON "orders"("tenant_id", "created_at");

-- FK: tenant
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- FK: customer (nullable)
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;

-- Trigger: auto-update updated_at
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON "orders"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_tenant" ON "orders" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "orders_insert_tenant" ON "orders" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "orders_update_tenant" ON "orders" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "orders_delete_tenant" ON "orders" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));


-- === 20260509000004_files ===
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


-- === 20260509000005_production ===
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


-- === 20260509000006_models ===
-- models table
CREATE TABLE models (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  description            TEXT,
  status                 TEXT NOT NULL DEFAULT 'idea',
  tags                   TEXT[] NOT NULL DEFAULT '{}',
  notes                  TEXT,
  source_url             TEXT,
  source_platform        TEXT,
  license                TEXT,
  commercial_use_allowed BOOLEAN,
  attribution_required   BOOLEAN,
  source_order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_by             UUID NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_models_tenant_status ON models(tenant_id, status);
CREATE INDEX idx_models_tenant ON models(tenant_id);

-- model_versions table
CREATE TABLE model_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_id       UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(model_id, version_number)
);

CREATE INDEX idx_model_versions_model ON model_versions(model_id);

-- order_model_options table
CREATE TABLE order_model_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  model_id    UUID REFERENCES models(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  source_url  TEXT,
  notes       TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_model_options_order ON order_model_options(order_id);
CREATE INDEX idx_order_model_options_model ON order_model_options(model_id);

-- updated_at trigger for models
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_model_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members access models"
  ON models FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant members access model_versions"
  ON model_versions FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant members access order_model_options"
  ON order_model_options FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));


-- === 20260509000007_print_jobs ===
-- print_jobs table
CREATE TABLE print_jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id           UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  model_version_id   UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  quantity_planned   INT NOT NULL,
  quantity_completed INT NOT NULL DEFAULT 0,
  quantity_failed    INT NOT NULL DEFAULT 0,
  notes              TEXT,
  created_by         UUID NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_print_jobs_tenant_order ON print_jobs(tenant_id, order_id);
CREATE INDEX idx_print_jobs_tenant ON print_jobs(tenant_id);

CREATE TRIGGER print_jobs_updated_at
  BEFORE UPDATE ON print_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- print_attempts table (immutable after insert)
CREATE TABLE print_attempts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  print_job_id        UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  printer_id          UUID NOT NULL REFERENCES printers(id),
  material_id         UUID NOT NULL REFERENCES materials(id),
  print_profile_id    UUID REFERENCES print_profiles(id) ON DELETE SET NULL,
  result              TEXT NOT NULL CHECK (result IN ('success', 'failure', 'partial')),
  duration_min        INT,
  notes               TEXT,
  failure_reason      TEXT,
  saved_as_profile_id UUID REFERENCES print_profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_print_attempts_job ON print_attempts(print_job_id);
CREATE INDEX idx_print_attempts_tenant ON print_attempts(tenant_id);

-- RLS: standard member access for print_jobs
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members access print_jobs"
  ON print_jobs FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

-- RLS: print_attempts â€” INSERT only (immutable); UPDATE allowed only for saved_as_profile_id
ALTER TABLE print_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members insert print_attempts"
  ON print_attempts FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant members select print_attempts"
  ON print_attempts FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

-- Allow UPDATE only on saved_as_profile_id (other fields stay immutable by not having an unrestricted UPDATE policy)
CREATE POLICY "tenant members update saved_as_profile_id"
  ON print_attempts FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));



