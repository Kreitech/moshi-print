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
          charged_price_amount: number | null;
          charged_price_currency: string | null;
          charged_price_notes: string | null;
          quoted_price_amount: number | null;
          quoted_price_currency: string | null;
          payment_status: "not_tracked" | "pending" | "partial" | "paid";
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
          charged_price_amount?: number | null;
          charged_price_currency?: string | null;
          charged_price_notes?: string | null;
          quoted_price_amount?: number | null;
          quoted_price_currency?: string | null;
          payment_status?: "not_tracked" | "pending" | "partial" | "paid";
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
          charged_price_amount?: number | null;
          charged_price_currency?: string | null;
          charged_price_notes?: string | null;
          quoted_price_amount?: number | null;
          quoted_price_currency?: string | null;
          payment_status?: "not_tracked" | "pending" | "partial" | "paid";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenant_storage_connections: {
        Row: {
          id: string;
          tenant_id: string;
          provider: string;
          access_token_enc: string;
          refresh_token_enc: string;
          token_expiry: string;
          drive_folder_id: string;
          drive_folder_url: string;
          connected_by: string;
          connected_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          provider?: string;
          access_token_enc: string;
          refresh_token_enc: string;
          token_expiry: string;
          drive_folder_id: string;
          drive_folder_url: string;
          connected_by: string;
          connected_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          provider?: string;
          access_token_enc?: string;
          refresh_token_enc?: string;
          token_expiry?: string;
          drive_folder_id?: string;
          drive_folder_url?: string;
          connected_by?: string;
          connected_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          tenant_id: string;
          entity_type: "order" | "model" | "model_version" | "print_job" | "print_attempt";
          entity_id: string;
          storage_connection_id: string | null;
          drive_file_id: string | null;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          file_category: string;
          web_view_link: string | null;
          notes: string | null;
          uploaded_by_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          entity_type: "order" | "model" | "model_version" | "print_job" | "print_attempt";
          entity_id: string;
          storage_connection_id?: string | null;
          drive_file_id?: string | null;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          file_category?: string;
          web_view_link?: string | null;
          notes?: string | null;
          uploaded_by_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          entity_type?: "order" | "model" | "model_version" | "print_job" | "print_attempt";
          entity_id?: string;
          storage_connection_id?: string | null;
          drive_file_id?: string | null;
          file_name?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          file_category?: string;
          web_view_link?: string | null;
          notes?: string | null;
          uploaded_by_user_id?: string | null;
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
      print_jobs: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          model_version_id: string | null;
          status: "pending" | "running" | "completed" | "failed";
          quantity_planned: number;
          quantity_completed: number;
          quantity_failed: number;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_id: string;
          model_version_id?: string | null;
          status?: "pending" | "running" | "completed" | "failed";
          quantity_planned: number;
          quantity_completed?: number;
          quantity_failed?: number;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          order_id?: string;
          model_version_id?: string | null;
          status?: "pending" | "running" | "completed" | "failed";
          quantity_planned?: number;
          quantity_completed?: number;
          quantity_failed?: number;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      print_attempts: {
        Row: {
          id: string;
          tenant_id: string;
          print_job_id: string;
          printer_id: string;
          material_id: string;
          print_profile_id: string | null;
          result: "success" | "failure" | "partial";
          duration_min: number | null;
          notes: string | null;
          failure_reason: string | null;
          saved_as_profile_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          print_job_id: string;
          printer_id: string;
          material_id: string;
          print_profile_id?: string | null;
          result: "success" | "failure" | "partial";
          duration_min?: number | null;
          notes?: string | null;
          failure_reason?: string | null;
          saved_as_profile_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          print_job_id?: string;
          printer_id?: string;
          material_id?: string;
          print_profile_id?: string | null;
          result?: "success" | "failure" | "partial";
          duration_min?: number | null;
          notes?: string | null;
          failure_reason?: string | null;
          saved_as_profile_id?: string | null;
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
          attribution_text: string | null;
          license_notes: string | null;
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
          attribution_text?: string | null;
          license_notes?: string | null;
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
          attribution_text?: string | null;
          license_notes?: string | null;
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
      sellable_products: {
        Row: {
          id: string;
          tenant_id: string;
          model_id: string | null;
          name: string;
          description: string | null;
          base_price_amount: number | null;
          base_price_currency: string | null;
          production_cost_amount: number | null;
          production_cost_currency: string | null;
          estimated_margin_amount: number | null;
          estimated_margin_percentage: number | null;
          lead_time_days: number | null;
          status: "draft" | "ready" | "published" | "paused" | "archived";
          stock_mode: "made_to_order" | "in_stock";
          available_quantity: number | null;
          commercial_use_allowed: boolean | null;
          attribution_required: boolean | null;
          license_notes: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          model_id?: string | null;
          name: string;
          description?: string | null;
          base_price_amount?: number | null;
          base_price_currency?: string | null;
          production_cost_amount?: number | null;
          production_cost_currency?: string | null;
          estimated_margin_amount?: number | null;
          estimated_margin_percentage?: number | null;
          lead_time_days?: number | null;
          status?: "draft" | "ready" | "published" | "paused" | "archived";
          stock_mode?: "made_to_order" | "in_stock";
          available_quantity?: number | null;
          commercial_use_allowed?: boolean | null;
          attribution_required?: boolean | null;
          license_notes?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          model_id?: string | null;
          name?: string;
          description?: string | null;
          base_price_amount?: number | null;
          base_price_currency?: string | null;
          production_cost_amount?: number | null;
          production_cost_currency?: string | null;
          estimated_margin_amount?: number | null;
          estimated_margin_percentage?: number | null;
          lead_time_days?: number | null;
          status?: "draft" | "ready" | "published" | "paused" | "archived";
          stock_mode?: "made_to_order" | "in_stock";
          available_quantity?: number | null;
          commercial_use_allowed?: boolean | null;
          attribution_required?: boolean | null;
          license_notes?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          tenant_id: string;
          product_id: string;
          sku: string | null;
          color: string | null;
          size: string | null;
          material: string | null;
          price_delta_amount: number | null;
          price_delta_currency: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          product_id: string;
          sku?: string | null;
          color?: string | null;
          size?: string | null;
          material?: string | null;
          price_delta_amount?: number | null;
          price_delta_currency?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          product_id?: string;
          sku?: string | null;
          color?: string | null;
          size?: string | null;
          material?: string | null;
          price_delta_amount?: number | null;
          price_delta_currency?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_channels: {
        Row: {
          id: string;
          tenant_id: string;
          provider:
            | "mercadolibre"
            | "instagram"
            | "facebook"
            | "tiendanube"
            | "woocommerce"
            | "etsy"
            | "whatsapp"
            | "manual";
          status: "disconnected" | "connected" | "error" | "manual_only";
          display_name: string;
          connection_metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          provider:
            | "mercadolibre"
            | "instagram"
            | "facebook"
            | "tiendanube"
            | "woocommerce"
            | "etsy"
            | "whatsapp"
            | "manual";
          status?: "disconnected" | "connected" | "error" | "manual_only";
          display_name: string;
          connection_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          provider?:
            | "mercadolibre"
            | "instagram"
            | "facebook"
            | "tiendanube"
            | "woocommerce"
            | "etsy"
            | "whatsapp"
            | "manual";
          status?: "disconnected" | "connected" | "error" | "manual_only";
          display_name?: string;
          connection_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      channel_listings: {
        Row: {
          id: string;
          tenant_id: string;
          product_id: string;
          sales_channel_id: string | null;
          provider:
            | "mercadolibre"
            | "instagram"
            | "facebook"
            | "tiendanube"
            | "woocommerce"
            | "etsy"
            | "whatsapp"
            | "manual";
          external_listing_id: string | null;
          external_url: string | null;
          status: "draft" | "published" | "paused" | "error";
          title: string;
          description: string;
          price_amount: number | null;
          price_currency: string | null;
          suggested_tags: Json | null;
          photo_checklist: Json | null;
          publish_payload: Json | null;
          error_message: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          product_id: string;
          sales_channel_id?: string | null;
          provider:
            | "mercadolibre"
            | "instagram"
            | "facebook"
            | "tiendanube"
            | "woocommerce"
            | "etsy"
            | "whatsapp"
            | "manual";
          external_listing_id?: string | null;
          external_url?: string | null;
          status?: "draft" | "published" | "paused" | "error";
          title: string;
          description: string;
          price_amount?: number | null;
          price_currency?: string | null;
          suggested_tags?: Json | null;
          photo_checklist?: Json | null;
          publish_payload?: Json | null;
          error_message?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          product_id?: string;
          sales_channel_id?: string | null;
          provider?:
            | "mercadolibre"
            | "instagram"
            | "facebook"
            | "tiendanube"
            | "woocommerce"
            | "etsy"
            | "whatsapp"
            | "manual";
          external_listing_id?: string | null;
          external_url?: string | null;
          status?: "draft" | "published" | "paused" | "error";
          title?: string;
          description?: string;
          price_amount?: number | null;
          price_currency?: string | null;
          suggested_tags?: Json | null;
          photo_checklist?: Json | null;
          publish_payload?: Json | null;
          error_message?: string | null;
          last_synced_at?: string | null;
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
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderUrgency = Order["urgency"];
export type PaymentStatus = Order["payment_status"];
export type TenantStorageConnection = Database["public"]["Tables"]["tenant_storage_connections"]["Row"];
export type FileRecord = Database["public"]["Tables"]["files"]["Row"];
export type FileEntityType = FileRecord["entity_type"];
export type Printer = Database["public"]["Tables"]["printers"]["Row"];
export type PrinterType = Printer["type"];
export type Material = Database["public"]["Tables"]["materials"]["Row"];
export type MaterialType = Material["type"];
export type PrintProfile = Database["public"]["Tables"]["print_profiles"]["Row"];
export type PrintJob = Database["public"]["Tables"]["print_jobs"]["Row"];
export type PrintJobStatus = PrintJob["status"];
export type PrintAttempt = Database["public"]["Tables"]["print_attempts"]["Row"];
export type PrintAttemptResult = PrintAttempt["result"];
export type Model = Database["public"]["Tables"]["models"]["Row"];
export type ModelStatus = Model["status"];
export type ModelVersion = Database["public"]["Tables"]["model_versions"]["Row"];
export type OrderModelOption = Database["public"]["Tables"]["order_model_options"]["Row"];
export type SellableProduct = Database["public"]["Tables"]["sellable_products"]["Row"];
export type SellableProductStatus = SellableProduct["status"];
export type StockMode = SellableProduct["stock_mode"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type SalesChannel = Database["public"]["Tables"]["sales_channels"]["Row"];
export type SalesChannelProvider = SalesChannel["provider"];
export type SalesChannelStatus = SalesChannel["status"];
export type ChannelListing = Database["public"]["Tables"]["channel_listings"]["Row"];
export type ChannelListingStatus = ChannelListing["status"];
