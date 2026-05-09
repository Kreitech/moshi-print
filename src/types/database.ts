// Auto-generated shape — regenerate with: npx supabase gen types typescript --local > src/types/database.ts
// Until Supabase CLI is configured, this hand-written stub matches the current migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      tenant_members: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: "owner" | "admin" | "operator" | "sales";
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: "owner" | "admin" | "operator" | "sales";
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "operator" | "sales";
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantMember = Database["public"]["Tables"]["tenant_members"]["Row"];
export type TenantRole = TenantMember["role"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
