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
