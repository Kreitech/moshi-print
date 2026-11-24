-- Membership mutations go through server actions that check the actor and target roles.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.tenant_members FROM PUBLIC, anon, authenticated;
