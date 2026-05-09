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
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string | null;
          title: string;
          description: string | null;
          quantity: number;
          urgency: "low" | "normal" | "high";
          status: string;
          tags: string[];
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id?: string | null;
          title: string;
          description?: string | null;
          quantity?: number;
          urgency?: "low" | "normal" | "high";
          status?: string;
          tags?: string[];
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string | null;
          title?: string;
          description?: string | null;
          quantity?: number;
          urgency?: "low" | "normal" | "high";
          status?: string;
          tags?: string[];
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          tenant_id: string;
          entity_type: "order" | "model" | "model_version" | "print_job" | "print_attempt";
          entity_id: string;
          name: string;
          file_type: "stl" | "image" | "gcode" | "pdf" | "sliced" | "reference" | "other";
          gdrive_url: string | null;
          notes: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          entity_type: "order" | "model" | "model_version" | "print_job" | "print_attempt";
          entity_id: string;
          name: string;
          file_type?: "stl" | "image" | "gcode" | "pdf" | "sliced" | "reference" | "other";
          gdrive_url?: string | null;
          notes?: string | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          entity_type?: "order" | "model" | "model_version" | "print_job" | "print_attempt";
          entity_id?: string;
          name?: string;
          file_type?: "stl" | "image" | "gcode" | "pdf" | "sliced" | "reference" | "other";
          gdrive_url?: string | null;
          notes?: string | null;
          uploaded_by?: string;
          created_at?: string;
        };
      };
      printers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          type: "FDM" | "resin" | "other";
          model_name: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          type?: "FDM" | "resin" | "other";
          model_name?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          type?: "FDM" | "resin" | "other";
          model_name?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          brand: string | null;
          type: "PLA" | "ABS" | "PETG" | "resin" | "other";
          color: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          brand?: string | null;
          type?: "PLA" | "ABS" | "PETG" | "resin" | "other";
          color?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          brand?: string | null;
          type?: "PLA" | "ABS" | "PETG" | "resin" | "other";
          color?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      models: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          status: "idea" | "researching" | "ready_to_test" | "tested_ok" | "needs_adjustments" | "production_ready" | "discarded";
          tags: string[];
          notes: string | null;
          source_url: string | null;
          source_platform: string | null;
          license: string | null;
          commercial_use_allowed: boolean | null;
          attribution_required: boolean | null;
          source_order_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          status?: "idea" | "researching" | "ready_to_test" | "tested_ok" | "needs_adjustments" | "production_ready" | "discarded";
          tags?: string[];
          notes?: string | null;
          source_url?: string | null;
          source_platform?: string | null;
          license?: string | null;
          commercial_use_allowed?: boolean | null;
          attribution_required?: boolean | null;
          source_order_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          status?: "idea" | "researching" | "ready_to_test" | "tested_ok" | "needs_adjustments" | "production_ready" | "discarded";
          tags?: string[];
          notes?: string | null;
          source_url?: string | null;
          source_platform?: string | null;
          license?: string | null;
          commercial_use_allowed?: boolean | null;
          attribution_required?: boolean | null;
          source_order_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      model_versions: {
        Row: {
          id: string;
          tenant_id: string;
          model_id: string;
          version_number: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          model_id: string;
          version_number: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          model_id?: string;
          version_number?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      order_model_options: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          model_id: string | null;
          title: string;
          source_url: string | null;
          notes: string | null;
          is_selected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_id: string;
          model_id?: string | null;
          title: string;
          source_url?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          order_id?: string;
          model_id?: string | null;
          title?: string;
          source_url?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          created_at?: string;
        };
      };
      print_profiles: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          printer_id: string;
          material_id: string;
          notes: string | null;
          is_active: boolean;
          layer_height_mm: number | null;
          nozzle_temp: number | null;
          bed_temp: number | null;
          print_speed_mm_s: number | null;
          wall_count: number | null;
          infill_pct: number | null;
          supports: boolean | null;
          brim_raft_skirt: "none" | "brim" | "raft" | "skirt" | null;
          exposure_time_s: number | null;
          bottom_exposure_time_s: number | null;
          lift_speed_mm_s: number | null;
          resin_layer_height_mm: number | null;
          supports_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          printer_id: string;
          material_id: string;
          notes?: string | null;
          is_active?: boolean;
          layer_height_mm?: number | null;
          nozzle_temp?: number | null;
          bed_temp?: number | null;
          print_speed_mm_s?: number | null;
          wall_count?: number | null;
          infill_pct?: number | null;
          supports?: boolean | null;
          brim_raft_skirt?: "none" | "brim" | "raft" | "skirt" | null;
          exposure_time_s?: number | null;
          bottom_exposure_time_s?: number | null;
          lift_speed_mm_s?: number | null;
          resin_layer_height_mm?: number | null;
          supports_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          printer_id?: string;
          material_id?: string;
          notes?: string | null;
          is_active?: boolean;
          layer_height_mm?: number | null;
          nozzle_temp?: number | null;
          bed_temp?: number | null;
          print_speed_mm_s?: number | null;
          wall_count?: number | null;
          infill_pct?: number | null;
          supports?: boolean | null;
          brim_raft_skirt?: "none" | "brim" | "raft" | "skirt" | null;
          exposure_time_s?: number | null;
          bottom_exposure_time_s?: number | null;
          lift_speed_mm_s?: number | null;
          resin_layer_height_mm?: number | null;
          supports_notes?: string | null;
          created_at?: string;
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
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderUrgency = Order["urgency"];
export type FileRecord = Database["public"]["Tables"]["files"]["Row"];
export type FileEntityType = FileRecord["entity_type"];
export type FileType = FileRecord["file_type"];
export type Printer = Database["public"]["Tables"]["printers"]["Row"];
export type PrinterType = Printer["type"];
export type Material = Database["public"]["Tables"]["materials"]["Row"];
export type MaterialType = Material["type"];
export type PrintProfile = Database["public"]["Tables"]["print_profiles"]["Row"];
export type Model = Database["public"]["Tables"]["models"]["Row"];
export type ModelStatus = Model["status"];
export type ModelVersion = Database["public"]["Tables"]["model_versions"]["Row"];
export type OrderModelOption = Database["public"]["Tables"]["order_model_options"]["Row"];
