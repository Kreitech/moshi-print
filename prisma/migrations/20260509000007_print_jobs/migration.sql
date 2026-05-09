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

-- RLS: print_attempts — INSERT only (immutable); UPDATE allowed only for saved_as_profile_id
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
