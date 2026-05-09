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
