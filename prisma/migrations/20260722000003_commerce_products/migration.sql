-- Commerce / product publishing layer: sellable products, variants, sales
-- channels, and manual/channel-specific listing drafts. No external
-- marketplace API integration happens here — channel_listings only stores
-- copy/paste-friendly draft content the user manages by hand.

-- sellable_products
CREATE TABLE "sellable_products" (
    "id"                          UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"                   UUID NOT NULL,
    "model_id"                    UUID,
    "name"                        TEXT NOT NULL,
    "description"                 TEXT,
    "base_price_amount"           NUMERIC(12, 2),
    "base_price_currency"         TEXT DEFAULT 'UYU',
    "production_cost_amount"      NUMERIC(12, 2),
    "production_cost_currency"    TEXT DEFAULT 'UYU',
    "estimated_margin_amount"     NUMERIC(12, 2),
    "estimated_margin_percentage" NUMERIC(5, 2),
    "lead_time_days"              INTEGER,
    "status"                      TEXT NOT NULL DEFAULT 'draft',
    "stock_mode"                  TEXT NOT NULL DEFAULT 'made_to_order',
    "available_quantity"          INTEGER,
    "commercial_use_allowed"      BOOLEAN,
    "attribution_required"        BOOLEAN,
    "license_notes"               TEXT,
    "notes"                       TEXT,
    "created_at"                  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sellable_products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sellable_products_status_check"
        CHECK (status IN ('draft', 'ready', 'published', 'paused', 'archived')),
    CONSTRAINT "sellable_products_stock_mode_check"
        CHECK (stock_mode IN ('made_to_order', 'in_stock')),
    CONSTRAINT "sellable_products_base_price_amount_check"
        CHECK (base_price_amount IS NULL OR base_price_amount >= 0),
    CONSTRAINT "sellable_products_production_cost_amount_check"
        CHECK (production_cost_amount IS NULL OR production_cost_amount >= 0),
    CONSTRAINT "sellable_products_lead_time_days_check"
        CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
    CONSTRAINT "sellable_products_available_quantity_check"
        CHECK (available_quantity IS NULL OR available_quantity >= 0)
);

ALTER TABLE "sellable_products" ADD CONSTRAINT "sellable_products_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "sellable_products" ADD CONSTRAINT "sellable_products_model_id_fkey"
    FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE SET NULL;

CREATE INDEX "sellable_products_tenant_status_idx" ON "sellable_products"("tenant_id", "status");
CREATE INDEX "sellable_products_tenant_idx" ON "sellable_products"("tenant_id");
CREATE INDEX "sellable_products_model_idx" ON "sellable_products"("model_id");

CREATE TRIGGER sellable_products_updated_at
    BEFORE UPDATE ON "sellable_products"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE "sellable_products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sellable_products_select_tenant" ON "sellable_products" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "sellable_products_insert_tenant" ON "sellable_products" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "sellable_products_update_tenant" ON "sellable_products" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "sellable_products_delete_tenant" ON "sellable_products" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- product_variants
CREATE TABLE "product_variants" (
    "id"                    UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"             UUID NOT NULL,
    "product_id"            UUID NOT NULL,
    "sku"                   TEXT,
    "color"                 TEXT,
    "size"                  TEXT,
    "material"              TEXT,
    "price_delta_amount"    NUMERIC(12, 2),
    "price_delta_currency"  TEXT DEFAULT 'UYU',
    "notes"                 TEXT,
    "created_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "sellable_products"("id") ON DELETE CASCADE;

CREATE INDEX "product_variants_product_idx" ON "product_variants"("product_id");
CREATE INDEX "product_variants_tenant_idx" ON "product_variants"("tenant_id");

CREATE TRIGGER product_variants_updated_at
    BEFORE UPDATE ON "product_variants"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_variants_select_tenant" ON "product_variants" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "product_variants_insert_tenant" ON "product_variants" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "product_variants_update_tenant" ON "product_variants" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "product_variants_delete_tenant" ON "product_variants" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- sales_channels
CREATE TABLE "sales_channels" (
    "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"           UUID NOT NULL,
    "provider"            TEXT NOT NULL,
    "status"              TEXT NOT NULL DEFAULT 'manual_only',
    "display_name"        TEXT NOT NULL,
    "connection_metadata" JSONB,
    "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_channels_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sales_channels_provider_check" CHECK (provider IN (
        'mercadolibre', 'instagram', 'facebook', 'tiendanube',
        'woocommerce', 'etsy', 'whatsapp', 'manual'
    )),
    CONSTRAINT "sales_channels_status_check"
        CHECK (status IN ('disconnected', 'connected', 'error', 'manual_only'))
);

ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE INDEX "sales_channels_tenant_idx" ON "sales_channels"("tenant_id");

CREATE TRIGGER sales_channels_updated_at
    BEFORE UPDATE ON "sales_channels"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE "sales_channels" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_channels_select_tenant" ON "sales_channels" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "sales_channels_insert_tenant" ON "sales_channels" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "sales_channels_update_tenant" ON "sales_channels" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "sales_channels_delete_tenant" ON "sales_channels" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- channel_listings
CREATE TABLE "channel_listings" (
    "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"           UUID NOT NULL,
    "product_id"          UUID NOT NULL,
    "sales_channel_id"    UUID,
    "provider"            TEXT NOT NULL,
    "external_listing_id" TEXT,
    "external_url"        TEXT,
    "status"              TEXT NOT NULL DEFAULT 'draft',
    "title"               TEXT NOT NULL,
    "description"         TEXT NOT NULL,
    "price_amount"        NUMERIC(12, 2),
    "price_currency"      TEXT DEFAULT 'UYU',
    "suggested_tags"      JSONB,
    "photo_checklist"     JSONB,
    "publish_payload"     JSONB,
    "error_message"       TEXT,
    "last_synced_at"      TIMESTAMPTZ(6),
    "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_listings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "channel_listings_provider_check" CHECK (provider IN (
        'mercadolibre', 'instagram', 'facebook', 'tiendanube',
        'woocommerce', 'etsy', 'whatsapp', 'manual'
    )),
    CONSTRAINT "channel_listings_status_check"
        CHECK (status IN ('draft', 'published', 'paused', 'error')),
    CONSTRAINT "channel_listings_price_amount_check"
        CHECK (price_amount IS NULL OR price_amount >= 0)
);

ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "sellable_products"("id") ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_sales_channel_id_fkey"
    FOREIGN KEY ("sales_channel_id") REFERENCES "sales_channels"("id") ON DELETE SET NULL;

CREATE INDEX "channel_listings_product_idx" ON "channel_listings"("product_id");
CREATE INDEX "channel_listings_tenant_idx" ON "channel_listings"("tenant_id");

CREATE TRIGGER channel_listings_updated_at
    BEFORE UPDATE ON "channel_listings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE "channel_listings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channel_listings_select_tenant" ON "channel_listings" FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "channel_listings_insert_tenant" ON "channel_listings" FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "channel_listings_update_tenant" ON "channel_listings" FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "channel_listings_delete_tenant" ON "channel_listings" FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
