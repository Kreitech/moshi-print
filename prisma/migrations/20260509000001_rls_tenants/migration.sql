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
